from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
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
    DOCUMENT_MISSING = "document_missing"
    INCONSISTENT_OWNERSHIP = "inconsistent_ownership"
    OTHER = "other"

class Correction(Base):
    __tablename__ = "corrections"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    raised_by = Column(Integer, ForeignKey("users.id"))
    category = Column(Enum(CorrectionCategory))
    title = Column(String)
    description = Column(Text)
    instructions = Column(Text)
    status = Column(Enum(CorrectionStatus), default=CorrectionStatus.OPEN)
    due_date = Column(DateTime(timezone=True))
    
    response = Column(Text)
    responded_by = Column(Integer, ForeignKey("users.id"))
    responded_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    application = relationship("Application", back_populates="corrections")
    raiser = relationship("User", foreign_keys=[raised_by])
    responder = relationship("User", foreign_keys=[responded_by])
