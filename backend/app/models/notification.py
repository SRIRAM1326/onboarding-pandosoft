from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class NotificationType(str, enum.Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    ACTION_REQUIRED = "action_required"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    application_id = Column(Integer, ForeignKey("applications.id"))
    title = Column(String, nullable=False)
    message = Column(Text)
    type = Column(Enum(NotificationType), default=NotificationType.INFO)
    is_read = Column(Boolean, default=False)
    link = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True))
    
    user = relationship("User")
    application = relationship("Application", back_populates="notifications")
