import json
from pathlib import Path

from fastapi.testclient import TestClient

from .conftest import ROOT, login


def test_expected_filter_cases(client: TestClient) -> None:
    cases = json.loads(
        (ROOT / "data/03-wrong-answer-supplement/expected-filters.json").read_text(
            encoding="utf-8"
        )
    )["cases"]

    for case in cases:
        login(client, case["login"])
        response = client.get("/api/records", params=case["filters"])
        assert response.status_code == 200, case["caseId"]
        actual = sorted(item["id"] for item in response.json())
        assert actual == sorted(case["expectedRecordIds"]), case["caseId"]


def test_catalog_is_scoped_to_current_student(client: TestClient) -> None:
    login(client, "student_004")
    response = client.get("/api/catalog")
    assert response.status_code == 200
    assert [course["id"] for course in response.json()["courses"]] == ["course_002"]
    assert response.json()["knowledge_points"]


def test_course_aliases_apply_for_records_and_catalog(client: TestClient) -> None:
    login(client, "student_001")
    for parameter in ("course", "courseId"):
        other_course = client.get("/api/records", params={parameter: "course_002"})
        own_course = client.get("/api/records", params={parameter: "course_001"})
        assert other_course.status_code == 200
        assert other_course.json() == []
        assert own_course.status_code == 200
        assert [item["id"] for item in own_course.json()] == [
            "wrong_001",
            "wrong_002",
            "wrong_003",
            "wrong_004",
            "wrong_005",
        ]
        detail = client.get("/api/records/wrong_001")
        assert detail.json()["score_display"] == "8.36"
        assert detail.json()["max_score_display"] == "10"

    login(client, "student_004")
    for parameter in ("course", "courseId"):
        wrong_course = client.get("/api/catalog", params={parameter: "course_001"})
        own_course = client.get("/api/catalog", params={parameter: "course_002"})
        assert wrong_course.status_code == 200
        assert wrong_course.json()["knowledge_points"] == []
        assert own_course.status_code == 200
        assert own_course.json()["knowledge_points"]
