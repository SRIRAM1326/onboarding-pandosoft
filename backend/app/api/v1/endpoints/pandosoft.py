from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.application import Application
from app.schemas.application import Application as ApplicationSchema

router = APIRouter()

PANDOSOFT_ROLES = (
    UserRole.PANDOSOFT_REVIEWER,
    UserRole.PANDOSOFT_APPROVER,
    UserRole.ADMINISTRATOR,
    UserRole.COMPLIANCE_REVIEWER,
    UserRole.COMPLIANCE_APPROVER,
)

@router.get("/dashboard")
def pandosoft_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_roles(*PANDOSOFT_ROLES)),
):
    awaiting = (
        db.query(Application)
        .filter(Application.status.in_(["ready_for_compliance", "under_review", "pending_compliance_review"]))
        .count()
    )
    in_review = (
        db.query(Application)
        .filter(Application.status == "compliance_review_in_progress")
        .count()
    )
    approved = db.query(Application).filter(Application.status == "approved").count()
    rejected = db.query(Application).filter(Application.status == "rejected").count()
    return {
        "awaiting_review": awaiting,
        "in_review": in_review,
        "approved": approved,
        "rejected": rejected,
    }

@router.get("/applications", response_model=List[ApplicationSchema])
def pandosoft_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_roles(*PANDOSOFT_ROLES)),
):
    return (
        db.query(Application)
        .filter(
            Application.status.in_(
                [
                    "ready_for_compliance",
                    "under_review",
                    "pending_compliance_review",
                    "compliance_review_in_progress",
                    "approved",
                    "rejected",
                ]
            )
        )
        .order_by(Application.id.desc())
        .all()
    )
