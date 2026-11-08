"""Run the full suite against an isolated disposable local PostgreSQL container."""

import os
import secrets
import subprocess
import sys
import time
from uuid import uuid4

name = "chord-house-test-" + uuid4().hex[:12]
env = os.environ.copy()
env["POSTGRES_PASSWORD"] = secrets.token_hex(24)
try:
    subprocess.run(
        [
            "docker",
            "run",
            "--rm",
            "-d",
            "--name",
            name,
            "-e",
            "POSTGRES_PASSWORD",
            "-e",
            "POSTGRES_DB=chord_house_test",
            "-p",
            "127.0.0.1::5432",
            "postgres:17.9",
        ],
        env=env,
        check=True,
        stdout=subprocess.DEVNULL,
    )
    for _ in range(60):
        result = subprocess.run(
            ["docker", "exec", name, "pg_isready", "-U", "postgres"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if result.returncode == 0:
            break
        time.sleep(1)
    else:
        raise RuntimeError("Temporary PostgreSQL did not become ready")
    port = (
        subprocess.check_output(["docker", "port", name, "5432"], text=True)
        .strip()
        .rsplit(":", 1)[1]
    )
    env["CHORD_TEST_DATABASE_URL"] = (
        "postgresql+psycopg://postgres:"
        + env["POSTGRES_PASSWORD"]
        + "@127.0.0.1:"
        + port
        + "/chord_house_test"
    )
    result = subprocess.run([sys.executable, "-m", "pytest", "tests"], env=env)
finally:
    subprocess.run(
        ["docker", "stop", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
sys.exit(result.returncode)
