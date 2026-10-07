from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .database import get_db
from .models import (
    Course,
    KnowledgePoint,
    Note,
    NoteVersion,
    Record,
    Student,
    record_knowledge_points,
)
from .schemas import (
    CatalogResponse,
    CourseOut,
    NoteLabelUpdate,
    NoteOut,
    NoteUpdate,
    NoteVersionOut,
    RecordDetail,
    RecordSummary,
)
from .security import record_for_student, require_csrf, require_student

router = APIRouter(prefix="/api", tags=["records"])


def score_text(value: Decimal | float | int) -> str:
    decimal_value = Decimal(str(value)).normalize()
    return format(decimal_value, "f")


def knowledge_names(record: Record) -> list[str]:
    return [point.name for point in record.knowledge_points]


def record_summary(record: Record) -> RecordSummary:
    return RecordSummary(
        id=record.id,
        course_id=record.course_id,
        course_name=record.course.name,
        assignment_id=record.assignment_id,
        assignment_title=record.assignment.title,
        question_id=record.question_id,
        question_type=record.question_type,
        question_text=record.question_text,
        score=float(record.score),
        max_score=float(record.max_score),
        score_display=score_text(record.score),
        max_score_display=score_text(record.max_score),
        knowledge_points=knowledge_names(record),
    )


def note_out(note: Note | None) -> NoteOut:
    return NoteOut(
        cause_note=note.cause_note if note else "",
        review_note=note.review_note if note else "",
        label=note.label if note else None,
        version_number=note.version_number if note else 1,
    )


def note_version_out(version: NoteVersion) -> NoteVersionOut:
    return NoteVersionOut(
        version_number=version.version_number,
        cause_note=version.cause_note,
        review_note=version.review_note,
        label=version.label,
        created_at=version.created_at,
    )


def record_detail(record: Record) -> RecordDetail:
    summary = record_summary(record)
    return RecordDetail(
        **summary.model_dump(),
        question_format=record.question_format,
        original_answer=record.original_answer,
        answer_format=record.answer_format,
        feedback=record.feedback,
        grading_source=record.grading_source,
        note=note_out(record.note),
    )


def current_note(record: Record, db: Session) -> Note:
    if record.note is None:
        record.note = Note(record_id=record.id, version_number=1)
        db.add(record.note)
        db.flush()
    return record.note


def save_version_snapshot(db: Session, note: Note) -> None:
    version = db.scalar(
        select(NoteVersion).where(
            NoteVersion.record_id == note.record_id,
            NoteVersion.version_number == note.version_number,
        )
    )
    if version is None:
        db.add(
            NoteVersion(
                record_id=note.record_id,
                version_number=note.version_number,
                cause_note=note.cause_note,
                review_note=note.review_note,
                label=note.label,
            )
        )
        return
    version.cause_note = note.cause_note
    version.review_note = note.review_note
    version.label = note.label


@router.get("/catalog", response_model=CatalogResponse)
def catalog(
    course_id: str | None = Query(default=None, alias="course"),
    course_id_compat: str | None = Query(default=None, alias="courseId"),
    student: Student = Depends(require_student),
    db: Session = Depends(get_db),
) -> CatalogResponse:
    effective_course_id = course_id or course_id_compat
    courses = db.scalars(
        select(Course)
        .join(Record, Record.course_id == Course.id)
        .where(Record.student_id == student.id)
        .distinct()
        .order_by(Course.name, Course.id)
    ).all()

    points_query = (
        select(KnowledgePoint.name)
        .join(
            record_knowledge_points,
            record_knowledge_points.c.knowledge_point_id == KnowledgePoint.id,
        )
        .join(Record, Record.id == record_knowledge_points.c.record_id)
        .where(Record.student_id == student.id)
        .distinct()
        .order_by(KnowledgePoint.name)
    )
    if effective_course_id:
        points_query = points_query.where(Record.course_id == effective_course_id)

    return CatalogResponse(
        courses=[CourseOut(id=course.id, name=course.name) for course in courses],
        knowledge_points=list(db.scalars(points_query).all()),
    )


