from fastapi.testclient import TestClient

from app.main import app


def test_openapi_available_without_external_services() -> None:
    with TestClient(app) as client:
        response = client.get("/openapi.json")
    assert response.status_code == 200
    assert response.json()["info"]["title"] == "Chord House API"
    assert response.json()["paths"] == {}
