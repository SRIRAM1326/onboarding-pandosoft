from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(
    title="Pixelonics Onboarding API",
    description="Pixelonics × Pandosoft India Private Limited - Client Onboarding Portal API",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Create upload directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Pixelonics Onboarding API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
