from datetime import UTC, datetime
from typing import cast
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.database import Database
from app.modules.catalog.patterns import (
    PatternRecord,
    SharedPatternInput,
    pattern_available,
)
from app.modules.catalog.song_domain import normalize
from app.modules.catalog.song_schemas import Grant, SongInput
from app.modules.catalog.songs import SongRecord, approved, detail, identity
from app.modules.content_management.domain import check_revision
from app.modules.content_management.models import (
    ContentAudit,
    ContentReport,
    ReferenceContent,
    audit,
)
from app.modules.content_management.schemas import (
    AuditView,
    ContentView,
    ContentWrite,
    Kind,
    ReportInput,
    ReportView,
    Resolution,
    State,
)
from app.modules.identity.domain import IdentityError
from app.modules.personal_workspace.workspace import SongReference

Row = ReferenceContent | SongRecord | PatternRecord


def view(kind: Kind, row: Row) -> ContentView:
    if isinstance(row, PatternRecord):
        document = {k: getattr(row, k) for k in SharedPatternInput.model_fields}
        key = str(row.id)
    else:
        document = row.document
        key = str(row.id) if isinstance(row, SongRecord) else row.key
    # Withheld song components must not accidentally be restored by a routine edit.
    if isinstance(row, SongRecord):
        document = dict(document)
        song = SongInput.model_validate(document)
        song.texts = [t for t in song.texts if "text:" + t.key not in row.withdrawn]
        keys = {t.key for t in song.texts}
        song.arrangements = [
            a for a in song.arrangements if "arrangement:" + a.key not in row.withdrawn
        ]
        for arrangement in song.arrangements:
            if arrangement.text_key not in keys:
                arrangement.text_key = None
                arrangement.placements = []
        document = song.model_dump(mode="json")
    return ContentView(
        kind=kind,
        key=key,
        document=document,
        status=cast(State, "archived" if row.status == "withdrawn" else row.status),
        revision=row.revision,
        created_at=row.created_at,
        updated_at=row.updated_at,
        actor_id=row.actor_id,
    )


