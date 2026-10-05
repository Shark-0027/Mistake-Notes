from fastapi.testclient import TestClient

from .conftest import login


def test_detail_and_note_write_reject_other_students(client: TestClient) -> None:
    login(client, "student_002")
    assert client.get("/api/records/wrong_001").status_code == 403

    auth = login(client, "student_002")
    response = client.put(
        "/api/records/wrong_001/notes",
        json={"cause_note": "越权", "review_note": "越权"},
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert response.status_code == 403


def test_notes_persist_across_login_and_clear_exactly(client: TestClient) -> None:
    auth = login(client)
    saved = client.put(
        "/api/records/wrong_001/notes",
        json={"cause_note": "复习行列式", "review_note": "记住错项符号"},
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert saved.status_code == 200
    assert saved.json() == {
        "cause_note": "复习行列式",
        "review_note": "记住错项符号",
    }

    second_auth = login(client)
    detail = client.get("/api/records/wrong_001").json()
    assert detail["note"]["cause_note"] == "复习行列式"
    assert detail["note"]["review_note"] == "记住错项符号"
    assert detail["feedback"].startswith("该题学生核心逻辑正确")

    cleared = client.put(
        "/api/records/wrong_001/notes",
        json={"cause_note": "", "review_note": ""},
        headers={"X-CSRF-Token": second_auth["csrf_token"]},
    )
    assert cleared.status_code == 200
    assert cleared.json() == {"cause_note": "", "review_note": ""}
    assert client.get("/api/records/wrong_001").json()["note"] == {
        "cause_note": "",
        "review_note": "",
    }


def test_note_payload_cannot_override_student(client: TestClient) -> None:
    auth = login(client)
    response = client.put(
        "/api/records/wrong_001/notes",
        json={
            "cause_note": "a",
            "review_note": "b",
            "studentId": "student_002",
        },
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert response.status_code == 422

