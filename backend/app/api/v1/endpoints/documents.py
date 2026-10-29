from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
from datetime import datetime, timezone

from app.api import deps
from app.core.database import get_db
from app.core.config import settings
from app.core.doc_generator import generate_pdf_bytes, generate_docx_bytes, DECLARATION_TITLES
from app.models.application import Application
from app.models.document import Document, DocumentStatus
from app.models.audit import AuditLog
from app.models.user import User, UserRole

router = APIRouter()

class DocumentReviewPayload(BaseModel):
    status: str  # verified_demo, rejected_demo, replacement_required, under_review
    reviewer_notes: Optional[str] = ""

@router.post("/upload")
async def upload_document(
    application_id: int = Form(...),
    document_type: str = Form(...),
    section: str = Form("business"),
    label: str = Form(""),
    owner_ref: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Customer can upload image, PDF, DOC, or any other file format
    # Content and format must be saved in the database exactly as uploaded without conversion or compression
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds maximum upload size (100MB).")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_name = os.path.basename(file.filename or "document")
    stored_name = f"app{application_id}_{int(datetime.now(timezone.utc).timestamp())}_{safe_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    existing = (
        db.query(Document)
        .filter(
            Document.application_id == application_id,
            Document.document_type == document_type,
            Document.owner_ref == owner_ref,
        )
        .first()
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    mime_type = file.content_type or "application/octet-stream"
    if existing:
        existing.version = (existing.version or 1) + 1
        existing.file_name = safe_name
        existing.file_path = file_path
        existing.file_size = len(content)
        existing.mime_type = mime_type
        existing.file_data = content
        existing.status = DocumentStatus.READY_FOR_REVIEW.value
        hist = list(existing.history or [])
        hist.append(
            {
                "version": existing.version,
                "fileName": safe_name,
                "fileSize": len(content),
                "uploadedAt": now_iso,
                "status": DocumentStatus.READY_FOR_REVIEW.value,
            }
        )
        existing.history = hist
        db.add(existing)
        document = existing
    else:
        document = Document(
            application_id=application_id,
            document_type=document_type,
            section=section,
            label=label or safe_name,
            file_name=safe_name,
            file_path=file_path,
            file_size=len(content),
            mime_type=mime_type,
            file_data=content,
            status=DocumentStatus.READY_FOR_REVIEW.value,
            owner_ref=owner_ref,
            version=1,
            history=[
                {
                    "version": 1,
                    "fileName": safe_name,
                    "fileSize": len(content),
                    "uploadedAt": now_iso,
                    "status": DocumentStatus.READY_FOR_REVIEW.value,
                }
            ],
            uploaded_by=current_user.id,
        )
        db.add(document)

    audit = AuditLog(
        application_id=application_id,
        user_id=current_user.id,
        action="document_uploaded",
        description=f"Uploaded {label or document_type} ({safe_name})",
    )
    db.add(audit)
    db.commit()
    db.refresh(document)

    return {
        "id": str(document.id),
        "applicationId": str(document.application_id),
        "requirementKey": document.document_type,
        "section": document.section,
        "ownerRef": document.owner_ref,
        "label": document.label,
        "fileName": document.file_name,
        "fileSize": document.file_size,
        "mimeType": document.mime_type,
        "uploadedAt": document.created_at.isoformat() if document.created_at else now_iso,
        "version": document.version,
        "status": document.status,
        "reviewerNotes": document.reviewer_notes or "",
        "history": document.history or [],
    }

@router.get("/application/{application_id}")
def get_application_documents(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    documents = db.query(Document).filter(Document.application_id == application_id).all()
    return [
        {
            "id": str(d.id),
            "applicationId": str(d.application_id),
            "requirementKey": d.document_type,
            "section": d.section or "business",
            "ownerRef": d.owner_ref,
            "label": d.label or d.file_name,
            "fileName": d.file_name,
            "fileSize": d.file_size or 0,
            "mimeType": d.mime_type or "application/pdf",
            "uploadedAt": d.created_at.isoformat() if d.created_at else datetime.now(timezone.utc).isoformat(),
            "version": d.version or 1,
            "status": d.status,
            "reviewerNotes": d.reviewer_notes or "",
            "history": d.history or [],
        }
        for d in documents
    ]

@router.post("/{document_id}/review")
def review_document(
    document_id: int,
    payload: DocumentReviewPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if current_user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Only staff can review documents.")
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.status = payload.status
    doc.reviewer_notes = payload.reviewer_notes or ""
    doc.reviewed_by = current_user.id
    doc.reviewed_at = datetime.now(timezone.utc)
    db.add(doc)

    audit = AuditLog(
        application_id=doc.application_id,
        user_id=current_user.id,
        action="document_reviewed",
        description=f"Document '{doc.label or doc.file_name}' marked as {payload.status}",
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)
    return {"id": str(doc.id), "status": doc.status, "reviewerNotes": doc.reviewer_notes}

@router.get("/{document_id}/file")
def get_document_file(document_id: int, download: bool = False, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    data = doc.file_data
    if not data and doc.file_path and os.path.exists(doc.file_path):
        with open(doc.file_path, "rb") as f:
            data = f.read()
    if not data:
        raise HTTPException(status_code=404, detail="File content not found in database or disk")

    disposition = "attachment" if download else "inline"
    safe_name = os.path.basename(doc.file_name or f"document_{doc.id}")
    return Response(
        content=data,
        media_type=doc.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'{disposition}; filename="{safe_name}"'}
    )

@router.get("/generate/{application_id}/{declaration_key}")
def generate_declaration_document(
    application_id: int,
    declaration_key: str,
    format: str = "pdf",
    db: Session = Depends(get_db),
):
    app_obj = db.query(Application).filter(Application.id == application_id).first()
    if not app_obj:
        app_obj = db.query(Application).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    if declaration_key not in DECLARATION_TITLES:
        raise HTTPException(status_code=400, detail="Unknown declaration template key")

    if format.lower() == "docx":
        data = generate_docx_bytes(app_obj, declaration_key)
        filename = f"{app_obj.reference_number}_{declaration_key}.docx"
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        data = generate_pdf_bytes(app_obj, declaration_key)
        filename = f"{app_obj.reference_number}_{declaration_key}.pdf"
        media_type = "application/pdf"

    return Response(
        content=data,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.post("/video-kyc")
async def upload_video_kyc(
    application_id: str = Form("app-demo-001"),
    reference: str = Form("PX-DEMO-001"),
    spoken_script: str = Form(""),
    uploaded_by: str = Form("customer"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    content = await file.read()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_name = os.path.basename(file.filename or "video_kyc.mp4").replace(" ", "_")
    ts = int(datetime.now(timezone.utc).timestamp())
    stored_name = f"{application_id}_{ts}_{safe_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    video_url = f"http://localhost:8000/uploads/{stored_name}"
    now_iso = datetime.now(timezone.utc).isoformat()
    mime_type = file.content_type or "video/mp4"

    # Find matching application in SQLite
    app_obj = None
    if application_id.isdigit():
        app_obj = db.query(Application).filter(Application.id == int(application_id)).first()
    if not app_obj and reference:
        app_obj = db.query(Application).filter(Application.reference_number == reference).first()
    if not app_obj:
        app_obj = db.query(Application).order_by(Application.id.asc()).first()

    doc_id = f"doc-vkyc-{ts}"
    if app_obj:
        vkyc = dict(app_obj.video_kyc or {})
        vkyc.update({
            "status": "completed",
            "videoUrl": video_url,
            "fileName": file.filename or safe_name,
            "fileSize": len(content),
            "mimeType": mime_type,
            "uploadedAt": now_iso,
            "spokenScript": spoken_script,
            "outcomeNote": "Customer recorded and uploaded Video KYC declaration.",
        })
        app_obj.video_kyc = vkyc
        app_obj.updated_at = datetime.now(timezone.utc)
        db.add(app_obj)

        existing = (
            db.query(Document)
            .filter(
                Document.application_id == app_obj.id,
                Document.document_type == "video_kyc",
            )
            .first()
        )
        if existing:
            existing.version = (existing.version or 1) + 1
            existing.file_name = file.filename or safe_name
            existing.file_path = file_path
            existing.file_size = len(content)
            existing.mime_type = mime_type
            existing.status = DocumentStatus.READY_FOR_REVIEW.value
            hist = list(existing.history or [])
            hist.append({
                "version": existing.version,
                "fileName": file.filename or safe_name,
                "fileSize": len(content),
                "uploadedAt": now_iso,
                "status": DocumentStatus.READY_FOR_REVIEW.value,
            })
            existing.history = hist
            db.add(existing)
            doc_obj = existing
        else:
            doc_obj = Document(
                application_id=app_obj.id,
                document_type="video_kyc",
                section="declarations",
                label="Video KYC Recording",
                file_name=file.filename or safe_name,
                file_path=file_path,
                file_size=len(content),
                mime_type=mime_type,
                status=DocumentStatus.READY_FOR_REVIEW.value,
                version=1,
                history=[{
                    "version": 1,
                    "fileName": file.filename or safe_name,
                    "fileSize": len(content),
                    "uploadedAt": now_iso,
                    "status": DocumentStatus.READY_FOR_REVIEW.value,
                }],
            )
            db.add(doc_obj)

        audit = AuditLog(
            application_id=app_obj.id,
            action="video_kyc_uploaded",
            description=f"Customer ({uploaded_by}) uploaded Video KYC recording ({file.filename or safe_name})",
        )
        db.add(audit)
        db.commit()
        db.refresh(doc_obj)
        doc_id = str(doc_obj.id)

    return {
        "success": True,
        "savedToDatabase": True,
        "documentId": doc_id,
        "applicationId": application_id,
        "fileName": file.filename or safe_name,
        "fileSize": len(content),
        "mimeType": mime_type,
        "videoUrl": video_url,
        "spokenScript": spoken_script,
        "uploadedAt": now_iso,
    }

@router.get("/video-kyc")
def list_video_kyc_recordings(db: Session = Depends(get_db)):
    apps = db.query(Application).all()
    results = []
    for a in apps:
        vkyc = a.video_kyc or {}
        if vkyc.get("videoUrl"):
            results.append({
                "applicationId": "app-demo-001" if a.reference_number == "PX-DEMO-001" else str(a.id),
                "reference": a.reference_number,
                "videoUrl": vkyc.get("videoUrl"),
                "fileName": vkyc.get("fileName", "Video_KYC.mp4"),
                "fileSize": vkyc.get("fileSize", 0),
                "mimeType": vkyc.get("mimeType", "video/mp4"),
                "uploadedAt": vkyc.get("uploadedAt"),
                "spokenScript": vkyc.get("spokenScript", ""),
            })
    return {"recordings": results}
