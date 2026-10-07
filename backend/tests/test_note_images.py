from pathlib import Path

from fastapi.testclient import TestClient

from .conftest import login

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"test-image-content"


def test_note_image_upload_list_read_delete(
    client: TestClient,
    tmp_path: Path,
) -> None:
    auth = login(client)
    uploaded = client.post(
        "/api/records/wrong_001/note-images",
        files={"file": ("草稿.png", PNG_BYTES, "image/png")},
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert uploaded.status_code == 201, uploaded.text
    payload = uploaded.json()
    assert payload["filename"] == "草稿.png"
    assert payload["mime"] == "image/png"
    assert payload["size"] == len(PNG_BYTES)
    assert payload["version_number"] == client.get(
        "/api/records/wrong_001"
    ).json()["note"]["version_number"]

    listed = client.get("/api/records/wrong_001/note-images")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [payload["id"]]

    image = client.get(payload["url"])
    assert image.status_code == 200
    assert image.headers["content-type"] == "image/png"
    assert image.content == PNG_BYTES
    assert (tmp_path / "note_images" / f"{payload['id']}.png").is_file()

    deleted = client.delete(
        payload["url"],
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert deleted.status_code == 204
    assert client.get(payload["url"]).status_code == 404
    assert client.get("/api/records/wrong_001/note-images").json() == []


def test_note_image_rejects_bad_type_and_oversize(client: TestClient) -> None:
    auth = login(client)
    bad_type = client.post(
        "/api/records/wrong_001/note-images",
        files={"file": ("notes.txt", b"not an image", "text/plain")},
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert bad_type.status_code == 415
    assert bad_type.json()["detail"] == "仅支持 JPG、PNG、WebP 图片"

    oversized = client.post(
        "/api/records/wrong_001/note-images",
        files={
            "file": (
                "too-large.png",
                PNG_BYTES + b"x" * (5 * 1024 * 1024),
                "image/png",
            )
        },
        headers={"X-CSRF-Token": auth["csrf_token"]},
    )
    assert oversized.status_code == 413
    assert oversized.json()["detail"] == "图片不能超过 5MB"


def test_note_image_read_and_delete_are_owner_only(client: TestClient) -> None:
    owner_auth = login(client)
    uploaded = client.post(
        "/api/records/wrong_001/note-images",
        files={"file": ("private.png", PNG_BYTES, "image/png")},
        headers={"X-CSRF-Token": owner_auth["csrf_token"]},
    )
    assert uploaded.status_code == 201
    image_url = uploaded.json()["url"]

    other_auth = login(client, "student_002")
    assert client.get(image_url).status_code == 403
    assert (
        client.delete(
            image_url,
            headers={"X-CSRF-Token": other_auth["csrf_token"]},
        ).status_code
        == 403
    )
    assert client.get("/api/records/wrong_001/note-images").status_code == 403
