"""Run a production browser journey with real API/database and private local mail."""

import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.request import urlopen


def run_browser(env: dict[str, str]) -> int:
    root = Path(__file__).resolve().parents[2]
    npm = shutil.which("npm")
    if not npm:
        raise RuntimeError("npm is required")
    child_env = env | {
        "CHORD_DATABASE_URL": env["CHORD_TEST_DATABASE_URL"],
        "CHORD_ENVIRONMENT": "test",
        "CHORD_TRUSTED_ORIGINS": '["http://127.0.0.1:3100"]',
        "CHORD_API_ORIGIN": "http://127.0.0.1:8100",
        "CHORD_AUTH_LIMIT": "200",
    }
    with tempfile.TemporaryDirectory(prefix="chord-house-mail-") as folder:
        child_env["CHORD_MAIL_DIRECTORY"] = folder
        child_env["CHORD_E2E_MAIL_DIR"] = folder
        child_env.pop("CHORD_SMTP_HOST", None)
        child_env.pop("CHORD_DATABASE_URL_UNPOOLED", None)
        server = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "app.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                "8100",
                "--no-access-log",
            ],
            cwd=root / "backend",
            env=child_env,
            stdout=subprocess.DEVNULL,
        )
        try:
            for _ in range(60):
                if server.poll() is not None:
                    raise RuntimeError("Test API did not start; check port 8100")
                try:
                    with urlopen(
                        "http://127.0.0.1:8100/api/v1/health/ready", timeout=2
                    ) as response:
                        if response.status == 200:
                            break
                except OSError:
                    time.sleep(0.5)
            else:
                raise RuntimeError("Test API did not become ready")
            subprocess.run([npm, "run", "build"], cwd=root, env=child_env, check=True)
            return subprocess.run(
                [npm, "run", "test:e2e"], cwd=root, env=child_env
            ).returncode
        finally:
            server.terminate()
            server.wait(timeout=15)


if __name__ == "__main__":
    sys.exit(run_browser(os.environ.copy()))
