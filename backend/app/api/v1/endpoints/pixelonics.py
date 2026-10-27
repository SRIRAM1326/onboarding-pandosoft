from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.application import Application
from app.schemas.application import Application as ApplicationSchema

router = APIRouter()

@router.get("/dashboard")
def pixelonics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_roles(UserRole.PIXELONICS_OPS, UserRole.PIXELONICS_ADMIN)),
):
    new_apps = db.query(Application).count()
    pending_review = db.query(Application).filter(Application.status == "pending_ops_review").count()
    return {
        "new_applications": new_apps,
        "pending_ops_review": pending_review,
        "corrections_raised": 0,
        "awaiting_compliance": 0
    }

@router.get("/applications", response_model=List[ApplicationSchema])
def pixelonics_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_roles(UserRole.PIXELONICS_OPS, UserRole.PIXELONICS_ADMIN)),
):
    applications = db.query(Application).all()
    return applications
