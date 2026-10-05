from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Mistake Notes"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://mistake_notes:mistake_notes@db:5432/mistake_notes"
    session_secret: str = "development-only-change-me"
    dataset_path: Path = Path(__file__).resolve().parents[2] / "data/wrong-answers-20/dataset.json"
    schema_path: Path = Path(__file__).resolve().parents[2] / "data/wrong-answers-20/schema.json"
    frontend_dist: Path = Path(__file__).resolve().parents[1] / "frontend_dist"
    seed_password: str = "ExamOnly_2026!"
    session_cookie: str = "mistake_notes_session"
    session_max_age: int = 60 * 60 * 24 * 14


@lru_cache
def get_settings() -> Settings:
    return Settings()
