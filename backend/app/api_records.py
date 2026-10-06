from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .database import get_db
from .models import Course, KnowledgePoint, Record, Student, record_knowledge_points
from .schemas import (
    CatalogResponse,
    CourseOut,
    NoteOut,
    NoteUpdate,
    RecordDetail,
    RecordSummary,
)
from .security import record_for_student, require_csrf, require_student

router = APIRouter(prefix="/api", tags=["records"])


def score_text(value: Decimal | float | int) -> str:
    decimal_value = Decimal(str(value)).normalize()
    text = format(decimal_value, "f")
    return text if "." in text else f"{text}.0"


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


def record_detail(record: Record) -> RecordDetail:
    summary = record_summary(record)
    note = record.note
    return RecordDetail(
        **summary.model_dump(),
        question_format=record.question_format,
        original_answer=record.original_answer,
        answer_format=record.answer_format,
        feedback=record.feedback,
        grading_source=record.grading_source,
        note=NoteOut(
            cause_note=note.cause_note if note else "",
            review_note=note.review_note if note else "",
        ),
    )


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


@router.put("/records/{record_id}/notes", response_model=NoteOut)
def update_notes(
    record_id: str,
    payload: NoteUpdate,
    student: Student = Depends(require_student),
    _: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> NoteOut:
    record = record_for_student(db, record_id, student)
    if record.note is None:
        from .models import Note

        record.note = Note(record_id=record.id)

    record.note.cause_note = payload.cause_note
    record.note.review_note = payload.review_note
    db.commit()
    return NoteOut(
        cause_note=record.note.cause_note,
        review_note=record.note.review_note,
    )

