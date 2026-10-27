def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_settings_status(client):
    response = client.get("/api/settings/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "available_models" in data
    assert "gemini-2.5-flash" in data["available_models"]
    assert data["use_mock_ai"] is True

