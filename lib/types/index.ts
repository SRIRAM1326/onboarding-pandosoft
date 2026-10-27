/**
 * Pixelonics Client Onboarding Portal — domain types.
 *
 * These types describe the contract between the UI and the service layer.
 * The mock implementation and a future FastAPI backend must both satisfy them.
 */

/* -------------------------------------------------------------------------- */
/*                                   Users                                    */
/* -------------------------------------------------------------------------- */

export type UserRole =
  | "customer"
  | "pixelonics_ops"
  | "pixelonics_admin"
  | "pandosoft_reviewer"
  | "pandosoft_approver"
  | "compliance_reviewer"
  | "compliance_approver"
  | "administrator";

export type StaffRole = Exclude<UserRole, "customer">;

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  title: string;
  organization: string;
  initials: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                               Shared values                                */
/* -------------------------------------------------------------------------- */

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type SectionKey =
  | "business"
  | "signatory"
  | "ubo"
  | "financial"
  | "wallets"
  | "declarations"
  | "review";

export type SectionStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "action_required";

export interface ActorRef {
  id: string;
  name: string;
  role: UserRole | "system";
}

/* -------------------------------------------------------------------------- */
/*                               Application                                  */
/* -------------------------------------------------------------------------- */

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "action_required"
  | "approved"
  | "rejected";

export type EntityType =
  | "private_limited"
  | "public_limited"
  | "llp"
  | "partnership"
  | "proprietorship"
  | "other";

export interface Director {
  id: string;
  fullName: string;
  designation: string;
  /** DIN / DPIN, where applicable. */
  identificationNumber: string;
}

export interface BusinessProfile {
  legalName: string;
  entityType: EntityType | "";
  entityTypeOther: string;
  pan: string;
  registrationNumber: string;
  gstin: string;
  udyamNumber: string;
  registeredAddress: Address;
  operationalSameAsRegistered: boolean;
  operationalAddress: Address;
  email: string;
  phone: string;
  website: string;
  incorporationDate: string;
}

export type IdentityDocumentType =
  | "aadhaar"
  | "passport"
  | "driving_license"
  | "voter_id";

export interface AuthorizedSignatory {
  fullName: string;
  designation: string;
  email: string;
  mobile: string;
  pan: string;
  dateOfBirth: string;
  idDocumentType: IdentityDocumentType | "";
  idDocumentNumber: string;
  residentialAddress: Address;
  authorizationSignedAndStamped: boolean;
}

export interface BeneficialOwner {
  id: string;
  fullName: string;
  ownershipPercentage: number;
  role: string;
  pan: string;
  idDocumentType: IdentityDocumentType | "";
  idDocumentNumber: string;
  residentialAddress: Address;
  countryOfResidence: string;
  ownershipEvidence: string;
}

export type BankAccountType = "current" | "savings" | "cash_credit" | "overdraft";

export interface BankAccount {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  accountType: BankAccountType | "";
}

export type SourceOfFundsCategory =
  | "business_revenue"
  | "retained_earnings"
  | "equity_capital"
  | "debt_financing"
  | "treasury_reserves"
  | "investment_returns"
  | "other";

