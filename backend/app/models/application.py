from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACTION_REQUIRED = "action_required"
    PENDING_OPS_REVIEW = "pending_ops_review"
    OPS_REVIEW_IN_PROGRESS = "ops_review_in_progress"
    CORRECTIONS_REQUESTED = "corrections_requested"
    READY_FOR_COMPLIANCE = "ready_for_compliance"
    PENDING_COMPLIANCE_REVIEW = "pending_compliance_review"
    COMPLIANCE_REVIEW_IN_PROGRESS = "compliance_review_in_progress"
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVATED = "activated"

class EntityType(str, enum.Enum):
    PRIVATE_LIMITED = "private_limited"
    PUBLIC_LIMITED = "public_limited"
    LLP = "llp"
    PARTNERSHIP = "partnership"
    PROPRIETORSHIP = "proprietorship"
    OTHER = "other"

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default=ApplicationStatus.DRAFT.value)
    
    # Business Info
    legal_name = Column(String, default="")
    entity_type = Column(String, default="private_limited")
    entity_type_other = Column(String, default="")
    pan = Column(String, default="")
    registration_number = Column(String, default="")
    gstin = Column(String, default="")
    udyam_number = Column(String, default="")
    business_email = Column(String, default="")
    business_phone = Column(String, default="")
    website = Column(String, default="")
    incorporation_date = Column(String, default="")
    
    # Addresses
    registered_address = Column(JSON, default=dict)
    operational_address = Column(JSON, default=dict)
    operational_same_as_registered = Column(Boolean, default=True)
    
    # Structured sections
    directors = Column(JSON, default=list)
    signatory = Column(JSON, default=dict)
    beneficial_owners = Column(JSON, default=list)
    financial = Column(JSON, default=dict)
    wallets = Column(JSON, default=list)
    declarations = Column(JSON, default=list)
    video_kyc = Column(JSON, default=dict)
    verifications = Column(JSON, default=list)
    internal_notes = Column(JSON, default=list)
    ops_checklist = Column(JSON, default=dict)
    
    # Review
    assigned_pixelonics_ops_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_pandosoft_reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ops_review_notes = Column(Text, nullable=True)
    compliance_review_notes = Column(Text, nullable=True)
    decision_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    ops_reviewed_at = Column(DateTime(timezone=True), nullable=True)
    compliance_reviewed_at = Column(DateTime(timezone=True), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    pixelonics_ops = relationship("User", foreign_keys=[assigned_pixelonics_ops_id])
    pandosoft_reviewer = relationship("User", foreign_keys=[assigned_pandosoft_reviewer_id])
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    corrections = relationship("Correction", back_populates="application", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="application", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="application", cascade="all, delete-orphan")
