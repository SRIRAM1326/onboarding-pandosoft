from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime
from app.models.application import ApplicationStatus, EntityType

class ApplicationBase(BaseModel):
    legal_name: Optional[str] = None
    entity_type: Optional[EntityType] = None
    entity_type_other: Optional[str] = None
    pan: Optional[str] = None
    registration_number: Optional[str] = None
    gstin: Optional[str] = None
    udyam_number: Optional[str] = None
    business_email: Optional[str] = None
    business_phone: Optional[str] = None
    website: Optional[str] = None
    incorporation_date: Optional[str] = None
    registered_address: Optional[Any] = None
    operational_address: Optional[Any] = None
    operational_same_as_registered: Optional[bool] = True
    directors: Optional[Any] = None
    signatory: Optional[Any] = None
    beneficial_owners: Optional[Any] = None
    financial: Optional[Any] = None
    wallets: Optional[Any] = None
    declarations: Optional[Any] = None

class ApplicationCreate(BaseModel):
    customer_id: Optional[int] = None  # For creating on behalf

class ApplicationUpdate(ApplicationBase):
    pass

class ApplicationInDBBase(ApplicationBase):
    id: int
    reference_number: str
    customer_id: int
    status: ApplicationStatus
    assigned_pixelonics_ops_id: Optional[int] = None
    assigned_pandosoft_reviewer_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Application(ApplicationInDBBase):
    pass

class ApplicationReview(BaseModel):
    action: str  # approve_ops, request_corrections, mark_ready_compliance, approve_compliance, reject
    notes: Optional[str] = None
    corrections: Optional[List[Any]] = None
