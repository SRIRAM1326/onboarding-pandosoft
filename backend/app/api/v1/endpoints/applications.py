from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import random
import string

from app.api import deps
from app.core.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.models.correction import Correction, CorrectionStatus
from app.models.notification import Notification, NotificationType
from app.schemas.application import (
    Application as ApplicationSchema,
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationReview,
)

router = APIRouter()

DEFAULT_DECLARATIONS = [
    {
        "key": "board_resolution",
        "name": "Board Resolution / Authorization Letter",
        "description": "Resolution authorizing onboarding and signatory powers.",
        "hasTemplate": True,
        "requiresSignature": True,
        "requiresStamp": True,
        "acknowledged": False,
    },
    {
        "key": "lien_undertaking",
        "name": "Customer Undertaking for Lien Resolution",
        "description": "Undertaking regarding lien resolution process.",
        "hasTemplate": True,
        "requiresSignature": True,
        "requiresStamp": False,
        "acknowledged": False,
    },
    {
        "key": "client_onboarding_form",
        "name": "Client Onboarding Form",
        "description": "Completed client onboarding form.",
        "hasTemplate": True,
        "requiresSignature": True,
        "requiresStamp": True,
        "acknowledged": False,
    },
    {
        "key": "otc_aml_agreement",
        "name": "OTC AML Agreement",
        "description": "Anti-Money Laundering agreement for OTC transactions.",
        "hasTemplate": True,
        "requiresSignature": True,
        "requiresStamp": True,
        "acknowledged": False,
    },
    {
        "key": "source_of_funds_declaration",
        "name": "Source of Funds Declaration",
        "description": "Declaration of source of funds.",
        "hasTemplate": True,
        "requiresSignature": True,
        "requiresStamp": False,
        "acknowledged": False,
    },
    {
        "key": "ubo_declaration",
        "name": "UBO Declaration",
        "description": "Ultimate Beneficial Ownership declaration.",
        "hasTemplate": True,
        "requiresSignature": True,
        "requiresStamp": False,
        "acknowledged": False,
    },
    {
        "key": "wallet_declaration",
        "name": "Wallet Declaration",
        "description": "Declaration of wallet ownership and control.",
        "hasTemplate": True,
        "requiresSignature": True,
        "requiresStamp": False,
        "acknowledged": False,
    },
]

def generate_reference():
    return "PX-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.get("/", response_model=List[ApplicationSchema])
