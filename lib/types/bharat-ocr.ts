export type BharatOcrDocumentType =
  | "pan_card"
  | "aadhaar_card"
  | "passport"
  | "voter_id"
  | "driving_license"
  | "incorporation_certificate"
  | "gst_certificate"
  | "board_resolution"
  | "bank_document"
  | "other";

export type FieldComparisonStatus =
  | "match"
  | "mismatch"
  | "missing_in_doc"
  | "missing_in_app"
  | "unclear"
  | "format_error";

export interface OcrCharacterError {
  position: number;
  rawChar: string;
  suggestedChar: string;
  reason: string;
  confidence: number;
}

export interface OcrFieldResult {
  key: string;
  label: string;
  extractedValue: string;
  confidence: number; // 0 - 100
  isClear: boolean; // false if character is smudged/unclear -> flagged for manual review
  formatValid: boolean;
  formatErrorNote?: string;
  detectedErrors: OcrCharacterError[];
  suggestedValue?: string;
  enteredValue?: string;
  comparisonStatus: FieldComparisonStatus;
  comparisonNote?: string;
  verifiedByOfficer: boolean;
  officerConfirmedValue?: string;
  officerNotes?: string;
}

export interface BharatOcrScanResult {
  scanId: string;
  documentId: string;
  applicationId: string;
  documentType: BharatOcrDocumentType;
  documentTypeLabel: string;
  rawExtractedText: string;
  scannedAt: string;
  overallStatus:
    | "verified_match"
    | "mismatch_flagged"
    | "format_error_flagged"
    | "unclear_manual_review"
    | "pending_pixelonics_review";
  authenticityDisclaimer: string;
  fields: {
    fullName?: OcrFieldResult;
    panNumber?: OcrFieldResult;
    aadhaarNumber?: OcrFieldResult;
    dateOfBirth?: OcrFieldResult;
    gender?: OcrFieldResult;
    fatherName?: OcrFieldResult;
    address?: OcrFieldResult;
    documentNumber?: OcrFieldResult;
    cin?: OcrFieldResult;
    gstin?: OcrFieldResult;
  };
  errorFlags: {
    missing: string[];
    invalid: string[];
    unclear: string[];
    mismatched: string[];
  };
  pixelonicsVerification: {
    isVerified: boolean;
    verifiedBy?: string;
    verifiedAt?: string;
    reviewNotes?: string;
    changesConfirmed: boolean; // "Do not automatically change PAN or Aadhaar numbers without confirmation."
  };
}
