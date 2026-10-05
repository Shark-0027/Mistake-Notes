from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SESSION_SECRET", "test-session-secret")
os.environ.setdefault("DATASET_PATH", str(ROOT / "data/wrong-answers-20/dataset.json"))
os.environ.setdefault("SCHEMA_PATH", str(ROOT / "data/wrong-answers-20/schema.json"))


@pytest.fixture()
def client() -> TestClient:
    from app.main import create_app

    with TestClient(create_app()) as test_client:
        yield test_client


def login(client: TestClient, username: str = "student_001") -> dict:
    response = client.post(
        "/api/auth/login",
        json={"username": username, "password": "ExamOnly_2026!"},
    )
    assert response.status_code == 200, response.text
    return response.json()