def read_applications(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    if current_user.role == UserRole.CUSTOMER:
        applications = (
            db.query(Application)
            .filter(Application.customer_id == current_user.id)
            .order_by(Application.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    else:
        applications = (
            db.query(Application)
            .order_by(Application.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    return applications

@router.post("/", response_model=ApplicationSchema)
def create_application(
    *,
    db: Session = Depends(get_db),
    application_in: ApplicationCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    customer_id = (
        application_in.customer_id
        if application_in.customer_id and current_user.role != UserRole.CUSTOMER
        else current_user.id
    )
    default_addr = {
        "line1": "",
        "line2": "",
        "city": "",
        "state": "",
        "postalCode": "",
        "country": "India",
    }
    application = Application(
        reference_number=generate_reference(),
        customer_id=customer_id,
        status=ApplicationStatus.DRAFT.value,
        legal_name=application_in.legal_name or "",
        entity_type="private_limited",
        business_email=application_in.business_email or "",
        business_phone=application_in.business_phone or "",
        registered_address=default_addr,
        operational_address=default_addr,
        operational_same_as_registered=True,
        directors=[],
        signatory={
            "fullName": application_in.contact_name or "",
            "designation": "",
            "email": application_in.business_email or "",
            "mobile": application_in.business_phone or "",
            "pan": "",
            "dateOfBirth": "",
            "idDocumentType": "aadhaar",
            "idDocumentNumber": "",
            "residentialAddress": default_addr,
            "authorizationSignedAndStamped": False,
        },
        beneficial_owners=[],
        financial={
            "bankAccount": {
                "bankName": "",
                "accountHolderName": application_in.legal_name or "",
                "accountNumber": "",
                "ifsc": "",
                "accountType": "current",
            },
            "sourceOfFundsCategory": "business_revenue",
            "sourceOfFundsExplanation": "",
            "expectedVolumeRange": "",
            "expectedFrequency": "",
            "tradingActivityDescription": "",
        },
        wallets=[],
        declarations=DEFAULT_DECLARATIONS,
        video_kyc={"status": "not_scheduled", "durationMinutes": 15},
        verifications=[],
        internal_notes=[],
        ops_checklist={
            "completeness": False,
            "documentsUploaded": False,
            "signedAndStamped": False,
            "readyForCompliance": False,
        },
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    audit = AuditLog(
        application_id=application.id,
        user_id=current_user.id,
        action="application_created",
        description=f"Application {application.reference_number} created by {current_user.full_name}.",
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

    update_data = application_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)

    application.updated_at = datetime.now(timezone.utc)
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

    application.status = ApplicationStatus.UNDER_REVIEW.value
    application.submitted_at = datetime.now(timezone.utc)
    application.updated_at = datetime.now(timezone.utc)
    db.add(application)

    audit = AuditLog(
        application_id=application.id,
        user_id=current_user.id,
        action="application_submitted",
        description=f"Application {application.reference_number} submitted for compliance review.",
    )
    db.add(audit)

    notif = Notification(
        user_id=application.customer_id,
        application_id=application.id,
        title="Application Submitted",
        message=f"Your application {application.reference_number} has been submitted and is under review.",
        type=NotificationType.INFO,
        link=f"/portal/applications/{application.id}",
    )
    db.add(notif)

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

    now = datetime.now(timezone.utc)
    action = review_in.action

    if action in ["approve_ops", "mark_ready_compliance"]:
        application.status = ApplicationStatus.READY_FOR_COMPLIANCE.value
        application.ops_reviewed_at = now
        application.ops_review_notes = review_in.notes
        application.ops_checklist = {
            "completeness": True,
            "documentsUploaded": True,
            "signedAndStamped": True,
            "readyForCompliance": True,
        }
    elif action == "request_corrections":
        application.status = ApplicationStatus.ACTION_REQUIRED.value
        if review_in.corrections:
            for corr_item in review_in.corrections:
                corr = Correction(
                    application_id=application.id,
                    raised_by=current_user.id,
                    category=corr_item.get("category", "missing_information"),
                    sections=corr_item.get("sections", ["business"]),
                    document_ids=corr_item.get("documentIds", []),
                    title=corr_item.get("reason", "Correction Requested"),
                    description=corr_item.get("reason", review_in.notes or ""),
                    instructions=corr_item.get("instructions", review_in.notes or ""),
                    status=CorrectionStatus.OPEN.value,
                )
                db.add(corr)
        notif = Notification(
            user_id=application.customer_id,
            application_id=application.id,
            title="Action Required on Your Application",
            message=review_in.notes or "Please review and respond to the requested corrections.",
            type=NotificationType.ACTION_REQUIRED,
            link=f"/portal/applications/{application.id}",
        )
        db.add(notif)
    elif action in ["approve_compliance", "approve"]:
        application.status = ApplicationStatus.APPROVED.value
        application.compliance_reviewed_at = now
        application.compliance_review_notes = review_in.notes
        application.decision_reason = review_in.notes
        application.decided_at = now
        notif = Notification(
            user_id=application.customer_id,
            application_id=application.id,
            title="Application Approved",
            message=f"Your corporate onboarding application {application.reference_number} has been approved.",
            type=NotificationType.SUCCESS,
            link=f"/portal/applications/{application.id}",
        )
        db.add(notif)
    elif action == "reject":
        application.status = ApplicationStatus.REJECTED.value
        application.decision_reason = review_in.notes
        application.decided_at = now
        notif = Notification(
            user_id=application.customer_id,
            application_id=application.id,
            title="Application Decision Update",
            message=f"Application {application.reference_number} was not approved. Reason: {review_in.notes or 'Compliance policy criteria'}",
            type=NotificationType.ERROR,
            link=f"/portal/applications/{application.id}",
        )
        db.add(notif)
    elif action == "add_note":
        notes = list(application.internal_notes or [])
        notes.append({
            "id": f"note-{int(now.timestamp() * 1000)}",
            "body": review_in.notes or "",
            "author": {
                "id": str(current_user.id),
                "name": current_user.full_name,
                "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
            },
            "createdAt": now.isoformat(),
        })
        application.internal_notes = notes
    elif action == "verify_wallet":
        wallets = list(application.wallets or [])
        for w in wallets:
            if not review_in.subject_id or w.get("id") == review_in.subject_id:
                w["verificationStatus"] = review_in.outcome or "verified_demo"
                w["verificationNote"] = review_in.notes or "Verified by compliance"
        application.wallets = wallets
    elif action == "record_video_kyc":
        vkyc = dict(application.video_kyc or {"durationMinutes": 15})
        vkyc["status"] = review_in.outcome or "completed"
        vkyc["outcomeNote"] = review_in.notes or "Video KYC verified successfully"
        application.video_kyc = vkyc

    application.updated_at = now
    db.add(application)

    audit = AuditLog(
        application_id=application.id,
        user_id=current_user.id,
        action=f"review_{action}",
        description=review_in.notes or f"Action {action} recorded by {current_user.full_name}",
    )
    db.add(audit)
    db.commit()
    db.refresh(application)
    return application

@router.get("/{id}/audit-logs")
def read_application_audit_logs(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
):
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.application_id == id)
        .order_by(AuditLog.id.desc())
        .all()
    )
    return [
        {
            "id": str(log.id),
            "applicationId": str(log.application_id),
            "action": log.action,
            "description": log.description,
            "timestamp": log.created_at.isoformat() if log.created_at else datetime.now(timezone.utc).isoformat(),
            "actor": {
                "id": str(log.user.id) if log.user else "system",
                "name": log.user.full_name if log.user else "System",
                "role": log.user.role.value if log.user and hasattr(log.user.role, "value") else "system",
            },
        }
        for log in logs
    ]
