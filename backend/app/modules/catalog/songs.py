import hashlib
import json
from datetime import UTC, datetime
from uuid import NAMESPACE_URL, UUID, uuid4, uuid5

from sqlalchemy import DateTime, ForeignKey, String, Text, func, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, Database
from app.modules.catalog.patterns import Patterns
from app.modules.catalog.song_domain import normalize, publishable
from app.modules.catalog.song_schemas import (
    Grant,
    ImportInput,
    ImportView,
    ListingDocument,
    SongDetail,
    SongInput,
    SongPage,
    SongSummary,
    Withdrawal,
)
from app.modules.identity.domain import Actor, IdentityError
from app.modules.personal_workspace.workspace import SongReference


class SongRecord(Base):
    __tablename__ = "song_catalog"
    id: Mapped[UUID] = mapped_column(
        ForeignKey("song_references.id", ondelete="CASCADE"), primary_key=True
    )
    external_key: Mapped[str] = mapped_column(String(150), unique=True)
    identity_key: Mapped[str] = mapped_column(String(500), unique=True)
    search_text: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(2), index=True)
    status: Mapped[str] = mapped_column(String(15), index=True)
    document: Mapped[dict[str, object]] = mapped_column(JSONB)
    withdrawn: Mapped[list[str]] = mapped_column(JSONB, default=list)
    revision: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    actor_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL")
    )


class SongImportRecord(Base):
    __tablename__ = "song_imports"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True)
    fingerprint: Mapped[str] = mapped_column(String(64))
    state: Mapped[str] = mapped_column(String(15))
    payload: Mapped[dict[str, object]] = mapped_column(JSONB)
    versions: Mapped[dict[str, int]] = mapped_column(JSONB)
    issues: Mapped[list[str]] = mapped_column(JSONB)
    actor_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class SongAuditRecord(Base):
    __tablename__ = "song_audit_events"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    actor_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL")
    )
    song_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("song_catalog.id", ondelete="SET NULL")
    )
    import_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("song_imports.id", ondelete="SET NULL")
    )
    action: Mapped[str] = mapped_column(String(40))
    component_key: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


def approved(grant: Grant) -> bool:
    return publishable(
        grant.reviewed,
        grant.display,
        grant.cache,
        grant.territories,
        grant.evidence,
        grant.expires_at,
        datetime.now(UTC),
    )


def identity(data: SongInput) -> str:
    return normalize(data.title) + "|" + normalize(data.artist) + "|" + data.language


def detail(row: SongRecord) -> SongDetail | None:
    data = SongInput.model_validate(row.document)
    if row.status != "published" or not approved(data.metadata_grant):
        return None
    texts = [
        t
        for t in data.texts
        if "text:" + t.key not in row.withdrawn and approved(t.grant)
    ]
    keys = {t.key for t in texts}
    arrangements = [
        a.model_copy(update={"placements": a.placements if a.text_key in keys else []})
        for a in data.arrangements
        if "arrangement:" + a.key not in row.withdrawn and approved(a.grant)
    ]
    return SongDetail(
        id=row.id,
        title=data.title,
        artist=data.artist,
        language=data.language,
        aliases=data.aliases,
        genre=data.genre,
        version_note=data.version_note,
        arrangement_count=len(arrangements),
        text_count=len(texts),
        metadata_grant=data.metadata_grant,
        arrangements=arrangements,
        texts=texts,
        lyrics_url=data.lyrics_url if data.lyrics_link_verified else None,
        revision=row.revision,
    )