class SqlContentRepository:
    def __init__(self, db: Database):
        self.db = db

    def entries(self, kind: Kind, offset: int, limit: int) -> list[ContentView]:
        with self.db.transaction() as session:
            if kind == "song":
                return [
                    view(kind, row)
                    for row in session.scalars(
                        select(SongRecord)
                        .order_by(SongRecord.id)
                        .offset(offset)
                        .limit(limit)
                    )
                ]
            if kind == "pattern":
                return [
                    view(kind, row)
                    for row in session.scalars(
                        select(PatternRecord)
                        .where(PatternRecord.owner_id.is_(None))
                        .order_by(PatternRecord.id)
                        .offset(offset)
                        .limit(limit)
                    )
                ]
            return [
                view(kind, row)
                for row in session.scalars(
                    select(ReferenceContent)
                    .where(ReferenceContent.kind == kind)
                    .order_by(ReferenceContent.key)
                    .offset(offset)
                    .limit(limit)
                )
            ]

    def save(
        self, actor_id: UUID, kind: Kind, key: str, data: ContentWrite
    ) -> ContentView:
        try:
            with self.db.transaction() as session:
                row: Row | None
                if kind == "song":
                    row = session.scalar(
                        select(SongRecord)
                        .where(SongRecord.id == UUID(key))
                        .with_for_update()
                    )
                elif kind == "pattern":
                    row = session.scalar(
                        select(PatternRecord)
                        .where(
                            PatternRecord.id == UUID(key),
                            PatternRecord.owner_id.is_(None),
                        )
                        .with_for_update()
                    )
                    # Never adopt a private identifier, even for an administrator.
                    if (
                        row is None
                        and session.get(PatternRecord, UUID(key)) is not None
                    ):
                        raise IdentityError(
                            404, "not_found", "Shared content not found"
                        )
                else:
                    row = session.scalar(
                        select(ReferenceContent)
                        .where(
                            ReferenceContent.kind == kind, ReferenceContent.key == key
                        )
                        .with_for_update()
                    )
                check_revision(row.revision if row else 0, data.revision)
                if kind == "song":
                    song = SongInput.model_validate(data.document)
                    reference = session.get(SongReference, UUID(key))
                    if reference is None:
                        reference = SongReference(id=UUID(key))
                        session.add(reference)
                    reference.title, reference.artist, reference.language = (
                        song.title,
                        song.artist,
                        song.language,
                    )
                    reference.reviewed = data.status == "published"
                    session.flush()
                    if row is None:
                        row = SongRecord(id=UUID(key), revision=0, withdrawn=[])
                    assert isinstance(row, SongRecord)
                    row.external_key = song.external_key
                    row.identity_key = identity(song)
                    row.search_text = normalize(
                        " ".join([song.title, song.artist, *song.aliases])
                    )
                    row.language = song.language
                    row.document = data.document
                    # Explicitly reviewed new document replaces withdrawn components.
                    row.withdrawn = []
                elif kind == "pattern":
                    if row is None:
                        row = PatternRecord(id=UUID(key), owner_id=None, revision=0)
                    for field, value in data.document.items():
                        setattr(row, field, value)
                else:
                    if kind == "tuning":
                        parent = session.get(
                            ReferenceContent,
                            ("instrument", str(data.document["instrument"])),
                            with_for_update=True,
                        )
                        if (
                            parent is None
                            or len(cast(list[int], data.document["pitches"]))
                            != parent.document["string_count"]
                        ):
                            raise IdentityError(
                                422,
                                "invalid_tuning",
                                "Tuning strings must match an existing instrument",
                            )
                        if data.status == "published" and (
                            parent.status != "published"
                            or not approved(
                                Grant.model_validate(parent.document["grant"])
                            )
                        ):
                            raise IdentityError(
                                422,
                                "invalid_instrument",
                                "Publish an instrument with current rights first",
                            )
                    if (
                        kind == "instrument"
                        and isinstance(row, ReferenceContent)
                        and data.document["string_count"]
                        != row.document["string_count"]
                    ):
                        children = session.scalars(
                            select(ReferenceContent).where(
                                ReferenceContent.kind == "tuning"
                            )
                        )
                        if any(c.document["instrument"] == key for c in children):
                            raise IdentityError(
                                409,
                                "instrument_in_use",
                                "Create a new instrument code to change string count",
                            )
                    if row is None:
                        row = ReferenceContent(kind=kind, key=key, revision=0)
                    assert isinstance(row, ReferenceContent)
                    row.document = data.document
                row.status = data.status
                row.revision += 1
                row.updated_at = datetime.now(UTC)
                row.actor_id = actor_id
                session.add(row)
                audit(session, actor_id, kind, key, "save:" + data.status)
                session.flush()
                return view(kind, row)
        except IntegrityError:
            raise IdentityError(
                409,
                "content_conflict",
                "Duplicate identity or concurrent change; reload and review",
            ) from None

    def public(self, kind: Kind, offset: int, limit: int) -> list[ContentView]:
        with self.db.transaction() as session:
            rows = session.scalars(
                select(ReferenceContent)
                .where(
                    ReferenceContent.kind == kind,
                    ReferenceContent.status == "published",
                )
                .order_by(ReferenceContent.key)
            )
            available = []
            for row in rows:
                if not approved(Grant.model_validate(row.document["grant"])):
                    continue
                if kind == "tuning":
                    parent = session.get(
                        ReferenceContent,
                        ("instrument", str(row.document["instrument"])),
                    )
                    if (
                        not parent
                        or parent.status != "published"
                        or not approved(Grant.model_validate(parent.document["grant"]))
                    ):
                        continue
                available.append(view(kind, row))
            return available[offset : offset + limit]

    def report(self, owner: UUID, data: ReportInput) -> ReportView:
        with self.db.transaction() as session:
            available = False
            if data.kind == "song":
                song = session.get(SongRecord, UUID(data.key))
                available = song is not None and detail(song) is not None
            elif data.kind == "pattern":
                pattern = session.get(PatternRecord, UUID(data.key))
                available = (
                    pattern is not None
                    and pattern.owner_id is None
                    and pattern_available(pattern)
                )
            else:
                ref = session.get(ReferenceContent, (data.kind, data.key))
                available = (
                    ref is not None
                    and ref.status == "published"
                    and approved(Grant.model_validate(ref.document["grant"]))
                )
            if not available:
                raise IdentityError(
                    404, "not_found", "Published shared content not found"
                )
            row = ContentReport(id=uuid4(), owner_id=owner, **data.model_dump())
            session.add(row)
            session.flush()
            # Do not put reporter identity into the audit trail either.
            audit(session, None, "report", str(row.id), "submitted")
            return ReportView.model_validate(row)

    def reports(self, owner: UUID | None, offset: int, limit: int) -> list[ReportView]:
        with self.db.transaction() as session:
            query = select(ContentReport)
            if owner is not None:
                query = query.where(ContentReport.owner_id == owner)
            return [
                ReportView.model_validate(row)
                for row in session.scalars(
                    query.order_by(ContentReport.created_at.desc(), ContentReport.id)
                    .offset(offset)
                    .limit(limit)
                )
            ]

    def resolve(self, actor: UUID, identifier: UUID, data: Resolution) -> ReportView:
        with self.db.transaction() as session:
            row = session.get(ContentReport, identifier, with_for_update=True)
            if row is None:
                raise IdentityError(404, "not_found", "Report not found")
            check_revision(row.revision, data.revision)
            row.status = data.status
            row.revision += 1
            row.updated_at = datetime.now(UTC)
            audit(session, actor, "report", str(row.id), "resolve:" + data.status)
            session.flush()
            return ReportView.model_validate(row)

    def audits(self, offset: int, limit: int) -> list[AuditView]:
        with self.db.transaction() as session:
            return [
                AuditView.model_validate(row)
                for row in session.scalars(
                    select(ContentAudit)
                    .order_by(ContentAudit.created_at.desc(), ContentAudit.id)
                    .offset(offset)
                    .limit(limit)
                )
            ]
