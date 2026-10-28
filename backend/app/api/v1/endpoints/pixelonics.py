from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.application import Application
from app.models.correction import Correction
from app.schemas.application import Application as ApplicationSchema

router = APIRouter()

PIXELONICS_ROLES = (
    UserRole.PIXELONICS_OPS,
    UserRole.PIXELONICS_ADMIN,
    UserRole.ADMINISTRATOR,
    UserRole.COMPLIANCE_REVIEWER,
    UserRole.COMPLIANCE_APPROVER,
)

@router.get("/dashboard")
def pixelonics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_roles(*PIXELONICS_ROLES)),
):
    new_apps = db.query(Application).count()
    pending_review = (
        db.query(Application)
        .filter(Application.status.in_(["submitted", "under_review", "pending_ops_review"]))
        .count()
    )
    corrections_raised = db.query(Correction).filter(Correction.status == "open").count()
    awaiting_compliance = (
        db.query(Application)
        .filter(Application.status == "ready_for_compliance")
        .count()
    )
    return {
        "new_applications": new_apps,
        "pending_ops_review": pending_review,
        "corrections_raised": corrections_raised,
        "awaiting_compliance": awaiting_compliance,
    }

@router.get("/applications", response_model=List[ApplicationSchema])
def pixelonics_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_roles(*PIXELONICS_ROLES)),
):
    return db.query(Application).order_by(Application.id.desc()).all()
