from fastapi.testclient import TestClient

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

