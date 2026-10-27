from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import random
import string

from app.api import deps
from app.core.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.application import Application as ApplicationSchema, ApplicationCreate, ApplicationUpdate, ApplicationReview

router = APIRouter()

def generate_reference():
    return "PX-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@router.get("/", response_model=List[ApplicationSchema])
def read_applications(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    if current_user.role == UserRole.CUSTOMER:
        applications = db.query(Application).filter(Application.customer_id == current_user.id).offset(skip).limit(limit).all()
    elif current_user.role in [UserRole.PIXELONICS_OPS, UserRole.PIXELONICS_ADMIN]:
        applications = db.query(Application).offset(skip).limit(limit).all()
    elif current_user.role in [UserRole.PANDOSOFT_REVIEWER, UserRole.PANDOSOFT_APPROVER]:
        applications = db.query(Application).filter(Application.status.in_([ApplicationStatus.READY_FOR_COMPLIANCE, ApplicationStatus.PENDING_COMPLIANCE_REVIEW, ApplicationStatus.COMPLIANCE_REVIEW_IN_PROGRESS])).offset(skip).limit(limit).all()
    else:
        applications = db.query(Application).offset(skip).limit(limit).all()
    return applications

@router.post("/", response_model=ApplicationSchema)
def create_application(
    *,
    db: Session = Depends(get_db),
    application_in: ApplicationCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    customer_id = application_in.customer_id if application_in.customer_id and current_user.role in [UserRole.PIXELONICS_OPS, UserRole.PIXELONICS_ADMIN] else current_user.id
    application = Application(
        reference_number=generate_reference(),
        customer_id=customer_id,
        status=ApplicationStatus.DRAFT,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    # Audit log
    audit = AuditLog(
        application_id=application.id,
        user_id=current_user.id,
        action="APPLICATION_CREATED",
        description=f"Application {application.reference_number} created"
    )
    db.add(audit)
    db.commit()
    
    return application

@router.get("/{id}", response_model=ApplicationSchema)
def read_application(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
):
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == UserRole.CUSTOMER and application.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return application

@router.put("/{id}", response_model=ApplicationSchema)
def update_application(
    *,
    db: Session = Depends(get_db),
    id: int,
    application_in: ApplicationUpdate,
    current_user: User = Depends(deps.get_current_active_user),
):
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == UserRole.CUSTOMER and application.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = application_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
    
    application.updated_at = datetime.utcnow()
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

@router.post("/{id}/submit", response_model=ApplicationSchema)
def submit_application(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
):
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == UserRole.CUSTOMER and application.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    application.status = ApplicationStatus.PENDING_OPS_REVIEW
    application.submitted_at = datetime.utcnow()
    db.add(application)
    
    audit = AuditLog(
        application_id=application.id,
        user_id=current_user.id,
        action="APPLICATION_SUBMITTED",
        description=f"Application {application.reference_number} submitted"
    )
    db.add(audit)
    db.commit()
    db.refresh(application)
    return application

@router.post("/{id}/review", response_model=ApplicationSchema)
def review_application(
    *,
    db: Session = Depends(get_db),
    id: int,
    review_in: ApplicationReview,
    current_user: User = Depends(deps.get_current_active_user),
):
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if review_in.action == "approve_ops" and current_user.role in [UserRole.PIXELONICS_OPS, UserRole.PIXELONICS_ADMIN]:
        application.status = ApplicationStatus.READY_FOR_COMPLIANCE
        application.ops_reviewed_at = datetime.utcnow()
        application.ops_review_notes = review_in.notes
    elif review_in.action == "request_corrections" and current_user.role in [UserRole.PIXELONICS_OPS, UserRole.PIXELONICS_ADMIN]:
        application.status = ApplicationStatus.CORRECTIONS_REQUESTED
    elif review_in.action == "approve_compliance" and current_user.role in [UserRole.PANDOSOFT_REVIEWER, UserRole.PANDOSOFT_APPROVER]:
        application.status = ApplicationStatus.APPROVED
        application.compliance_reviewed_at = datetime.utcnow()
        application.compliance_review_notes = review_in.notes
        application.decided_at = datetime.utcnow()
    elif review_in.action == "reject" and current_user.role in [UserRole.PIXELONICS_OPS, UserRole.PIXELONICS_ADMIN, UserRole.PANDOSOFT_REVIEWER, UserRole.PANDOSOFT_APPROVER]:
        application.status = ApplicationStatus.REJECTED
        application.decision_reason = review_in.notes
        application.decided_at = datetime.utcnow()
    
    db.add(application)
    audit = AuditLog(
        application_id=application.id,
        user_id=current_user.id,
        action=f"REVIEW_{review_in.action.upper()}",
        description=f"Review action: {review_in.action}"
    )
    db.add(audit)
    db.commit()
    db.refresh(application)
    return application
