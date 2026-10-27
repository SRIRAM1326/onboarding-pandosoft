from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    entity_type = Column(String)
    entity_id = Column(String)
    description = Column(Text)
    ip_address = Column(String)
    user_agent = Column(String)
    meta_data = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    application = relationship("Application", back_populates="audit_logs")
    user = relationship("User")
