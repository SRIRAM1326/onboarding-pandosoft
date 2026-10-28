from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class CorrectionStatus(str, enum.Enum):
    OPEN = "open"
    RESPONDED = "responded"
    RESOLVED = "resolved"

class CorrectionCategory(str, enum.Enum):
    MISSING_INFORMATION = "missing_information"
    INCORRECT_INFORMATION = "incorrect_information"
    DOCUMENT_QUALITY = "document_quality"
    DOCUMENT_EXPIRED = "document_expired"
    DOCUMENT_MISSING = "document_missing"
    INCONSISTENT_OWNERSHIP = "inconsistent_ownership"
    WALLET_VERIFICATION = "wallet_verification"
    OTHER = "other"

class Correction(Base):
    __tablename__ = "corrections"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    raised_by = Column(Integer, ForeignKey("users.id"))
    category = Column(String, default=CorrectionCategory.MISSING_INFORMATION.value)
    sections = Column(JSON, default=list)
    document_ids = Column(JSON, default=list)
    title = Column(String, default="")
    description = Column(Text, default="")
    instructions = Column(Text, default="")
    status = Column(String, default=CorrectionStatus.OPEN.value)
    due_date = Column(String, nullable=True)
    
    responses = Column(JSON, default=list)
    response = Column(Text, nullable=True)
    responded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    application = relationship("Application", back_populates="corrections")
    raiser = relationship("User", foreign_keys=[raised_by])
    responder = relationship("User", foreign_keys=[responded_by])
