import base64
import json

from fastapi.testclient import TestClient
from itsdangerous import TimestampSigner

from .conftest import login


def test_login_rejects_unknown_and_wrong_password(client: TestClient) -> None:
    unknown = client.post(
        "/api/auth/login",
        json={"username": "missing", "password": "bad"},
    )
    wrong = client.post(
        "/api/auth/login",
        json={"username": "student_001", "password": "bad"},
    )
    assert unknown.status_code == 401
    assert wrong.status_code == 401
    assert unknown.json()["detail"] == wrong.json()["detail"] == "账号或密码错误"


def test_me_requires_auth_and_returns_server_session_identity(client: TestClient) -> None:
    assert client.get("/api/auth/me").status_code == 401
    auth = login(client)
    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["user"]["id"] == auth["user"]["id"] == "student_001"
    assert me.json()["csrf_token"]


def test_me_rejects_authenticated_session_without_csrf_token(client: TestClient) -> None:
    session = base64.b64encode(json.dumps({"user_id": "student_001"}).encode())
    signed_session = TimestampSigner("test-session-secret").sign(session).decode()
    client.cookies.set("mistake_notes_session", signed_session)

    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "会话已失效"


def test_logout_requires_csrf_and_clears_session(client: TestClient) -> None:
    auth = login(client)
    rejected = client.post("/api/auth/logout")
    assert rejected.status_code == 403

    accepted = client.post(
        "/api/auth/logout",
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert accepted.status_code == 204
    assert client.get("/api/auth/me").status_code == 401