class Songs:
    def __init__(self, db: Database):
        self.db = db

    def list(
        self,
        q: str,
        language: str | None,
        artist: str,
        difficulty: str | None,
        instrument: str | None,
        genre: str,
        availability: str | None,
        offset: int,
        limit: int,
    ) -> SongPage:
        with self.db.transaction() as session:
            query = select(SongRecord).where(SongRecord.status == "published")
            if q.strip():
                query = query.where(
                    SongRecord.search_text.contains(normalize(q), autoescape=True)
                )
            if language:
                query = query.where(SongRecord.language == language)
            total = 0
            items: list[SongSummary] = []
            for row in session.scalars(
                query.order_by(SongRecord.identity_key).execution_options(yield_per=100)
            ):
                # Listings do not need lyric lines, bars or placement copies. Keep
                # live grant/withdrawal checks without validating every score again.
                data = ListingDocument.model_validate(row.document)
                if (
                    not approved(data.metadata_grant)
                    or normalize(artist) not in normalize(data.artist)
                    or normalize(genre) not in normalize(data.genre or "")
                ):
                    continue
                arrangements = [
                    a
                    for a in data.arrangements
                    if "arrangement:" + a.key not in row.withdrawn and approved(a.grant)
                ]
                texts = [
                    t
                    for t in data.texts
                    if "text:" + t.key not in row.withdrawn and approved(t.grant)
                ]
                if (difficulty or instrument) and not any(
                    (not difficulty or a.difficulty == difficulty)
                    and (not instrument or a.instrument == instrument)
                    for a in arrangements
                ):
                    continue
                if (
                    availability == "arrangement"
                    and not arrangements
                    or availability == "lyrics"
                    and not texts
                ):
                    continue
                if offset <= total < offset + limit:
                    items.append(
                        SongSummary(
                            id=row.id,
                            title=data.title,
                            artist=data.artist,
                            language=data.language,
                            aliases=data.aliases,
                            genre=data.genre,
                            version_note=data.version_note,
                            arrangement_count=len(arrangements),
                            text_count=len(texts),
                        )
                    )
                total += 1
            return SongPage(items=items, total=total, offset=offset, limit=limit)

    def get(self, identifier: UUID) -> SongDetail:
        with self.db.transaction() as session:
            row = session.get(SongRecord, identifier)
            song = detail(row) if row else None
            if song is None:
                raise IdentityError(404, "not_found", "Song is not available")
            return song

    @staticmethod
    def view(batch: SongImportRecord) -> ImportView:
        payload = ImportInput.model_validate(batch.payload)
        return ImportView(
            id=batch.id,
            key=batch.key,
            state=batch.state,
            count=len(payload.items),
            issues=batch.issues,
        )

    def stage(self, actor: Actor, data: ImportInput) -> ImportView:
        Patterns.manager(actor)
        payload = data.model_dump(mode="json")
        fingerprint = hashlib.sha256(
            json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()
        ).hexdigest()
        try:
            with self.db.transaction() as session:
                existing = session.scalar(
                    select(SongImportRecord).where(SongImportRecord.key == data.key)
                )
                if existing:
                    if existing.fingerprint != fingerprint:
                        raise IdentityError(
                            409,
                            "import_key_reused",
                            "Use a new key for different import content",
                        )
                    return self.view(existing)
                issues: list[str] = []
                versions: dict[str, int] = {}
                seen: set[str] = set()
                seen_identity: set[str] = set()
                for item in data.items:
                    if item.external_key in seen or identity(item) in seen_identity:
                        issues.append("Duplicate item in batch: " + item.title)
                    seen.add(item.external_key)
                    seen_identity.add(identity(item))
                    row = session.scalar(
                        select(SongRecord).where(
                            SongRecord.external_key == item.external_key
                        )
                    )
                    duplicate = session.scalar(
                        select(SongRecord).where(
                            SongRecord.identity_key == identity(item)
                        )
                    )
                    if duplicate and (row is None or duplicate.id != row.id):
                        issues.append(
                            "Identity matches a different source key: " + item.title
                        )
                    versions[item.external_key] = row.revision if row else 0
                    if row and not data.replace_existing:
                        issues.append(
                            "Explicit replacement review required: " + item.title
                        )
                    if not approved(item.metadata_grant) or any(
                        not approved(g)
                        for g in [
                            *[a.grant for a in item.arrangements],
                            *[t.grant for t in item.texts],
                        ]
                    ):
                        issues.append(
                            "Rights or worldwide display/cache permission missing: "
                            + item.title
                        )
                batch = SongImportRecord(
                    id=uuid4(),
                    key=data.key,
                    fingerprint=fingerprint,
                    state="staged",
                    payload=payload,
                    versions=versions,
                    issues=issues,
                    actor_id=actor.id,
                )
                session.add(batch)
                session.flush()
                from app.modules.content_management.models import audit

                audit(session, actor.id, "import", str(batch.id), "stage")
                session.add(
                    SongAuditRecord(
                        id=uuid4(),
                        actor_id=actor.id,
                        import_id=batch.id,
                        action="stage",
                        song_id=None,
                        component_key=None,
                    )
                )
                return self.view(batch)
        except IntegrityError:
            raise IdentityError(
                409,
                "import_conflict",
                "Import changed concurrently; retry with the same key",
            ) from None

    def preview(self, actor: Actor, identifier: UUID) -> ImportView:
        Patterns.manager(actor)
        with self.db.transaction() as session:
            batch = session.get(SongImportRecord, identifier)
            if not batch:
                raise IdentityError(404, "not_found", "Import not found")
            return self.view(batch)

    def commit(self, actor: Actor, identifier: UUID) -> ImportView:
        Patterns.manager(actor)
        try:
            with self.db.transaction() as session:
                batch = session.scalar(
                    select(SongImportRecord)
                    .where(SongImportRecord.id == identifier)
                    .with_for_update()
                )
                if not batch:
                    raise IdentityError(404, "not_found", "Import not found")
                if batch.state == "published":
                    return self.view(batch)
                if batch.issues:
                    raise IdentityError(
                        422,
                        "import_blocked",
                        "Resolve preview issues and stage a new batch",
                    )
                payload = ImportInput.model_validate(batch.payload)
                for item in payload.items:
                    if not approved(item.metadata_grant) or any(
                        not approved(g)
                        for g in [
                            *[a.grant for a in item.arrangements],
                            *[t.grant for t in item.texts],
                        ]
                    ):
                        raise IdentityError(
                            422,
                            "rights_expired",
                            "Rights changed or expired since preview",
                        )
                    row = session.scalar(
                        select(SongRecord)
                        .where(SongRecord.external_key == item.external_key)
                        .with_for_update()
                    )
                    if (row.revision if row else 0) != batch.versions[
                        item.external_key
                    ]:
                        raise IdentityError(
                            409,
                            "revision_conflict",
                            "Catalogue changed since preview; stage a new batch",
                        )
                    song_id = (
                        row.id
                        if row
                        else uuid5(
                            NAMESPACE_URL, "chord-house:song:" + item.external_key
                        )
                    )
                    reference = session.get(SongReference, song_id)
                    if reference is None:
                        reference = SongReference(id=song_id)
                        session.add(reference)
                    (
                        reference.title,
                        reference.artist,
                        reference.language,
                        reference.reviewed,
                    ) = item.title, item.artist, item.language, True
                    session.flush()
                    if row is None:
                        row = SongRecord(
                            id=song_id, external_key=item.external_key, revision=0
                        )
                        session.add(row)
                    row.identity_key = identity(item)
                    row.language = item.language
                    row.search_text = normalize(
                        " ".join([item.title, item.artist, *item.aliases])
                    )
                    row.status = "published"
                    row.document = item.model_dump(mode="json")
                    row.withdrawn = []
                    row.revision += 1
                    row.updated_at = datetime.now(UTC)
                    row.actor_id = actor.id
                    from app.modules.content_management.models import audit

                    audit(session, actor.id, "song", str(row.id), "import:publish")
                batch.state = "published"
                session.add(
                    SongAuditRecord(
                        id=uuid4(),
                        actor_id=actor.id,
                        import_id=batch.id,
                        action="publish",
                        song_id=None,
                        component_key=None,
                    )
                )
                session.flush()
                return self.view(batch)
        except IntegrityError:
            raise IdentityError(
                409,
                "import_conflict",
                "Duplicate or concurrent update; stage a new batch",
            ) from None

    def withdraw(self, actor: Actor, identifier: UUID, request: Withdrawal) -> None:
        Patterns.manager(actor)
        with self.db.transaction() as session:
            row = session.scalar(
                select(SongRecord).where(SongRecord.id == identifier).with_for_update()
            )
            if row is None:
                raise IdentityError(404, "not_found", "Song not found")
            if request.component == "metadata":
                row.status = "withdrawn"
                reference = session.get(SongReference, identifier)
                if reference:
                    reference.reviewed = False
            else:
                data = SongInput.model_validate(row.document)
                components = (
                    data.arrangements
                    if request.component == "arrangement"
                    else data.texts
                )
                if request.key not in {c.key for c in components}:
                    raise IdentityError(404, "not_found", "Component not found")
                row.withdrawn = sorted(
                    set([*row.withdrawn, f"{request.component}:{request.key}"])
                )
            row.revision += 1
            row.updated_at = datetime.now(UTC)
            row.actor_id = actor.id
            from app.modules.content_management.models import audit

            audit(
                session, actor.id, "song", str(row.id), "withdraw:" + request.component
            )
            session.add(
                SongAuditRecord(
                    id=uuid4(),
                    actor_id=actor.id,
                    song_id=row.id,
                    import_id=None,
                    action="withdraw:" + request.component,
                    component_key=request.key,
                )
            )
