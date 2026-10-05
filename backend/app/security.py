from __future__ import annotations

import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .database import get_db
from .models import Record, Student

password_hasher = PasswordHasher()
csrf_session_key = "csrf_token"
user_session_key = "user_id"


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def set_authenticated_session(request: Request, student: Student) -> str:
    token = new_csrf_token()
    request.session.clear()
    request.session[user_session_key] = student.id
    request.session[csrf_session_key] = token
    return token


def require_student(
    request: Request,
    db: Session = Depends(get_db),
) -> Student:
    student_id = request.session.get(user_session_key)
    if not student_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未登录")
    student = db.get(Student, student_id)
    if student is None:
        request.session.clear()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="会话已失效")
    return student


def require_csrf(request: Request) -> None:
    expected = request.session.get(csrf_session_key)
    supplied = request.headers.get("X-CSRF-Token", "")
    if not expected or not supplied or not secrets.compare_digest(expected, supplied):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF 校验失败")


def record_for_student(db: Session, record_id: str, student: Student) -> Record:
    record = db.get(Record, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="错题不存在")
    if record.student_id != student.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问该记录")
    return record

