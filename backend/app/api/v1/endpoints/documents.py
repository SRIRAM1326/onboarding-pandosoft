from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime

from app.api import deps
from app.core.database import get_db
from app.core.config import settings
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.schemas.application import Application

router = APIRouter()

@router.post("/upload")
async def upload_document(
    application_id: int,
    document_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    file_path = os.path.join(settings.UPLOAD_DIR, f"{application_id}_{datetime.now().timestamp()}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    document = Document(
        application_id=application_id,
        document_type=document_type,
        file_name=file.filename,
        file_path=file_path,
        file_size=file.size,
        mime_type=file.content_type,
        status=DocumentStatus.UPLOADED,
        uploaded_by=current_user.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return {"message": "Document uploaded successfully", "document_id": document.id}

@router.get("/application/{application_id}")
def get_application_documents(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    documents = db.query(Document).filter(Document.application_id == application_id).all()
    return documents