export interface FinancialProfile {
  bankAccount: BankAccount;
  sourceOfFundsCategory: SourceOfFundsCategory | "";
  sourceOfFundsExplanation: string;
  expectedVolumeRange: string;
  expectedFrequency: string;
  tradingActivityDescription: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Wallets                                   */
/* -------------------------------------------------------------------------- */

export type BlockchainNetwork =
  | "bitcoin"
  | "ethereum"
  | "polygon"
  | "bnb_smart_chain"
  | "arbitrum"
  | "tron"
  | "solana";

export type WalletType =
  | "hardware"
  | "self_custody_software"
  | "multisig"
  | "institutional_custody"
  | "exchange_hosted";

export type WalletVerificationMethod =
  | "test_transaction"
  | "message_signing"
  | "screenshot_review"
  | "manual_review";

export type WalletVerificationStatus =
  | "not_started"
  | "pending"
  | "verified_demo"
  | "action_required";

export interface Wallet {
  id: string;
  label: string;
  network: BlockchainNetwork | "";
  address: string;
  walletType: WalletType | "";
  ownershipDeclared: boolean;
  verificationMethod: WalletVerificationMethod | "";
  verificationStatus: WalletVerificationStatus;
  verificationNote?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Documents                                  */
/* -------------------------------------------------------------------------- */

export type DocumentStatus =
  | "not_uploaded"
  | "ready_for_review"
  | "under_review"
  | "verified_demo"
  | "rejected_demo"
  | "replacement_required";

export interface DocumentVersion {
  version: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: DocumentStatus;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  /** Key into the document requirement catalog. */
  requirementKey: string;
  section: SectionKey;
  /** Scopes per-entity documents, e.g. a beneficial owner id or wallet id. */
  ownerRef?: string;
  label: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  version: number;
  status: DocumentStatus;
  reviewerNotes: string;
  /**
   * In-memory object URL for previewing the file in this browser tab only.
   * Never persisted. Absent for seeded demo records.
   */
  previewUrl?: string;
  history: DocumentVersion[];
}

/** Alias requested by the specification. `ApplicationDocument` avoids clashing with the DOM `Document`. */
export type KycDocument = ApplicationDocument;

/* -------------------------------------------------------------------------- */
/*                                Declarations                                */
/* -------------------------------------------------------------------------- */

export type DeclarationKey =
  | "board_resolution"
  | "lien_undertaking"
  | "client_onboarding_form"
  | "otc_aml_agreement"
  | "source_of_funds_declaration"
  | "ubo_declaration"
  | "wallet_declaration";

export interface Declaration {
  key: DeclarationKey;
  name: string;
  description: string;
  hasTemplate: boolean;
  requiresSignature: boolean;
  requiresStamp: boolean;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Video KYC                                  */
/* -------------------------------------------------------------------------- */

export type VideoKycStatus =
  | "not_scheduled"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "action_required";

export interface VideoKycSlot {
  id: string;
  startsAt: string;
  durationMinutes: number;
  officerName: string;
  available: boolean;
}

export interface VideoKycSession {
  status: VideoKycStatus;
  slotId?: string;
  scheduledAt?: string;
  durationMinutes: number;
  officerName?: string;
  outcomeNote?: string;
}

/* -------------------------------------------------------------------------- */
/*                        Review, corrections and audit                       */
/* -------------------------------------------------------------------------- */

export type VerificationSubject = "document" | "wallet" | "video_kyc" | "application";

export type VerificationOutcome =
  | "verified_demo"
  | "rejected_demo"
  | "replacement_required"
  | "action_required"
  | "completed_demo"
  | "approved_demo"
  | "note";

export interface VerificationRecord {
  id: string;
  applicationId: string;
  subject: VerificationSubject;
  subjectId?: string;
  subjectLabel: string;
  outcome: VerificationOutcome;
  notes: string;
  recordedBy: ActorRef;
  recordedAt: string;
}

export type CorrectionCategory =
  | "missing_information"
  | "incorrect_information"
  | "document_quality"
  | "document_expired"
  | "inconsistent_ownership"
  | "wallet_verification"
  | "other";

export type CorrectionStatus = "open" | "responded" | "resolved";

export interface CorrectionResponse {
  id: string;
  message: string;
  respondedAt: string;
  respondedBy: ActorRef;
}

export interface CorrectionRequest {
  id: string;
  applicationId: string;
  sections: SectionKey[];
  documentIds: string[];
  category: CorrectionCategory;
  reason: string;
  instructions: string;
  dueDate?: string;
  status: CorrectionStatus;
  createdAt: string;
  createdBy: ActorRef;
  responses: CorrectionResponse[];
}

export type AuditEventType =
  | "application_created"
  | "section_completed"
  | "document_uploaded"
  | "document_replaced"
  | "document_reviewed"
  | "application_submitted"
  | "reviewer_assigned"
  | "correction_requested"
  | "correction_responded"
  | "video_kyc_scheduled"
  | "video_kyc_recorded"
  | "wallet_verification_recorded"
  | "internal_note_added"
  | "decision_recorded"
  | "draft_saved";

export interface AuditEvent {
  id: string;
  applicationId: string;
  applicationReference: string;
  type: AuditEventType;
  label: string;
  description?: string;
  actor: ActorRef;
  timestamp: string;
  /** Every event in this frontend phase is simulated. */
  isDemo: true;
}

export interface InternalNote {
  id: string;
  body: string;
  author: ActorRef;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                Application                                 */
/* -------------------------------------------------------------------------- */

export interface Application {
  id: string;
  reference: string;
  status: ApplicationStatus;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  decidedAt?: string;
  decisionReason?: string;
  assignedReviewerId?: string;
  business: BusinessProfile;
  directors: Director[];
  signatory: AuthorizedSignatory;
  beneficialOwners: BeneficialOwner[];
  financial: FinancialProfile;
  wallets: Wallet[];
  declarations: Declaration[];
  videoKyc: VideoKycSession;
  documents: ApplicationDocument[];
  corrections: CorrectionRequest[];
  verifications: VerificationRecord[];
  auditTrail: AuditEvent[];
  internalNotes: InternalNote[];
}

/** Lightweight projection used by tables and lists. */
export interface ApplicationSummary {
  id: string;
  reference: string;
  businessName: string;
  entityType: EntityType | "";
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  documentProgress: { verified: number; uploaded: number; required: number };
  videoKycStatus: VideoKycStatus;
  walletStatus: WalletVerificationStatus;
  openCorrections: number;
  progressPercent: number;
}

/* -------------------------------------------------------------------------- */
/*                               Notifications                                */
/* -------------------------------------------------------------------------- */

export type NotificationKind = "action_required" | "status" | "document" | "video_kyc" | "info";

export interface PortalNotification {
  id: string;
  userId: string;
  applicationId?: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

/* -------------------------------------------------------------------------- */
/*                             Compliance policy                              */
/* -------------------------------------------------------------------------- */

export interface CompliancePolicy {
  /**
   * Ownership percentage at or above which a person must be declared as a UBO.
   * Must be set according to Pixelonics' approved compliance policy.
   */
  uboThresholdPercent: number;
  maxUploadSizeMb: number;
  bankStatementMonths: number;
  requireSignatoryDateOfBirth: boolean;
  requireTestTransaction: boolean;
  acceptedIdentityDocuments: IdentityDocumentType[];
  defaultWalletVerificationMethod: WalletVerificationMethod;
  reviewSlaDays: number;
}
