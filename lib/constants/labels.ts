import type {
  ApplicationStatus,
  AuditEventType,
  BankAccountType,
  BlockchainNetwork,
  CorrectionCategory,
  CorrectionStatus,
  DocumentStatus,
  EntityType,
  IdentityDocumentType,
  SectionKey,
  SectionStatus,
  SourceOfFundsCategory,
  UserRole,
  VerificationOutcome,
  VideoKycStatus,
  WalletType,
  WalletVerificationMethod,
  WalletVerificationStatus,
} from "@/lib/types";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  action_required: "Action Required",
  approved: "Approved",
  rejected: "Rejected",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  compliance_reviewer: "Compliance Reviewer",
  compliance_approver: "Compliance Approver",
  administrator: "Administrator",
};

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  private_limited: "Private Limited",
  public_limited: "Public Limited",
  llp: "LLP",
  partnership: "Partnership",
  proprietorship: "Proprietorship",
  other: "Other",
};

export const ID_DOCUMENT_LABELS: Record<IdentityDocumentType, string> = {
  aadhaar: "Aadhaar Card",
  passport: "Passport",
  driving_license: "Driving License",
  voter_id: "Voter ID",
};

export const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  current: "Current Account",
  savings: "Savings Account",
  cash_credit: "Cash Credit",
  overdraft: "Overdraft",
};

export const SOURCE_OF_FUNDS_LABELS: Record<SourceOfFundsCategory, string> = {
  business_revenue: "Business operating revenue",
  retained_earnings: "Retained earnings / reserves",
  equity_capital: "Equity capital from shareholders",
  debt_financing: "Debt financing",
  treasury_reserves: "Corporate treasury reserves",
  investment_returns: "Investment returns",
  other: "Other",
};

export const VOLUME_RANGES = [
  "Up to ₹25 lakh per month",
  "₹25 lakh – ₹1 crore per month",
  "₹1 crore – ₹5 crore per month",
  "₹5 crore – ₹25 crore per month",
  "Above ₹25 crore per month",
] as const;

export const TRANSACTION_FREQUENCIES = [
  "Occasional (less than monthly)",
  "Monthly",
  "Weekly",
  "Several times a week",
  "Daily",
] as const;

export const NETWORK_LABELS: Record<BlockchainNetwork, string> = {
  bitcoin: "Bitcoin",
  ethereum: "Ethereum (ERC-20)",
  polygon: "Polygon PoS",
  bnb_smart_chain: "BNB Smart Chain (BEP-20)",
  arbitrum: "Arbitrum One",
  tron: "Tron (TRC-20)",
  solana: "Solana",
};

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  hardware: "Hardware wallet",
  self_custody_software: "Self-custody software wallet",
  multisig: "Multi-signature wallet",
  institutional_custody: "Institutional custody",
  exchange_hosted: "Exchange-hosted wallet",
};

export const WALLET_METHOD_LABELS: Record<WalletVerificationMethod, string> = {
  test_transaction: "Test transaction (micro-deposit)",
  message_signing: "Signed message",
  screenshot_review: "Wallet dashboard screenshot review",
  manual_review: "Manual review by compliance",
};

export const WALLET_STATUS_LABELS: Record<WalletVerificationStatus, string> = {
  not_started: "Not Started",
  pending: "Pending",
  verified_demo: "Verified (Demo)",
  action_required: "Action Required",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  not_uploaded: "Not Uploaded",
  ready_for_review: "Ready for Review",
  under_review: "Under Review",
  verified_demo: "Verified (Demo)",
  rejected_demo: "Rejected (Demo)",
  replacement_required: "Replacement Required",
};

export const VIDEO_KYC_STATUS_LABELS: Record<VideoKycStatus, string> = {
  not_scheduled: "Not Scheduled",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed (Demo)",
  action_required: "Action Required",
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  business: "Business Information",
  signatory: "Authorized Signatory",
  ubo: "Beneficial Ownership",
  financial: "Financial Information",
  wallets: "Crypto Wallets",
  declarations: "Declarations & Video KYC",
  review: "Review & Submit",
};

export const SECTION_STATUS_LABELS: Record<SectionStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
  action_required: "Action Required",
};

export const CORRECTION_CATEGORY_LABELS: Record<CorrectionCategory, string> = {
  missing_information: "Missing information",
  incorrect_information: "Incorrect information",
  document_quality: "Document quality / legibility",
  document_expired: "Expired or outdated document",
  inconsistent_ownership: "Inconsistent ownership details",
  wallet_verification: "Wallet verification",
  other: "Other",
};

export const CORRECTION_STATUS_LABELS: Record<CorrectionStatus, string> = {
  open: "Open",
  responded: "Customer Responded",
  resolved: "Resolved",
};

export const VERIFICATION_OUTCOME_LABELS: Record<VerificationOutcome, string> = {
  verified_demo: "Verified (Demo)",
  rejected_demo: "Rejected (Demo)",
  replacement_required: "Replacement Required",
  action_required: "Action Required",
  completed_demo: "Completed (Demo)",
  approved_demo: "Approved (Demo)",
  note: "Note",
};

export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  application_created: "Application Created",
  section_completed: "Section Completed",
  document_uploaded: "Document Uploaded",
  document_replaced: "Document Replaced",
  document_reviewed: "Document Reviewed",
  application_submitted: "Application Submitted",
  reviewer_assigned: "Reviewer Assigned",
  correction_requested: "Correction Requested",
  correction_responded: "Correction Response Submitted",
  video_kyc_scheduled: "Video KYC Scheduled",
  video_kyc_recorded: "Video KYC Outcome Recorded",
  wallet_verification_recorded: "Wallet Verification Recorded",
  internal_note_added: "Internal Note Added",
  decision_recorded: "Application Decision Recorded",
  draft_saved: "Draft Saved",
};

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const COUNTRIES = [
  "India",
  "Singapore",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Germany",
  "Japan",
  "Australia",
  "Canada",
  "Other",
] as const;
