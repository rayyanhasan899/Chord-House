"""Explicit, non-overwriting import of the reviewed bundled catalogue."""

import hashlib
import json
from importlib.resources import files
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.catalog.song_domain import normalize
from app.modules.catalog.song_schemas import ImportInput
from app.modules.catalog.songs import (
    SongAuditRecord,
    SongImportRecord,
    SongRecord,
    approved,
    identity,
)
from app.modules.personal_workspace.workspace import SongReference


def seed_songs(session: Session) -> None:
    items = []
    for filename in ("popular-songs.json", "original-songs.json"):
        path = files("app.modules.catalog").joinpath("data", filename)
        items.extend(json.loads(path.read_text(encoding="utf-8")))
    data = ImportInput.model_validate(dict(key="bundled-songs-v1", items=items))
    for item in data.items:
        if not approved(item.metadata_grant) or any(
            not approved(g)
            for g in [
                *[a.grant for a in item.arrangements],
                *[t.grant for t in item.texts],
            ]
        ):
            raise ValueError("Bundled content does not pass rights review")
        if session.scalar(
            select(SongRecord.id).where(SongRecord.external_key == item.external_key)
        ):
            continue
        identifier = uuid5(NAMESPACE_URL, "chord-house:song:" + item.external_key)
        session.add(
            SongReference(
                id=identifier,
                title=item.title,
                artist=item.artist,
                language=item.language,
                reviewed=True,
            )
        )
        session.flush()
        session.add(
            SongRecord(
                id=identifier,
                external_key=item.external_key,
                identity_key=identity(item),
                search_text=normalize(
                    " ".join([item.title, item.artist, *item.aliases])
                ),
                language=item.language,
                status="published",
                document=item.model_dump(mode="json"),
                withdrawn=[],
                revision=1,
            )
        )
    if not session.scalar(
        select(SongImportRecord.id).where(SongImportRecord.key == data.key)
    ):
        payload = data.model_dump(mode="json")
        session.add(
            SongImportRecord(
                id=uuid5(NAMESPACE_URL, data.key),
                key=data.key,
                fingerprint=hashlib.sha256(
                    json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()
                ).hexdigest(),
                state="published",
                payload=payload,
                versions={item.external_key: 0 for item in data.items},
                issues=[],
                actor_id=None,
            )
        )
        session.flush()
        session.add(
            SongAuditRecord(
                id=uuid5(NAMESPACE_URL, data.key + ":audit"),
                actor_id=None,
                song_id=None,
                import_id=uuid5(NAMESPACE_URL, data.key),
                action="seed",
                component_key=None,
            )
        )
