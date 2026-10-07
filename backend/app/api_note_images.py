from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .database import get_db
from .models import NoteImage, Student, new_id
from .schemas import NoteImageOut
from .security import record_for_student, require_csrf, require_student

router = APIRouter(prefix="/api", tags=["note-images"])

MAX_IMAGE_SIZE = 5 * 1024 * 1024
MIME_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def detected_image_mime(content: bytes) -> str | None:
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    return None


def image_path(image: NoteImage, settings: Settings) -> Path:
    extension = MIME_EXTENSIONS[image.mime]
    return settings.note_image_dir / f"{image.id}{extension}"


def image_out(image: NoteImage) -> NoteImageOut:
    return NoteImageOut(
        id=image.id,
        filename=image.filename,
        mime=image.mime,
        size=image.size,
        created_at=image.created_at,
        version_number=image.version_number,
        url=f"/api/note-images/{image.id}",
    )


@router.get("/records/{record_id}/note-images", response_model=list[NoteImageOut])
def list_note_images(
    record_id: str,
    student: Student = Depends(require_student),
    db: Session = Depends(get_db),
) -> list[NoteImageOut]:
    record = record_for_student(db, record_id, student)
    images = db.scalars(
        select(NoteImage)
        .where(NoteImage.record_id == record.id)
        .order_by(NoteImage.created_at, NoteImage.id)
    ).all()
    return [image_out(image) for image in images]


@router.post(
    "/records/{record_id}/note-images",
    response_model=NoteImageOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_note_image(
    record_id: str,
    file: UploadFile = File(...),
    student: Student = Depends(require_student),
    _: None = Depends(require_csrf),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> NoteImageOut:
    record = record_for_student(db, record_id, student)
    declared_mime = (file.content_type or "").lower()
    if declared_mime not in MIME_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="仅支持 JPG、PNG、WebP 图片",
        )

    content = await file.read(MAX_IMAGE_SIZE + 1)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="图片内容为空",
        )
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="图片不能超过 5MB",
        )

    detected_mime = detected_image_mime(content)
    expected_mime = "image/jpeg" if declared_mime == "image/jpg" else declared_mime
    if detected_mime is None or detected_mime != expected_mime:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="图片文件格式不受支持",
        )

    image_id = new_id("img")
    original_name = Path(file.filename or f"image{MIME_EXTENSIONS[detected_mime]}").name
    image = NoteImage(
        id=image_id,
        record_id=record.id,
        filename=original_name[:255],
        mime=detected_mime,
        size=len(content),
        version_number=record.note.version_number if record.note else None,
    )
    path = settings.note_image_dir / f"{image_id}{MIME_EXTENSIONS[detected_mime]}"
    settings.note_image_dir.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    db.add(image)
    try:
        db.commit()
        db.refresh(image)
    except Exception:
        path.unlink(missing_ok=True)
        raise
    return image_out(image)


@router.get("/note-images/{image_id}")
def get_note_image(
    image_id: str,
    student: Student = Depends(require_student),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> FileResponse:
    image = db.get(NoteImage, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="图片不存在")
    record_for_student(db, image.record_id, student)
    path = image_path(image, settings)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="图片文件不存在")
    return FileResponse(
        path,
        media_type=image.mime,
        headers={"Cache-Control": "private, max-age=300"},
    )


@router.delete(
    "/note-images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_note_image(
    image_id: str,
    student: Student = Depends(require_student),
    _: None = Depends(require_csrf),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> None:
    image = db.get(NoteImage, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="图片不存在")
    record_for_student(db, image.record_id, student)
    path = image_path(image, settings)
    db.delete(image)
    db.commit()
    path.unlink(missing_ok=True)
