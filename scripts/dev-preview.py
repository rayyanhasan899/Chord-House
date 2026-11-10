"""Run a separate persistent preview without changing the personal database."""

import os
import re
import secrets
import shutil
import socket
import subprocess
import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    config = root / ".env.preview"
    if not config.exists():
        volumes = subprocess.run(
            ["docker", "volume", "ls", "--format", "{{.Name}}"],
            capture_output=True,
            text=True,
            timeout=15,
            check=True,
        )
        if "chord-house-phase16-preview_preview_pgdata" in volumes.stdout.splitlines():
            raise RuntimeError(
                "Preview database exists. Restore its original .env.preview; "
                "do not replace credentials or delete the volume."
            )
        with config.open("x", encoding="utf-8") as stream:
            config.chmod(0o600)
            stream.write("CHORD_PREVIEW_PASSWORD=" + secrets.token_hex(24) + "\n")
    # Deliberately do not load the personal .env or accept arbitrary shell values.
    match = re.fullmatch(
        r"CHORD_PREVIEW_PASSWORD=([a-f0-9]{48})\s*",
        config.read_text(encoding="utf-8"),
    )
    if match is None:
        raise RuntimeError("Restore the original valid .env.preview")
    env = os.environ.copy()
    env.pop("CHORD_PREVIEW_PASSWORD", None)
    subprocess.run(
        [
            "docker",
            "compose",
            "--env-file",
            str(config),
            "-f",
            "compose.preview.yaml",
            "up",
            "-d",
            "--build",
            "--wait",
            "--wait-timeout",
            "150",
        ],
        cwd=root,
        env=env,
        check=True,
        timeout=1200,
    )
    print("Preview API ready: http://127.0.0.1:8001/docs", flush=True)
    if "--backend-only" in sys.argv:
        return
    npm = shutil.which("npm")
    if npm is None:
        raise RuntimeError("Node/npm is required; run npm ci in this checkout first")
    with socket.socket() as sock:
        if sock.connect_ex(("127.0.0.1", 3001)) == 0:
            raise RuntimeError(
                "Port 3001 is occupied; existing frontend left unchanged"
            )
    print(
        "Open http://127.0.0.2:3001 (use 127.0.0.2 to isolate the login cookie). "
        "Register a preview account; personal data has not been copied.",
        flush=True,
    )
    child = subprocess.Popen(
        [
            npm,
            "exec",
            "--workspace",
            "frontend",
            "--",
            "next",
            "dev",
            "--hostname",
            "127.0.0.2",
            "--port",
            "3001",
        ],
        cwd=root,
        env=env | {"CHORD_API_ORIGIN": "http://127.0.0.1:8001"},
    )
    try:
        if child.wait() != 0:
            raise RuntimeError("Preview frontend stopped unexpectedly")
    except KeyboardInterrupt:
        child.terminate()
        child.wait(timeout=15)


if __name__ == "__main__":
    main()
