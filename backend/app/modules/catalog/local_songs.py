"""Owner-supplied files; never fetch remote recordings or lyrics."""

from pathlib import Path

from app.modules.catalog.song_domain import normalize

LANGUAGES = {"en": "English songs", "ur": "Urdu songs", "hi": "Hindi songs"}


def song_folder(root: Path, language: str, title: str) -> Path | None:
    root = root.resolve()
    parent = root / LANGUAGES.get(language, "unsupported")
    if not parent.is_dir():
        return None
    matches = [
        p.resolve()
        for p in parent.iterdir()
        if p.is_dir()
        and normalize(p.name) == normalize(title)
        and p.resolve().is_relative_to(root)
    ]
    return matches[0] if len(matches) == 1 else None


def song_file(folder: Path | None, name: str) -> Path | None:
    if folder is None:
        return None
    path = (folder / name).resolve()
    return path if path.is_relative_to(folder) and path.is_file() else None


def lyrics_text(folder: Path | None) -> str | None:
    path = song_file(folder, "lyrics.txt")
    if path is None or path.stat().st_size > 400000:
        return None
    try:
        value = path.read_bytes().decode("utf-8-sig")
        return value if value.strip() else None
    except UnicodeError, OSError:
        return None


def has_audio(folder: Path | None) -> bool:
    path = song_file(folder, "audio.mp3")
    return path is not None and path.stat().st_size > 0


def supplied_folders(root: Path) -> list[tuple[str, Path]]:
    result = []
    for language, name in LANGUAGES.items():
        parent = root / name
        if not parent.is_dir():
            continue
        for folder in sorted(parent.iterdir()):
            if not folder.is_dir():
                continue
            matched = song_folder(root, language, folder.name)
            if matched is not None and (has_audio(matched) or lyrics_text(matched)):
                result.append((language, matched))
    return result
