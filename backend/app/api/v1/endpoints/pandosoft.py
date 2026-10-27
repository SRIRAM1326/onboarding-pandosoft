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
def pandosoft_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_roles(UserRole.PANDOSOFT_REVIEWER, UserRole.PANDOSOFT_APPROVER)),
):
    awaiting = db.query(Application).filter(Application.status == "ready_for_compliance").count()
    return {
        "awaiting_review": awaiting,
        "in_review": 0,
        "approved": 0,
        "rejected": 0
    }

@router.get("/applications", response_model=List[ApplicationSchema])
def pandosoft_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_roles(UserRole.PANDOSOFT_REVIEWER, UserRole.PANDOSOFT_APPROVER)),
):
    applications = db.query(Application).filter(Application.status.in_(["ready_for_compliance", "pending_compliance_review", "compliance_review_in_progress"])).all()
    return applications
