"""Explicit metadata-only acquisition. Writes a review file, never publishes it."""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / ".artifacts" / "song-metadata-review.json"
path.parent.mkdir(exist_ok=True)
results = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
done = {
    (r["language"], r["candidate_title"], r["candidate_artist"])
    for r in results
    if r["candidates"]
}
candidates = json.loads(
    (root / "scripts/song-candidates.json").read_text(encoding="utf-8")
)
for language, songs in candidates.items():
    for title, artist in songs:
        if (language, title, artist) in done:
            continue
        query = f'recording:"{title}" AND artist:"{artist}"'
        url = "https://musicbrainz.org/ws/2/recording/?" + urllib.parse.urlencode(
            dict(query=query, fmt="json", limit=20)
        )
        row = dict(
            language=language,
            candidate_title=title,
            candidate_artist=artist,
            candidates=[],
        )
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "ChordHouse/0.1 (https://github.com/rayyanhasan899/Chord-House)"
                },
            )
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.load(response)
            row["candidates"] = [
                dict(
                    id=r["id"],
                    title=r["title"],
                    artist="".join(
                        a.get("name", "") + a.get("joinphrase", "")
                        for a in r.get("artist-credit", [])
                        if isinstance(a, dict)
                    ),
                    score=r.get("score"),
                    disambiguation=r.get("disambiguation", ""),
                )
                for r in data.get("recordings", [])
            ]
        except Exception as error:
            row["error"] = type(error).__name__
        results.append(row)
        path.write_text(
            json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        if len(results) % 10 == 0:
            print(f"Reviewed API candidates {len(results)}", flush=True)
        time.sleep(1.15)
print(
    f"Metadata review ready: {len(results)} candidates; "
    "no lyrics/arrangements fetched.",
    flush=True,
)
