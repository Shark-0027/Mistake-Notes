from __future__ import annotations

from sqlalchemy import inspect, select, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from .models import Note, NoteVersion, utcnow


def apply_runtime_migrations(engine: Engine) -> None:
    """Small compatibility migration for the assessment deployment."""
    inspector = inspect(engine)
    if "notes" in inspector.get_table_names():
        note_columns = {column["name"] for column in inspector.get_columns("notes")}
        if "version_number" not in note_columns:
            with engine.begin() as connection:
                connection.execute(
                    text(
                        "ALTER TABLE notes "
                        "ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1"
                    )
                )


def ensure_initial_note_versions(db: Session) -> None:
    notes = db.scalars(select(Note)).all()
    changed = False
    for note in notes:
        if note.version_number is None:
            note.version_number = 1
            changed = True
        existing = db.scalar(
            select(NoteVersion).where(
                NoteVersion.record_id == note.record_id,
                NoteVersion.version_number == note.version_number,
            )
        )
        if existing is None:
            db.add(
                NoteVersion(
                    record_id=note.record_id,
                    version_number=note.version_number,
                    cause_note=note.cause_note,
                    review_note=note.review_note,
                    created_at=note.updated_at or utcnow(),
                )
            )
            changed = True
    if changed:
        db.commit()