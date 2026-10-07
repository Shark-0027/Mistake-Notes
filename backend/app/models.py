from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"


record_knowledge_points = Table(
    "record_knowledge_points",
    Base.metadata,
    Column("record_id", String(64), ForeignKey("records.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "knowledge_point_id",
        String(128),
        ForeignKey("knowledge_points.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    login: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))

    records: Mapped[list[Record]] = relationship(back_populates="student")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))

    assignments: Mapped[list[Assignment]] = relationship(back_populates="course")
    records: Mapped[list[Record]] = relationship(back_populates="course")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    course_id: Mapped[str] = mapped_column(ForeignKey("courses.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))

    course: Mapped[Course] = relationship(back_populates="assignments")
    records: Mapped[list[Record]] = relationship(back_populates="assignment")


class KnowledgePoint(Base):
    __tablename__ = "knowledge_points"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    name: Mapped[str] = mapped_column(String(256), unique=True)

    records: Mapped[list[Record]] = relationship(
        secondary=record_knowledge_points,
        back_populates="knowledge_points",
    )


class Record(Base):
    __tablename__ = "records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), index=True)
    course_id: Mapped[str] = mapped_column(ForeignKey("courses.id"), index=True)
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id"), index=True)
    question_id: Mapped[str] = mapped_column(String(64), index=True)
    question_type: Mapped[str] = mapped_column(String(32))
    question_text: Mapped[str] = mapped_column(Text)
    question_format: Mapped[str] = mapped_column(String(32))
    original_answer: Mapped[str] = mapped_column(Text)
    answer_format: Mapped[str] = mapped_column(String(32))
    score: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    max_score: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    grading_source: Mapped[str] = mapped_column(String(16))
    initial_note: Mapped[str] = mapped_column(Text, default="")

    student: Mapped[Student] = relationship(back_populates="records")
    course: Mapped[Course] = relationship(back_populates="records")
    assignment: Mapped[Assignment] = relationship(back_populates="records")
    knowledge_points: Mapped[list[KnowledgePoint]] = relationship(
        secondary=record_knowledge_points,
        back_populates="records",
        lazy="selectin",
    )
    note: Mapped[Note | None] = relationship(
        back_populates="record",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Note(Base):
    __tablename__ = "notes"

    record_id: Mapped[str] = mapped_column(
        ForeignKey("records.id", ondelete="CASCADE"),
        primary_key=True,
    )
    cause_note: Mapped[str] = mapped_column(Text, default="")
    review_note: Mapped[str] = mapped_column(Text, default="")
    version_number: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        server_default=func.now(),
    )

    record: Mapped[Record] = relationship(back_populates="note")


class NoteVersion(Base):
    __tablename__ = "note_versions"
    __table_args__ = (
        UniqueConstraint("record_id", "version_number", name="uq_note_versions_record_version"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("notev"))
    record_id: Mapped[str] = mapped_column(
        ForeignKey("records.id", ondelete="CASCADE"),
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer)
    cause_note: Mapped[str] = mapped_column(Text, default="")
    review_note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=func.now(),
    )


class NoteImage(Base):
    __tablename__ = "note_images"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("img"))
    record_id: Mapped[str] = mapped_column(
        ForeignKey("records.id", ondelete="CASCADE"),
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255))
    mime: Mapped[str] = mapped_column(String(64))
    size: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=func.now(),
    )
    version_number: Mapped[int | None] = mapped_column(Integer, nullable=True)


class SeedMetadata(Base):
    __tablename__ = "seed_metadata"

    dataset_sha256: Mapped[str] = mapped_column(String(64), primary_key=True)
    schema_version: Mapped[str] = mapped_column(String(16))
    seeded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=func.now(),
    )
