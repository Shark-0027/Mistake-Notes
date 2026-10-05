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

