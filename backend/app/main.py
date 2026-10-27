import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base
from app.routers import (
    books, blueprints, chapters, assistant, sources, covers, exports, settings as app_settings
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
    os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
    yield

app = FastAPI(
    title="AI Ebook Studio API",
    version="1.0.0",
    description="Full-stack AI Ebook Creation Platform API powered by Google Gemini and SQLite",
    lifespan=lifespan
)

# CORS configuration
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static cover images
if os.path.exists(settings.UPLOADS_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")

# Include Routers
app.include_router(books.router)
app.include_router(blueprints.router)
app.include_router(chapters.router)
app.include_router(assistant.router)
app.include_router(sources.router)
app.include_router(covers.router)
app.include_router(exports.router)
app.include_router(app_settings.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "AI Ebook Studio",
        "version": "1.0.0",
        "database": "connected",
        "environment": settings.ENVIRONMENT
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Do not leak API keys or internal stack trace details
    err_msg = str(exc)
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY in err_msg:
        err_msg = err_msg.replace(settings.GEMINI_API_KEY, "[REDACTED_API_KEY]")
    return JSONResponse(
        status_code=500,
        content={"detail": f"An internal server error occurred: {err_msg}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

