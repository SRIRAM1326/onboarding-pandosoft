from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, applications, documents, pixelonics, pandosoft, corrections, notifications

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(pixelonics.router, prefix="/pixelonics", tags=["pixelonics"])
api_router.include_router(pandosoft.router, prefix="/pandosoft", tags=["pandosoft"])
api_router.include_router(corrections.router, prefix="/corrections", tags=["corrections"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
