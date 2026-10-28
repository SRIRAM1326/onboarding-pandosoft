from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.api import deps
from app.core.database import get_db
from app.models.correction import Correction, CorrectionStatus
from app.models.application import Application, ApplicationStatus
from app.models.audit import AuditLog
from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole

router = APIRouter()

class CorrectionCreatePayload(BaseModel):
    application_id: int
    category: str = "missing_information"
    sections: List[str] = ["business"]
    document_ids: List[str] = []
    reason: str
    instructions: str
    due_date: Optional[str] = None

class CorrectionRespondPayload(BaseModel):
    message: str

def serialize_correction(c: Correction) -> dict:
    return {
        "id": str(c.id),
        "applicationId": str(c.application_id),
        "sections": c.sections or ["business"],
        "documentIds": c.document_ids or [],
        "category": c.category,
        "reason": c.title or c.description,
        "instructions": c.instructions,
        "dueDate": c.due_date,
        "status": c.status,
        "createdAt": c.created_at.isoformat() if c.created_at else datetime.now(timezone.utc).isoformat(),
        "createdBy": {
            "id": str(c.raiser.id) if c.raiser else "staff",
            "name": c.raiser.full_name if c.raiser else "Compliance Team",
            "role": c.raiser.role.value if c.raiser and hasattr(c.raiser.role, "value") else "compliance_reviewer",
        },
        "responses": c.responses or [],
    }

@router.get("/")
def read_corrections(
    application_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    query = db.query(Correction)
    if application_id:
        query = query.filter(Correction.application_id == application_id)
    elif current_user.role == UserRole.CUSTOMER:
        app_ids = [a.id for a in db.query(Application).filter(Application.customer_id == current_user.id).all()]
        query = query.filter(Correction.application_id.in_(app_ids))
    items = query.order_by(Correction.id.desc()).all()
    return [serialize_correction(c) for c in items]

@router.post("/")
def create_correction(
    payload: CorrectionCreatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if current_user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Customers cannot raise correction requests.")
    app_obj = db.query(Application).filter(Application.id == payload.application_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    corr = Correction(
        application_id=payload.application_id,
        raised_by=current_user.id,
        category=payload.category,
        sections=payload.sections,
        document_ids=payload.document_ids,
        title=payload.reason,
        description=payload.reason,
        instructions=payload.instructions,
        due_date=payload.due_date,
        status=CorrectionStatus.OPEN.value,
        responses=[],
    )
    db.add(corr)
    app_obj.status = ApplicationStatus.ACTION_REQUIRED.value
    db.add(app_obj)

    db.add(
        AuditLog(
            application_id=app_obj.id,
            user_id=current_user.id,
            action="correction_requested",
            description=f"Correction requested: {payload.reason}",
        )
    )
    db.add(
        Notification(
            user_id=app_obj.customer_id,
            application_id=app_obj.id,
            title=f"Correction Requested: {payload.reason}",
            message=payload.instructions,
            type=NotificationType.ACTION_REQUIRED,
            link=f"/portal/applications/{app_obj.id}",
        )
    )
    db.commit()
    db.refresh(corr)
    return serialize_correction(corr)

@router.post("/{correction_id}/respond")
def respond_correction(
    correction_id: int,
    payload: CorrectionRespondPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    corr = db.query(Correction).filter(Correction.id == correction_id).first()
    if not corr:
        raise HTTPException(status_code=404, detail="Correction not found")
    now = datetime.now(timezone.utc)
    responses = list(corr.responses or [])
    responses.append(
        {
            "id": f"resp-{int(now.timestamp() * 1000)}",
            "message": payload.message,
            "respondedAt": now.isoformat(),
            "respondedBy": {
                "id": str(current_user.id),
                "name": current_user.full_name,
                "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
            },
        }
    )
    corr.responses = responses
    corr.response = payload.message
    corr.responded_by = current_user.id
    corr.responded_at = now
    corr.status = CorrectionStatus.RESPONDED.value
    db.add(corr)

    db.add(
        AuditLog(
            application_id=corr.application_id,
            user_id=current_user.id,
            action="correction_responded",
            description=f"Customer responded to correction #{corr.id}: {payload.message}",
        )
    )
    db.commit()
    db.refresh(corr)
    return serialize_correction(corr)

@router.post("/{correction_id}/resolve")
def resolve_correction(
    correction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if current_user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Only staff can resolve corrections")
    corr = db.query(Correction).filter(Correction.id == correction_id).first()
    if not corr:
        raise HTTPException(status_code=404, detail="Correction not found")
    corr.status = CorrectionStatus.RESOLVED.value
    db.add(corr)
    db.commit()
    db.refresh(corr)
    return serialize_correction(corr)
