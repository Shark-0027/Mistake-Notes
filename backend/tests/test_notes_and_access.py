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
        "version_number": 1,
    }

    second_auth = login(client)
    detail = client.get("/api/records/wrong_001").json()
    assert detail["note"]["cause_note"] == "复习行列式"
    assert detail["note"]["review_note"] == "记住错项符号"
    assert detail["note"]["version_number"] == 1
    assert detail["feedback"].startswith("该题学生核心逻辑正确")

    cleared = client.put(
        "/api/records/wrong_001/notes",
        json={"cause_note": "", "review_note": ""},
        headers={"X-CSRF-Token": second_auth["csrf_token"]},
    )
    assert cleared.status_code == 200
    assert cleared.json() == {
        "cause_note": "",
        "review_note": "",
        "version_number": 1,
    }
    assert client.get("/api/records/wrong_001").json()["note"] == {
        "cause_note": "",
        "review_note": "",
        "version_number": 1,
    }


def test_note_versions_create_history_and_restore(client: TestClient) -> None:
    auth = login(client)

    first = client.put(
        "/api/records/wrong_001/notes",
        json={"cause_note": "第一版错因", "review_note": "第一版笔记"},
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert first.status_code == 200
    assert first.json()["version_number"] == 1

    second = client.put(
        "/api/records/wrong_001/notes",
        json={
            "cause_note": "第二版错因",
            "review_note": "第二版笔记",
            "as_new_version": True,
        },
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert second.status_code == 200
    assert second.json()["version_number"] == 2

    overwritten = client.put(
        "/api/records/wrong_001/notes",
        json={"cause_note": "第二版已修改", "review_note": "第二版笔记已修改"},
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert overwritten.status_code == 200
    assert overwritten.json()["version_number"] == 2

    history = client.get("/api/records/wrong_001/notes/versions")
    assert history.status_code == 200
    versions = history.json()
    assert [item["version_number"] for item in versions] == [2, 1]
    assert versions[0]["cause_note"] == "第二版已修改"
    assert versions[0]["review_note"] == "第二版笔记已修改"
    assert versions[1]["cause_note"] == "第一版错因"
    assert versions[1]["review_note"] == "第一版笔记"

    restored = client.post(
        "/api/records/wrong_001/notes/versions/1/restore",
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert restored.status_code == 200
    assert restored.json() == {
        "cause_note": "第一版错因",
        "review_note": "第一版笔记",
        "version_number": 3,
    }

    versions_after_restore = client.get(
        "/api/records/wrong_001/notes/versions"
    ).json()
    assert [item["version_number"] for item in versions_after_restore] == [3, 2, 1]
    assert versions_after_restore[0]["cause_note"] == "第一版错因"
    assert versions_after_restore[2]["cause_note"] == "第一版错因"


def test_note_versions_allow_empty_snapshot_and_are_owner_only(
    client: TestClient,
) -> None:
    auth = login(client)
    initial_version = client.get("/api/records/wrong_001").json()["note"][
        "version_number"
    ]
    saved = client.put(
        "/api/records/wrong_001/notes",
        json={
            "cause_note": "",
            "review_note": "",
            "as_new_version": True,
        },
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert saved.status_code == 200
    assert saved.json() == {
        "cause_note": "",
        "review_note": "",
        "version_number": initial_version + 1,
    }
    versions = client.get("/api/records/wrong_001/notes/versions").json()
    assert versions[0]["version_number"] == initial_version + 1
    assert versions[0]["cause_note"] == ""
    assert versions[0]["review_note"] == ""

    other_auth = login(client, "student_002")
    assert client.get("/api/records/wrong_001/notes/versions").status_code == 403
    assert (
        client.post(
            "/api/records/wrong_001/notes/versions/1/restore",
            headers={"X-CSRF-Token": other_auth["csrf_token"]},
        ).status_code
        == 403
    )


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

