from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    PIXELONICS_OPS = "pixelonics_ops"
    PIXELONICS_ADMIN = "pixelonics_admin"
    PANDOSOFT_REVIEWER = "pandosoft_reviewer"
    PANDOSOFT_APPROVER = "pandosoft_approver"
    COMPLIANCE_REVIEWER = "compliance_reviewer"
    COMPLIANCE_APPROVER = "compliance_approver"
    ADMINISTRATOR = "administrator"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER)
    organization = Column(String)
    title = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