@router.get("/records", response_model=list[RecordSummary])
def list_records(
    course_id: str | None = Query(default=None, alias="course"),
    course_id_compat: str | None = Query(default=None, alias="courseId"),
    knowledge_point: str | None = Query(default=None, alias="knowledgePoint"),
    keyword: str | None = Query(default=None),
    student: Student = Depends(require_student),
    db: Session = Depends(get_db),
) -> list[RecordSummary]:
    effective_course_id = course_id or course_id_compat
    query = (
        select(Record)
        .options(
            selectinload(Record.course),
            selectinload(Record.assignment),
            selectinload(Record.knowledge_points),
        )
        .where(Record.student_id == student.id)
        .order_by(Record.id)
    )
    if effective_course_id:
        query = query.where(Record.course_id == effective_course_id)
    if knowledge_point:
        query = query.where(
            Record.knowledge_points.any(KnowledgePoint.name == knowledge_point)
        )
    if keyword and keyword.strip():
        query = query.where(Record.question_text.contains(keyword.strip(), autoescape=True))

    return [record_summary(record) for record in db.scalars(query).all()]


@router.get("/records/{record_id}", response_model=RecordDetail)
def get_record(
    record_id: str,
    student: Student = Depends(require_student),
    db: Session = Depends(get_db),
) -> RecordDetail:
    record = record_for_student(db, record_id, student)
    return record_detail(record)


@router.get(
    "/records/{record_id}/notes/versions",
    response_model=list[NoteVersionOut],
)
def list_note_versions(
    record_id: str,
    student: Student = Depends(require_student),
    db: Session = Depends(get_db),
) -> list[NoteVersionOut]:
    record = record_for_student(db, record_id, student)
    versions = db.scalars(
        select(NoteVersion)
        .where(NoteVersion.record_id == record.id)
        .order_by(NoteVersion.version_number.desc())
    ).all()
    return [note_version_out(version) for version in versions]


@router.patch(
    "/records/{record_id}/notes/versions/{version_number}",
    response_model=NoteVersionOut,
)
def rename_note_version(
    record_id: str,
    version_number: int,
    payload: NoteLabelUpdate,
    student: Student = Depends(require_student),
    _: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> NoteVersionOut:
    record = record_for_student(db, record_id, student)
    version = db.scalar(
        select(NoteVersion).where(
            NoteVersion.record_id == record.id,
            NoteVersion.version_number == version_number,
        )
    )
    if version is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="笔记版本不存在")

    version.label = payload.label
    db.commit()
    db.refresh(version)
    return note_version_out(version)


@router.put("/records/{record_id}/notes", response_model=NoteOut)
def update_notes(
    record_id: str,
    payload: NoteUpdate,
    student: Student = Depends(require_student),
    _: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> NoteOut:
    record = record_for_student(db, record_id, student)
    note = current_note(record, db)
    if payload.as_new_version:
        note.version_number += 1
    note.cause_note = payload.cause_note
    note.review_note = payload.review_note
    note.label = payload.label
    save_version_snapshot(db, note)
    db.commit()
    return note_out(note)


@router.post(
    "/records/{record_id}/notes/versions/{version_number}/restore",
    response_model=NoteOut,
)
def restore_note_version(
    record_id: str,
    version_number: int,
    student: Student = Depends(require_student),
    _: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> NoteOut:
    record = record_for_student(db, record_id, student)
    version = db.scalar(
        select(NoteVersion).where(
            NoteVersion.record_id == record.id,
            NoteVersion.version_number == version_number,
        )
    )
    if version is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="笔记版本不存在")

    note = current_note(record, db)
    note.version_number += 1
    note.cause_note = version.cause_note
    note.review_note = version.review_note
    note.label = None
    save_version_snapshot(db, note)
    db.commit()
    return note_out(note)
