from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from app.config import settings
from app.ai.gemini_client import ai_client, SUPPORTED_MODELS
from app.schemas import SettingsStatusResponse, TestKeyRequest, TestKeyResponse

router = APIRouter(prefix="/api/settings", tags=["Settings & System Health"])

@router.get("/status", response_model=SettingsStatusResponse)
def get_settings_status():
    return SettingsStatusResponse(
        status="ok",
        gemini_configured=ai_client.is_configured(),
        active_model=settings.GEMINI_MODEL,
        use_mock_ai=settings.USE_MOCK_AI or not bool(settings.GEMINI_API_KEY),
        total_ai_requests=ai_client.request_count,
        mock_requests=ai_client.mock_request_count,
        real_requests=ai_client.real_request_count,
        available_models=SUPPORTED_MODELS
    )

@router.post("/test-key", response_model=TestKeyResponse)
def test_gemini_connection(req: TestKeyRequest):
    result = ai_client.test_connection(api_key=req.api_key, model_name=req.model_name)
    return TestKeyResponse(**result)

@router.put("/model")
def update_active_model(model_name: str = Body(..., embed=True)):
    if model_name not in SUPPORTED_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model '{model_name}'. Allowed: {', '.join(SUPPORTED_MODELS)}"
        )
    settings.GEMINI_MODEL = model_name
    return {"success": True, "active_model": settings.GEMINI_MODEL}

@router.put("/mock-mode")
def toggle_mock_mode(use_mock: bool = Body(..., embed=True)):
    settings.USE_MOCK_AI = use_mock
    return {"success": True, "use_mock_ai": settings.USE_MOCK_AI}

