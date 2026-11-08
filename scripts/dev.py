"""Start local Chord House without printing or committing credentials."""

import os
import secrets
import shutil
import socket
import subprocess
import sys
from pathlib import Path

from dotenv import dotenv_values

root = Path(__file__).resolve().parents[1]
config_file = root / ".env"
if not config_file.exists():
    existing = subprocess.run(
        ["docker", "volume", "inspect", "chord-house_chord_house_pgdata"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if existing.returncode == 0:
        raise RuntimeError(
            "Existing database volume found. Restore its original credentials in the ignored root .env; do not replace them."
        )
    password = secrets.token_hex(24)
    with config_file.open("x", encoding="utf-8") as config:
        config_file.chmod(0o600)
        config.write(
            "CHORD_DB_PASSWORD="
            + password
            + "\nCHORD_DATABASE_URL=postgresql+psycopg://chord_house:"
            + password
            + "@127.0.0.1:5433/chord_house\n"
        )
env = os.environ.copy() | {
    key: value for key, value in dotenv_values(config_file).items() if value is not None
}
if not env.get("CHORD_DB_PASSWORD") or not env.get("CHORD_DATABASE_URL"):
    raise RuntimeError("Local .env requires CHORD_DB_PASSWORD and CHORD_DATABASE_URL")
subprocess.run(
    ["docker", "compose", "up", "-d", "--wait", "db"], cwd=root, env=env, check=True
)
subprocess.run(
    [sys.executable, "-m", "alembic", "-c", "backend/alembic.ini", "upgrade", "head"],
    cwd=root,
    env=env,
    check=True,
)
subprocess.run(
    [sys.executable, "-m", "app.modules.catalog.seeds"],
    cwd=root / "backend",
    env=env,
    check=True,
)
children: list[subprocess.Popen[bytes]] = []
try:
    children.append(
        subprocess.Popen(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "app.main:app",
                "--app-dir",
                "backend",
                "--host",
                "127.0.0.1",
                "--port",
                "8000",
                "--no-access-log",
            ],
            cwd=root,
            env=env,
        )
    )
    if "--backend-only" not in sys.argv:
        with socket.socket() as sock:
            listening = sock.connect_ex(("127.0.0.1", 3000)) == 0
        if listening:
            print(
                "Frontend already listening on port 3000; keeping it unchanged.",
                flush=True,
            )
        else:
            npm = shutil.which("npm")
            if not npm:
                raise RuntimeError("npm is required")
            children.append(subprocess.Popen([npm, "run", "dev"], cwd=root, env=env))
    print(
        "Chord House: http://127.0.0.1:3000 · API: http://127.0.0.1:8000/docs",
        flush=True,
    )
    if children[0].wait() != 0:
        raise RuntimeError(
            "Backend stopped unexpectedly; check port 8000 and startup output"
        )
except KeyboardInterrupt:
    pass
finally:
    for child in children:
        if child.poll() is None:
            child.terminate()
            child.wait(timeout=15)
