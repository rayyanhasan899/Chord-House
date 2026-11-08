"""Build a metadata-only pack from reviewed MusicBrainz core identities."""

import json
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parents[1]
rows = json.loads(
    (root / ".artifacts/song-metadata-review.json").read_text(encoding="utf-8")
)
candidates = json.loads(
    (root / "scripts/song-candidates.json").read_text(encoding="utf-8")
)
native = {
    "Aadat": ["عادت"],
    "Woh Lamhe": ["Woh Lamhey", "وہ لمحے"],
    "Sajni": ["سجنی"],
    "Bikhra Hoon Main": ["Bikhra Hun Main", "بکھرا ہوں میں"],
    "Doorie": ["Doori", "دوری"],
    "Ehsaas": ["Ehsas", "احساس"],
    "Jal Pari": ["جل پری"],
    "Kuch Is Tarah": ["کچھ اس طرح"],
    "Dil Dil Pakistan": ["دل دل پاکستان"],
    "Aitebar": ["Aitbaar", "Aetbaar", "اعتبار"],
    "Duur": ["Door", "دور"],
    "Dhaani": ["Dhani", "دھانی"],
    "Hona Tha Pyar": ["Hona Tha Pyaar", "ہونا تھا پیار"],
    "Afreen Afreen": ["Aafreen Aafreen", "آفریں آفریں"],
    "Tum Hi Ho": ["तुम ही हो"],
    "Channa Mereya": ["Channa Merya", "चन्ना मेरेया"],
    "Raabta": ["Rabta", "राब्ता"],
    "Kesariya": ["केसरिया"],
    "Shayad": ["शायद"],
    "Tu Jaane Na": ["Tu Jane Na", "तू जाने ना"],
    "Jeena Jeena": ["जीना जीना"],
    "O Sanam": ["ओ सनम"],
    "Pehla Nasha": ["पहला नशा"],
    "Yaaron": ["Yaron", "यारों"],
    "Tum Se Hi": ["Tumse Hi", "तुम से ही"],
    "Pee Loon": ["Pee Lun", "पी लूँ"],
}
selections = json.loads(
    (root / "scripts/song-metadata-selections.json").read_text(encoding="utf-8")
)
selected = {
    (r["language"], r["candidate_title"]): r["recording_id"] for r in selections
}
items = []
blocked = []
seen = set()
for language, songs in candidates.items():
    for title, artist in songs:
        row = next(
            r
            for r in reversed(rows)
            if (r["language"], r["candidate_title"], r["candidate_artist"])
            == (language, title, artist)
        )
        chosen_id = selected.get((language, title))
        choices = [c for c in row["candidates"] if c["id"] == chosen_id]
        if not choices:
            blocked.append(
                dict(
                    title=title,
                    artist=artist,
                    language=language,
                    reason=(
                        "No reviewed source selection / verified recording match yet"
                    ),
                )
            )
            continue
        chosen = choices[0]
        if chosen["id"] in seen:
            blocked.append(
                dict(
                    title=title,
                    artist=artist,
                    language=language,
                    reason="Duplicate recording identity",
                )
            )
            continue
        seen.add(chosen["id"])
        aliases = list(dict.fromkeys([title, *native.get(title, [])]))
        items.append(
            dict(
                external_key="musicbrainz:recording:" + chosen["id"],
                title=chosen["title"],
                artist=chosen["artist"],
                language=language,
                aliases=aliases,
                version_note=chosen["disambiguation"],
                genre=None,
                metadata_grant=dict(
                    origin="third_party",
                    license="CC0 1.0 — MusicBrainz core metadata",
                    source_url="https://musicbrainz.org/recording/" + chosen["id"],
                    attribution=(
                        "MusicBrainz core recording/artist metadata; "
                        "Chord House editorial language and title aliases"
                    ),
                    evidence=(
                        "Recording ID/title/artist credit matched via "
                        "MusicBrainz API on 2026-11-08. Core metadata CC0 "
                        "scope confirmed at "
                        "https://musicbrainz.org/doc/MusicBrainz_Database . "
                        "This does not grant lyrics, arrangements, "
                        "recordings or artwork rights."
                    ),
                    terms_version="MusicBrainz data license checked 2026-11-08",
                    reviewer="Chord House metadata review",
                    reviewed=True,
                    display=True,
                    cache=True,
                    transpose=False,
                    territories=["*"],
                    expires_at=None,
                ),
                arrangements=[],
                texts=[],
                lyrics_url=None,
                lyrics_link_verified=False,
            )
        )
path = root / "backend/app/modules/catalog/data/popular-songs.json"
path.write_text(
    json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
inventory = dict(
    metadata_counts=dict(Counter(s["language"] for s in items)),
    popular_approved_arrangements=0,
    popular_approved_texts=0,
    blocked_metadata=blocked,
    rights_backlog=[
        dict(
            title=s["title"],
            artist=s["artist"],
            language=s["language"],
            source=s["metadata_grant"]["source_url"],
            missing=[
                "Arrangement permission and musical review",
                "Lyrics/transliteration display and cache grant",
                "Authorized lyrics link review",
            ],
        )
        for s in items
    ],
)
originals = json.loads(
    (root / "backend/app/modules/catalog/data/original-songs.json").read_text(
        encoding="utf-8"
    )
)
inventory.update(
    snapshot_date="2026-11-08",
    snapshot_scope=(
        "Bundled seed pack; later operator imports/withdrawals change live coverage."
    ),
    original_practice_songs=[
        dict(
            title=s["title"],
            language=s["language"],
            arrangements=len(s["arrangements"]),
            text_variants=[t["language"] + "-" + t["script"] for t in s["texts"]],
            limitations=(
                "Original lyric/chord practice work; no supplied melody or recording."
            ),
        )
        for s in originals
    ],
    total_bundled_songs=len(items) + len(originals),
    total_original_arrangements=sum(len(s["arrangements"]) for s in originals),
    total_original_text_variants=sum(len(s["texts"]) for s in originals),
)
(root / "docs/implementation/SONG-CONTENT-INVENTORY.json").write_text(
    json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(
    "Popular metadata:",
    len(items),
    dict(Counter(s["language"] for s in items)),
    "unmatched:",
    len(blocked),
)
