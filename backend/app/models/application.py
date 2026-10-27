from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
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
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT)
    
    # Business Info
    legal_name = Column(String)
    entity_type = Column(Enum(EntityType))
    entity_type_other = Column(String)
    pan = Column(String)
    registration_number = Column(String)
    gstin = Column(String)
    udyam_number = Column(String)
    business_email = Column(String)
    business_phone = Column(String)
    website = Column(String)
    incorporation_date = Column(String)
    
    # Addresses
    registered_address = Column(JSON)
    operational_address = Column(JSON)
    operational_same_as_registered = Column(Boolean, default=True)
    
    # Data
    directors = Column(JSON)
    signatory = Column(JSON)
    beneficial_owners = Column(JSON)
    financial = Column(JSON)
    wallets = Column(JSON)
    declarations = Column(JSON)
    
    # Review
    assigned_pixelonics_ops_id = Column(Integer, ForeignKey("users.id"))
    assigned_pandosoft_reviewer_id = Column(Integer, ForeignKey("users.id"))
    ops_review_notes = Column(Text)
    compliance_review_notes = Column(Text)
    decision_reason = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True))
    ops_reviewed_at = Column(DateTime(timezone=True))
    compliance_reviewed_at = Column(DateTime(timezone=True))
    decided_at = Column(DateTime(timezone=True))
    activated_at = Column(DateTime(timezone=True))
    
    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    pixelonics_ops = relationship("User", foreign_keys=[assigned_pixelonics_ops_id])
    pandosoft_reviewer = relationship("User", foreign_keys=[assigned_pandosoft_reviewer_id])
    documents = relationship("Document", back_populates="application")
    corrections = relationship("Correction", back_populates="application")
    audit_logs = relationship("AuditLog", back_populates="application")
    notifications = relationship("Notification", back_populates="application")
