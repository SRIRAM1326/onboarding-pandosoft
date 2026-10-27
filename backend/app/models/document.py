from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class DocumentType(str, enum.Enum):
    BUSINESS_PAN = "business_pan"
    INCORPORATION_CERT = "incorporation_cert"
    GST_CERTIFICATE = "gst_certificate"
    CONSTITUTION_DOCUMENT = "constitution_document"
    UDYAM_REGISTRATION = "udyam_registration"
    SHAREHOLDING_PATTERN = "shareholding_pattern"
    DIRECTORS_LIST = "directors_list"
    BUSINESS_ADDRESS_PROOF = "business_address_proof"
    CANCELLED_CHEQUE = "cancelled_cheque"
    BANK_STATEMENTS = "bank_statements"
    SIGNATORY_PAN = "signatory_pan"
    SIGNATORY_ID_PROOF = "signatory_id_proof"
    SIGNATORY_PHOTO = "signatory_photo"
    SIGNATORY_AUTHORIZATION = "signatory_authorization"
    UBO_PAN = "ubo_pan"
    UBO_ID_PROOF = "ubo_id_proof"
    UBO_ADDRESS_PROOF = "ubo_address_proof"
    UBO_OWNERSHIP_EVIDENCE = "ubo_ownership_evidence"
    INCOME_PROOF = "income_proof"
    FINANCIAL_STATEMENTS = "financial_statements"
    GST_RETURNS = "gst_returns"
    TRADING_EVIDENCE = "trading_evidence"
    WALLET_SCREENSHOT = "wallet_screenshot"
    WALLET_DECLARATION = "wallet_declaration"
    WALLET_TEST_TXN = "wallet_test_txn"
    GENERATED_DOCUMENT = "generated_document"
    SIGNED_STAMPED_DOCUMENT = "signed_stamped_document"

class DocumentStatus(str, enum.Enum):
    NOT_UPLOADED = "not_uploaded"
    UPLOADED = "uploaded"
    PENDING_REVIEW = "pending_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    REPLACEMENT_REQUIRED = "replacement_required"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    document_type = Column(Enum(DocumentType), nullable=False)
    file_name = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    mime_type = Column(String)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.NOT_UPLOADED)
    owner_ref = Column(String)  # For UBO or wallet specific docs
    is_generated = Column(String, default=False)
    version = Column(Integer, default=1)
    reviewer_notes = Column(Text)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    reviewed_at = Column(DateTime(timezone=True))
    
    application = relationship("Application", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
