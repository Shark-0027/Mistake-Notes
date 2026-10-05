from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import Student
from .schemas import AuthResponse, LoginRequest, StudentOut
from .security import (
    csrf_session_key,
    require_csrf,
    require_student,
    set_authenticated_session,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    student = db.scalar(select(Student).where(Student.login == payload.username.strip()))
    if student is None or not verify_password(student.password_hash, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号或密码错误",
        )
    csrf_token = set_authenticated_session(request, student)
    return AuthResponse(user=StudentOut.model_validate(student), csrf_token=csrf_token)


@router.get("/me", response_model=AuthResponse)
def me(request: Request, student: Student = Depends(require_student)) -> AuthResponse:
    return AuthResponse(
        user=StudentOut.model_validate(student),
        csrf_token=request.session[csrf_session_key],
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    _: Student = Depends(require_student),
    __: None = Depends(require_csrf),
) -> Response:
    request.session.clear()
    response.status_code = status.HTTP_204_NO_CONTENT
    return response

