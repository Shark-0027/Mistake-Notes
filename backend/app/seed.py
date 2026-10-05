from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path

from argon2 import PasswordHasher
from jsonschema import Draft202012Validator
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .config import Settings, get_settings
from .database import Base, SessionLocal, engine
from .models import Assignment, Course, KnowledgePoint, Note, Record, SeedMetadata, Student

logger = logging.getLogger(__name__)
password_hasher = PasswordHasher()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_dataset(settings: Settings) -> tuple[dict, str]:
    if not settings.dataset_path.is_file():
        raise FileNotFoundError(f"Dataset not found: {settings.dataset_path}")

    dataset_hash = sha256_file(settings.dataset_path)
    dataset = json.loads(settings.dataset_path.read_text(encoding="utf-8"))
    schema = json.loads(settings.schema_path.read_text(encoding="utf-8"))
    Draft202012Validator(schema).validate(dataset)
    return dataset, dataset_hash


def upsert_students(db: Session, students: list[dict], password: str) -> None:
    for item in students:
        student = db.get(Student, item["id"])
        if student is None:
            student = Student(
                id=item["id"],
                login=item["login"],
                name=item["name"],
                password_hash=password_hasher.hash(item.get("testPassword") or password),
            )
            db.add(student)
        else:
            student.login = item["login"]
            student.name = item["name"]


def upsert_catalog(db: Session, courses: list[dict], assignments: list[dict]) -> None:
    for item in courses:
        course = db.get(Course, item["id"])
        if course is None:
            db.add(Course(id=item["id"], name=item["name"]))
        else:
            course.name = item["name"]

    for item in assignments:
        assignment = db.get(Assignment, item["id"])
        if assignment is None:
            db.add(
                Assignment(
                    id=item["id"],
                    course_id=item["courseId"],
                    title=item["title"],
                )
            )
        else:
            assignment.course_id = item["courseId"]
            assignment.title = item["title"]


def knowledge_point_id(name: str) -> str:
    return f"kp_{hashlib.sha256(name.encode('utf-8')).hexdigest()[:32]}"


def upsert_records(db: Session, records: list[dict]) -> None:
    all_names = {name for item in records for name in item["knowledgePoints"]}
    existing_points = {
        point.name: point
        for point in db.scalars(
            select(KnowledgePoint).where(KnowledgePoint.name.in_(all_names))
        ).all()
    }

    for name in all_names:
        if name not in existing_points:
            point = KnowledgePoint(id=knowledge_point_id(name), name=name)
            db.add(point)
            existing_points[name] = point

    db.flush()

    for item in records:
        record = db.scalar(
            select(Record)
            .options(selectinload(Record.knowledge_points), selectinload(Record.note))
            .where(Record.id == item["id"])
        )
        if record is None:
            record = Record(id=item["id"])
            db.add(record)

        record.student_id = item["studentId"]
        record.course_id = item["courseId"]
        record.assignment_id = item["assignmentId"]
        record.question_id = item["questionId"]
        record.question_type = item["questionType"]
        record.question_text = item["questionText"]
        record.question_format = item["questionFormat"]
        record.original_answer = item["originalAnswer"]
        record.answer_format = item["answerFormat"]
        record.score = item["score"]
        record.max_score = item["maxScore"]
        record.feedback = item["feedback"]
        record.grading_source = item["gradingSource"]
        record.initial_note = item["initialNote"]
        record.knowledge_points = [existing_points[name] for name in item["knowledgePoints"]]

        if record.note is None:
            record.note = Note(record_id=record.id, cause_note="", review_note="")


def seed_database(db: Session, settings: Settings | None = None) -> dict[str, int]:
    settings = settings or get_settings()
    dataset, dataset_hash = load_dataset(settings)
    existing = db.get(SeedMetadata, dataset_hash)
    if existing is not None:
        return database_counts(db)

    upsert_students(db, dataset["students"], settings.seed_password)
    upsert_catalog(db, dataset["courses"], dataset["assignments"])
    upsert_records(db, dataset["records"])
    db.add(
        SeedMetadata(
            dataset_sha256=dataset_hash,
            schema_version=dataset["schemaVersion"],
        )
    )
    db.commit()
    logger.info("Seeded dataset %s", dataset_hash)
    return database_counts(db)


def database_counts(db: Session) -> dict[str, int]:
    return {
        "records": db.scalar(select(func.count()).select_from(Record)) or 0,
        "students": db.scalar(select(func.count()).select_from(Student)) or 0,
        "courses": db.scalar(select(func.count()).select_from(Course)) or 0,
        "assignments": db.scalar(select(func.count()).select_from(Assignment)) or 0,
    }


def bootstrap_database(max_attempts: int = 30, delay_seconds: float = 1.0) -> None:
    import time

    last_error: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            Base.metadata.create_all(bind=engine)
            with SessionLocal() as db:
                counts = seed_database(db)
            logger.info("Database ready: %s", counts)
            return
        except Exception as exc:  # pragma: no cover - exercised by container startup
            last_error = exc
            logger.warning("Database bootstrap attempt %s/%s failed: %s", attempt, max_attempts, exc)
            time.sleep(delay_seconds)
    raise RuntimeError("Database bootstrap failed") from last_error


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    bootstrap_database()

