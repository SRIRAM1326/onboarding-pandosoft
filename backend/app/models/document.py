from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class DocumentStatus(str, enum.Enum):
    NOT_UPLOADED = "not_uploaded"
    UPLOADED = "uploaded"
    READY_FOR_REVIEW = "ready_for_review"
    UNDER_REVIEW = "under_review"
    PENDING_REVIEW = "pending_review"
    VERIFIED = "verified"
    VERIFIED_DEMO = "verified_demo"
    REJECTED = "rejected"
    REJECTED_DEMO = "rejected_demo"
    REPLACEMENT_REQUIRED = "replacement_required"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    document_type = Column(String, nullable=False)
    section = Column(String, default="business")
    label = Column(String, default="")
    file_name = Column(String)
    file_path = Column(String)
    file_size = Column(Integer, default=0)
    mime_type = Column(String, default="application/pdf")
    status = Column(String, default=DocumentStatus.READY_FOR_REVIEW.value)
    owner_ref = Column(String, nullable=True)  # For UBO or wallet specific docs
    is_generated = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    reviewer_notes = Column(Text, default="")
    history = Column(JSON, default=list)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    application = relationship("Application", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
