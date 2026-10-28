from typing import Optional, List, Any, Dict
from pydantic import BaseModel
from datetime import datetime

class ApplicationBase(BaseModel):
    legal_name: Optional[str] = None
    entity_type: Optional[str] = None
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
    video_kyc: Optional[Any] = None
    verifications: Optional[Any] = None
    internal_notes: Optional[Any] = None
    ops_checklist: Optional[Any] = None

class ApplicationCreate(BaseModel):
    customer_id: Optional[int] = None
    legal_name: Optional[str] = ""
    contact_name: Optional[str] = ""
    business_email: Optional[str] = ""
    business_phone: Optional[str] = ""

class ApplicationUpdate(ApplicationBase):
    status: Optional[str] = None
    assigned_pixelonics_ops_id: Optional[int] = None
    assigned_pandosoft_reviewer_id: Optional[int] = None
    ops_review_notes: Optional[str] = None
    compliance_review_notes: Optional[str] = None
    decision_reason: Optional[str] = None

class ApplicationInDBBase(ApplicationBase):
    id: int
    reference_number: str
    customer_id: int
    status: str
    assigned_pixelonics_ops_id: Optional[int] = None
    assigned_pandosoft_reviewer_id: Optional[int] = None
    ops_review_notes: Optional[str] = None
    compliance_review_notes: Optional[str] = None
    decision_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    decided_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Application(ApplicationInDBBase):
    pass

class ApplicationReview(BaseModel):
    action: str  # approve_ops, request_corrections, mark_ready_compliance, approve_compliance, reject, add_note, verify_wallet, record_video_kyc
    notes: Optional[str] = None
    subject_id: Optional[str] = None
    outcome: Optional[str] = None
    corrections: Optional[List[Dict[str, Any]]] = None
