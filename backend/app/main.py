from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import text
from starlette.middleware.sessions import SessionMiddleware

from .api_auth import router as auth_router
from .api_note_images import router as note_images_router
from .api_records import router as records_router
from .config import Settings, get_settings
from .database import Base, SessionLocal, engine
from .migrations import apply_runtime_migrations, ensure_initial_note_versions
from .seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    apply_runtime_migrations(engine)
    with SessionLocal() as db:
        ensure_initial_note_versions(db)
        seed_database(db)
    yield


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret,
        session_cookie=settings.session_cookie,
        max_age=settings.session_max_age,
        same_site="lax",
        https_only=settings.app_env == "production",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type", "X-CSRF-Token"],
    )

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {"status": "ok"}

    app.include_router(auth_router)
    app.include_router(records_router)
    app.include_router(note_images_router)

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="接口不存在")
        dist = settings.frontend_dist.resolve()
        candidate = (dist / full_path).resolve()
        if candidate.is_file() and candidate.is_relative_to(dist):
            return FileResponse(candidate)
        index = dist / "index.html"
        if not index.is_file():
            raise HTTPException(status_code=404, detail="前端构建产物不存在")
        return FileResponse(index)

    return app


app = create_app()
