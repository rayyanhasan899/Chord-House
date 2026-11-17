from pathlib import Path

from app.modules.catalog.local_songs import song_file, song_folder


def test_matching_and_missing_files(tmp_path: Path) -> None:
    folder = tmp_path / "Urdu songs" / "Aadat"
    folder.mkdir(parents=True)
    (folder / "lyrics.txt").write_text("Practice text", encoding="utf-8")
    assert song_folder(tmp_path, "ur", "aadat") == folder
    assert song_folder(tmp_path, "en", "Aadat") is None
    assert song_file(folder, "lyrics.txt") == folder / "lyrics.txt"
    assert song_file(folder, "audio.mp3") is None
    assert song_file(folder, "../../outside.txt") is None


def test_symlink_cannot_escape_song_folder(tmp_path: Path) -> None:
    folder = tmp_path / "Urdu songs" / "Aadat"
    folder.mkdir(parents=True)
    outside = tmp_path / "outside.txt"
    outside.write_text("private", encoding="utf-8")
    (folder / "lyrics.txt").symlink_to(outside)
    assert song_file(folder, "lyrics.txt") is None


def test_only_nonempty_supported_content_is_listed(tmp_path: Path) -> None:
    from app.modules.catalog.local_songs import supplied_folders

    root = tmp_path / "Hindi songs"
    empty = root / "Empty"
    empty.mkdir(parents=True)
    (empty / "lyrics.txt").write_text("   ", encoding="utf-8")
    invalid = root / "Invalid"
    invalid.mkdir()
    (invalid / "lyrics.txt").write_bytes(b"\xff\xfe\xff")
    valid = root / "New song"
    valid.mkdir()
    (valid / "audio.mp3").write_bytes(b"ID3example")
    assert supplied_folders(tmp_path) == [("hi", valid)]


def test_case_ambiguous_folders_are_not_guessed(tmp_path: Path) -> None:
    parent = tmp_path / "Urdu songs"
    parent.mkdir()
    (parent / "Aadat").mkdir()
    # Linux production filesystem can contain both spellings.
    second = parent / "AADAT"
    if second.exists():
        return
    second.mkdir()
    assert song_folder(tmp_path, "ur", "aadat") is None
