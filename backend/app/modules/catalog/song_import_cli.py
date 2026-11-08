"""Stage or commit a local reviewed pack through the authorized application API."""

import argparse
import getpass
import http.cookiejar
import json
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="http://127.0.0.1:3000")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--file", type=Path, help="ImportInput JSON including unique key and items"
    )
    group.add_argument("--commit", help="Previously reviewed staged import UUID")
    args = parser.parse_args()
    parsed = urlparse(args.base)
    if parsed.scheme != "https" and not (
        parsed.scheme == "http" and parsed.hostname in ("127.0.0.1", "localhost", "::1")
    ):
        parser.error("Use HTTPS except for loopback development")
    base = args.base.rstrip("/")
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())
    )
    csrf = ""

    def post(path: str, data: object) -> dict[str, object]:
        request = urllib.request.Request(
            base + path,
            data=json.dumps(data).encode(),
            headers={
                "Content-Type": "application/json",
                "Origin": base,
                "X-CSRF-Token": csrf,
            },
        )
        try:
            with opener.open(request, timeout=30) as response:
                result: dict[str, object] = json.load(response)
                return result
        except urllib.error.HTTPError as error:
            raise SystemExit(
                f"API rejected request (HTTP {error.code}). "
                "Check role, preview issues and trusted origin."
            ) from None

    email = input("Content manager email: ")
    password = getpass.getpass("Password (hidden): ")
    profile = post("/api/v1/auth/login", dict(email=email, password=password))
    csrf = str(profile["csrf_token"])
    try:
        if args.file:
            if args.file.stat().st_size > 2_000_000:
                parser.error("Split import files larger than 2 MB into smaller batches")
            data = json.loads(args.file.read_text(encoding="utf-8"))
            result = post("/api/v1/song-imports", data)
        else:
            from uuid import UUID

            identifier = UUID(args.commit)
            result = post(f"/api/v1/song-imports/{identifier}/commit", {})
        print(json.dumps(result, indent=2))
    finally:
        post("/api/v1/auth/logout", {})


if __name__ == "__main__":
    main()
