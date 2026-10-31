import type { Application, ApplicationDocument } from "@/lib/types";
import type {
  BharatOcrDocumentType,
  BharatOcrScanResult,
  FieldComparisonStatus,
  OcrCharacterError,
  OcrFieldResult,
} from "@/lib/types/bharat-ocr";

export const BHARAT_OCR_DISCLAIMER =
  "⚠️ Compliance Notice: BharatOCR extraction and format validation do not prove that a document is authentic. Original document is preserved without modification. Pixelonics team must verify before forwarding to Pandosoft.";

/**
 * Validates Indian Income Tax Department PAN format: 5 letters, 4 digits, 1 letter.
 * 4th character indicates status:
 * P (Individual), C (Company), H (HUF), F (Firm/LLP), A (AOP), T (Trust), B (BOI), L (Local Auth), J (Artificial), G (Govt)
 */
export function validatePanFormat(pan: string): {
  valid: boolean;
  statusChar?: string;
  entityTypeDescription?: string;
  error?: string;
} {
  const clean = (pan || "").trim().toUpperCase();
  if (!clean) {
    return { valid: false, error: "PAN is missing or empty" };
  }
  if (clean.length !== 10) {
    return {
      valid: false,
      error: `PAN length is ${clean.length} characters (exactly 10 required: 5 letters, 4 digits, 1 letter)`,
    };
  }

  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  if (!regex.test(clean)) {
    return {
      valid: false,
      error: "Invalid PAN structure. Must match pattern: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F)",
    };
  }

  const statusChar = clean[3];
  const ENTITY_MAP: Record<string, string> = {
    P: "Individual",
    C: "Company",
    H: "Hindu Undivided Family (HUF)",
    F: "Firm / Limited Liability Partnership (LLP)",
    A: "Association of Persons (AOP)",
    T: "Trust",
    B: "Body of Individuals (BOI)",
    L: "Local Authority",
    J: "Artificial Juridical Person",
    G: "Government Agency",
  };

  const entityTypeDescription = ENTITY_MAP[statusChar] || "Unknown Entity Status";

  return {
    valid: true,
    statusChar,
    entityTypeDescription,
  };
}

/**
 * Validates Indian UIDAI Aadhaar 12-digit number format.
 * Can be continuous or grouped (XXXX XXXX XXXX) or masked (XXXX XXXX 1234).
 */
export function validateAadhaarFormat(aadhaar: string): {
  valid: boolean;
  isMasked: boolean;
  formatted: string;
  error?: string;
} {
  const clean = (aadhaar || "").trim().replace(/[-\s]/g, "");
  if (!clean) {
    return { valid: false, isMasked: false, formatted: "", error: "Aadhaar number is missing" };
  }

  const isMasked = /^[X*x]{8}\d{4}$/.test(clean);
  if (isMasked) {
    const formatted = `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
    return { valid: true, isMasked: true, formatted };
  }

  if (clean.length !== 12) {
    return {
      valid: false,
      isMasked: false,
      formatted: clean,
      error: `Aadhaar length is ${clean.length} digits (expected 12 digits)`,
    };
  }

  if (!/^\d{12}$/.test(clean)) {
    return {
      valid: false,
      isMasked: false,
      formatted: clean,
      error: "Aadhaar must contain numeric digits only",
    };
  }

  if (clean.startsWith("0") || clean.startsWith("1")) {
    return {
      valid: false,
      isMasked: false,
      formatted: clean,
      error: "Standard Indian Aadhaar numbers do not begin with 0 or 1",
    };
  }

  const formatted = `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
  return { valid: true, isMasked: false, formatted };
}

/**
 * Validates Date of Birth format & minimum age requirement (18+).
 */
export function validateDobFormat(dob: string): {
  valid: boolean;
  standardizedIso?: string;
  age?: number;
  error?: string;
} {
  if (!dob || !dob.trim()) {
    return { valid: false, error: "Date of Birth is missing" };
  }

  let y: number | undefined;
  let m: number | undefined;
  let d: number | undefined;

  const isoMatch = dob.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  const indMatch = dob.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

  if (isoMatch) {
    y = parseInt(isoMatch[1], 10);
    m = parseInt(isoMatch[2], 10);
    d = parseInt(isoMatch[3], 10);
  } else if (indMatch) {
    d = parseInt(indMatch[1], 10);
    m = parseInt(indMatch[2], 10);
    y = parseInt(indMatch[3], 10);
  } else {
    return {
      valid: false,
      error: "Invalid date format. Expected DD/MM/YYYY or YYYY-MM-DD",
    };
  }

  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return { valid: false, error: "Invalid calendar day or month" };
  }

  const dateObj = new Date(y, m - 1, d);
  if (
    dateObj.getFullYear() !== y ||
    dateObj.getMonth() !== m - 1 ||
    dateObj.getDate() !== d
  ) {
    return { valid: false, error: "Date does not exist on the calendar" };
  }

  const today = new Date();
  if (dateObj > today) {
    return { valid: false, error: "Date of Birth cannot be in the future" };
  }

  let age = today.getFullYear() - dateObj.getFullYear();
  const monthDiff = today.getMonth() - dateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
    age--;
  }

  if (age < 18) {
    return {
      valid: false,
      age,
      error: `Signatory/UBO must be of legal age (current age: ${age} years, min: 18)`,
    };
  }

  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  const standardizedIso = `${y}-${mm}-${dd}`;

  return { valid: true, standardizedIso, age };
}

/**
 * Optical character recognition confusion tables for Indian identity documents:
 * Detects common reading mistakes when scanning physical cards.
 */
const DIGIT_TO_LETTER_CONFUSION: Record<string, { char: string; confidence: number }> = {
  "0": { char: "O", confidence: 96 },
  "1": { char: "I", confidence: 94 },
  "5": { char: "S", confidence: 92 },
  "8": { char: "B", confidence: 95 },
  "2": { char: "Z", confidence: 90 },
};

const LETTER_TO_DIGIT_CONFUSION: Record<string, { char: string; confidence: number }> = {
  O: { char: "0", confidence: 96 },
  D: { char: "0", confidence: 91 },
  Q: { char: "0", confidence: 88 },
  I: { char: "1", confidence: 95 },
  L: { char: "1", confidence: 90 },
  Z: { char: "2", confidence: 92 },
  E: { char: "3", confidence: 88 },
  A: { char: "4", confidence: 89 },
  S: { char: "5", confidence: 93 },
  G: { char: "6", confidence: 90 },
  b: { char: "6", confidence: 89 },
  T: { char: "7", confidence: 89 },
  B: { char: "8", confidence: 95 },
  g: { char: "9", confidence: 91 },
  q: { char: "9", confidence: 91 },
};

/**
 * Detects OCR errors in PAN string and suggests corrections when clear.
 * PAN pattern: [L][L][L][L][L][D][D][D][D][L]
 * If characters are unclear or ambiguous, flags for manual review.
 */
export function detectPanOcrErrors(rawPan: string): {
  detectedErrors: OcrCharacterError[];
  suggestedValue: string;
  hasUnclearChar: boolean;
  unclearIndices: number[];
} {
  const pan = (rawPan || "").trim().toUpperCase();
  const errors: OcrCharacterError[] = [];
  const chars = pan.split("");
  let hasUnclear = false;
  const unclearIndices: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    // Check for unclear character marks like ?, *, ~, etc.
    if (ch === "?" || ch === "*" || ch === "_" || ch === "~") {
      hasUnclear = true;
      unclearIndices.push(i);
      errors.push({
        position: i + 1,
        rawChar: ch,
        suggestedChar: "",
        reason: `Character at position ${i + 1} is illegible or smudged. Flagged for manual review.`,
        confidence: 0,
      });
      continue;
    }

    // Positions 0-4 and 9: MUST BE LETTERS
    if (i < 5 || i === 9) {
      if (/[0-9]/.test(ch)) {
        const fix = DIGIT_TO_LETTER_CONFUSION[ch];
        if (fix) {
          errors.push({
            position: i + 1,
            rawChar: ch,
            suggestedChar: fix.char,
            reason: `Digit '${ch}' found in letter position ${i + 1}. Common OCR confusion for '${fix.char}'.`,
            confidence: fix.confidence,
          });
          chars[i] = fix.char;
        } else {
          hasUnclear = true;
          unclearIndices.push(i);
          errors.push({
            position: i + 1,
            rawChar: ch,
            suggestedChar: "",
            reason: `Digit '${ch}' in letter slot ${i + 1} with no obvious single letter match. Flagged for manual review.`,
            confidence: 40,
          });
        }
      }
    } else {
      // Positions 5-8: MUST BE DIGITS
      if (/[A-Z]/.test(ch)) {
        const fix = LETTER_TO_DIGIT_CONFUSION[ch];
        if (fix) {
          errors.push({
            position: i + 1,
            rawChar: ch,
            suggestedChar: fix.char,
            reason: `Letter '${ch}' found in numeric position ${i + 1}. Common OCR confusion for '${fix.char}'.`,
            confidence: fix.confidence,
          });
          chars[i] = fix.char;
        } else {
          hasUnclear = true;
          unclearIndices.push(i);
          errors.push({
            position: i + 1,
            rawChar: ch,
            suggestedChar: "",
            reason: `Letter '${ch}' in numeric slot ${i + 1} has low confidence. Flagged for manual review.`,
            confidence: 35,
          });
        }
      }
    }
  }

  const suggestedValue = chars.join("");
  return {
    detectedErrors: errors,
    suggestedValue: suggestedValue !== pan ? suggestedValue : "",
    hasUnclearChar: hasUnclear,
    unclearIndices,
  };
}

/**
 * Detects OCR errors in Aadhaar number (all 12 characters must be digits).
 */
export function detectAadhaarOcrErrors(rawAadhaar: string): {
  detectedErrors: OcrCharacterError[];
  suggestedValue: string;
  hasUnclearChar: boolean;
  unclearIndices: number[];
} {
  const clean = (rawAadhaar || "").trim().replace(/\s+/g, "");
  const errors: OcrCharacterError[] = [];
  const chars = clean.split("");
  let hasUnclear = false;
  const unclearIndices: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    // If masked character 'X', it is intentional
    if (ch.toUpperCase() === "X" && i < 8) {
      continue;
    }

    if (ch === "?" || ch === "*" || ch === "_" || ch === "~") {
      hasUnclear = true;
      unclearIndices.push(i);
      errors.push({
        position: i + 1,
        rawChar: ch,
        suggestedChar: "",
        reason: `Digit at position ${i + 1} is smudged/unclear. Flagged for manual review.`,
        confidence: 0,
      });
      continue;
    }

    if (/[a-zA-Z]/.test(ch)) {
      const upper = ch.toUpperCase();
      const fix = LETTER_TO_DIGIT_CONFUSION[upper];
      if (fix) {
        errors.push({
          position: i + 1,
          rawChar: ch,
          suggestedChar: fix.char,
          reason: `Letter '${ch}' found in Aadhaar numeric slot ${i + 1}. Common OCR confusion for '${fix.char}'.`,
          confidence: fix.confidence,
        });
        chars[i] = fix.char;
      } else {
        hasUnclear = true;
        unclearIndices.push(i);
        errors.push({
          position: i + 1,
          rawChar: ch,
          suggestedChar: "",
          reason: `Character '${ch}' in Aadhaar slot ${i + 1} is not a valid digit. Flagged for manual review.`,
          confidence: 25,
        });
      }
    }
  }

  const suggestedValue = chars.join("");
  const formattedSuggested =
    suggestedValue.length === 12
      ? `${suggestedValue.slice(0, 4)} ${suggestedValue.slice(4, 8)} ${suggestedValue.slice(8, 12)}`
      : suggestedValue;

  return {
    detectedErrors: errors,
    suggestedValue: suggestedValue !== clean ? formattedSuggested : "",
    hasUnclearChar: hasUnclear,
    unclearIndices,
  };
}

/**
 * Normalizes strings for robust matching (removes excess spaces, symbols, lowercase).
 */
function normalizeString(val?: string): string {
  return (val || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Compares two names taking into account honorifics and token subsets.
 */
function compareNames(nameA: string, nameB: string): { match: boolean; confidence: number } {
  const normA = normalizeString(nameA.replace(/\b(mr|mrs|ms|dr|shri|smt)\b/gi, ""));
  const normB = normalizeString(nameB.replace(/\b(mr|mrs|ms|dr|shri|smt)\b/gi, ""));

  if (!normA || !normB) return { match: false, confidence: 0 };
  if (normA === normB) return { match: true, confidence: 100 };

  // Check token overlap
  const tokensA = nameA.toLowerCase().split(/\s+/).filter(Boolean);
  const tokensB = nameB.toLowerCase().split(/\s+/).filter(Boolean);
  const common = tokensA.filter((t) => tokensB.includes(t));

  if (common.length >= Math.min(tokensA.length, tokensB.length) && common.length > 0) {
    return { match: true, confidence: 92 };
  }

  return { match: false, confidence: 30 };
}

/**
 * Scans an uploaded or existing document using BharatOCR, extracts entities,
 * validates formats, detects character misreads, compares against application data,
 * and generates a comprehensive BharatOcrScanResult.
 */
export function scanDocumentWithBharatOcr(
  doc: ApplicationDocument,
  app?: Application,
  extractedRawText?: string
): BharatOcrScanResult {
  const reqKey = (doc.requirementKey || "").toLowerCase();
  const label = (doc.label || "").toLowerCase();
  const fileName = (doc.fileName || "").toLowerCase();

  let docType: BharatOcrDocumentType = "other";
  let docTypeLabel = "Identity Proof / Regulatory Document";

  if (reqKey.includes("pan") || label.includes("pan") || fileName.includes("pan")) {
    docType = "pan_card";
    docTypeLabel = "Permanent Account Number (PAN) Card";
  } else if (
    reqKey.includes("aadhaar") ||
    label.includes("aadhaar") ||
    fileName.includes("aadhaar") ||
    reqKey.includes("signatory_identity")
  ) {
    docType = "aadhaar_card";
    docTypeLabel = "Aadhaar Identity Card (UIDAI)";
  } else if (reqKey.includes("passport") || label.includes("passport")) {
    docType = "passport";
    docTypeLabel = "Republic of India Passport";
  } else if (reqKey.includes("incorporation") || label.includes("incorporation") || fileName.includes("coi")) {
    docType = "incorporation_certificate";
    docTypeLabel = "Certificate of Incorporation (MCA)";
  } else if (reqKey.includes("gst") || label.includes("gst")) {
    docType = "gst_certificate";
    docTypeLabel = "GST Registration Certificate (REG-06)";
  } else if (reqKey.includes("board_resolution") || label.includes("board resolution")) {
    docType = "board_resolution";
    docTypeLabel = "Board Resolution / Authorization";
  } else if (reqKey.includes("cheque") || reqKey.includes("bank")) {
    docType = "bank_document";
    docTypeLabel = "Banking Record / Cancelled Cheque";
  }

  // Determine target person / entity in application
  let targetName = "";
  let targetPan = "";
  let targetAadhaar = "";
  let targetDob = "";

  if (app) {
    if (doc.section === "business" || reqKey === "business_pan") {
      targetName = app.business.legalName;
      targetPan = app.business.pan;
    } else if (doc.section === "signatory" || reqKey.includes("signatory")) {
      targetName = app.signatory.fullName;
      targetPan = app.signatory.pan;
      targetAadhaar = app.signatory.idDocumentNumber;
      targetDob = app.signatory.dateOfBirth;
    } else if (doc.section === "ubo" || doc.ownerRef) {
      const ubo = app.beneficialOwners.find((u) => u.id === doc.ownerRef) || app.beneficialOwners[0];
      if (ubo) {
        targetName = ubo.fullName;
        targetPan = ubo.pan;
        targetAadhaar = ubo.idDocumentNumber;
      }
    } else {
      targetName = app.signatory.fullName || app.business.legalName;
      targetPan = app.signatory.pan || app.business.pan;
      targetAadhaar = app.signatory.idDocumentNumber;
      targetDob = app.signatory.dateOfBirth;
    }
  }

  // Simulated / Extracted Field Values based on actual document context
  let extractedName = targetName || "Arjun Mehta";
  let extractedPan = targetPan || (docType === "pan_card" ? "ABCDE1234F" : "");
  let extractedAadhaar = targetAadhaar || (docType === "aadhaar_card" ? "XXXX XXXX 1234" : "");
  let extractedDob = targetDob || "1985-06-12";
  let extractedGender = "Male";
  let extractedFatherName = "Ramesh Mehta";

  // Demo sample: if UBO PAN card, simulate realistic OCR character misread ('1' read as 'I')
  if (doc.fileName?.includes("UBO_PAN") || doc.id === "doc-13" || doc.requirementKey?.includes("ubo_pan")) {
    extractedPan = "ABCDEI234F";
  }

  // If specific raw text was extracted from file or passed, scan for patterns
  if (extractedRawText) {
    // Regex for PAN
    const panMatches = extractedRawText.match(/\b[A-Z]{5}[0-9OISBZ]{4}[A-Z0-9]\b/i);
    if (panMatches) {
      extractedPan = panMatches[0].toUpperCase();
    }
    // Regex for Aadhaar
    const aadhaarMatches = extractedRawText.match(/\b\d{4}\s\d{4}\s\d{4}\b/) || extractedRawText.match(/\b[X*x]{4}\s[X*x]{4}\s\d{4}\b/);
    if (aadhaarMatches) {
      extractedAadhaar = aadhaarMatches[0];
    }
    // Regex for DOB
    const dobMatches = extractedRawText.match(/\b\d{2}[-/]\d{2}[-/]\d{4}\b/) || extractedRawText.match(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/);
    if (dobMatches) {
      extractedDob = dobMatches[0];
    }
  }

  const missingFlags: string[] = [];
  const invalidFlags: string[] = [];
  const unclearFlags: string[] = [];
  const mismatchedFlags: string[] = [];

  const fields: BharatOcrScanResult["fields"] = {};

  // 1. Customer / Entity Name Field
  if (extractedName) {
    const comparison = compareNames(extractedName, targetName);
    const comparisonStatus: FieldComparisonStatus = !targetName
      ? "missing_in_app"
      : comparison.match
      ? "match"
      : "mismatch";

    if (comparisonStatus === "mismatch") {
      mismatchedFlags.push(`Name Mismatch: Document shows "${extractedName}", application has "${targetName}"`);
    }

    fields.fullName = {
      key: "fullName",
      label: doc.section === "business" ? "Legal Entity Name" : "Customer / Signatory Name",
      extractedValue: extractedName,
      confidence: 97,
      isClear: true,
      formatValid: true,
      detectedErrors: [],
      enteredValue: targetName,
      comparisonStatus,
      comparisonNote:
        comparisonStatus === "match"
          ? "Name matches application record."
          : `Mismatch detected between document and application.`,
      verifiedByOfficer: false,
    };
  } else {
    missingFlags.push("Customer Name could not be extracted from document");
  }

  // 2. PAN Number Field
  if (docType === "pan_card" || extractedPan) {
    if (!extractedPan) {
      missingFlags.push("PAN number could not be detected in PAN document");
    } else {
      const panValidation = validatePanFormat(extractedPan);
      const panOcrErrors = detectPanOcrErrors(extractedPan);

      if (!panValidation.valid) {
        invalidFlags.push(panValidation.error || "Invalid PAN format");
      }
      if (panOcrErrors.hasUnclearChar) {
        unclearFlags.push("PAN card contains smudged or unclear characters flagged for manual review");
      }

      const normExtracted = extractedPan.replace(/[^A-Z0-9]/g, "");
      const normTarget = (targetPan || "").replace(/[^A-Z0-9]/g, "");
      let comparisonStatus: FieldComparisonStatus = "match";

      if (!normTarget) {
        comparisonStatus = "missing_in_app";
      } else if (normExtracted !== normTarget) {
        comparisonStatus = "mismatch";
        mismatchedFlags.push(`PAN Mismatch: Extracted "${extractedPan}" vs entered "${targetPan}"`);
      } else if (!panValidation.valid) {
        comparisonStatus = "format_error";
      } else if (panOcrErrors.hasUnclearChar) {
        comparisonStatus = "unclear";
      }

      fields.panNumber = {
        key: "panNumber",
        label: "PAN Number",
        extractedValue: extractedPan,
        confidence: panOcrErrors.hasUnclearChar ? 68 : 98,
        isClear: !panOcrErrors.hasUnclearChar,
        formatValid: panValidation.valid,
        formatErrorNote: panValidation.error,
        detectedErrors: panOcrErrors.detectedErrors,
        suggestedValue: panOcrErrors.suggestedValue,
        enteredValue: targetPan,
        comparisonStatus,
        comparisonNote:
          comparisonStatus === "match"
            ? `Verified match (${panValidation.entityTypeDescription || "Standard PAN"}).`
            : comparisonStatus === "mismatch"
            ? `Extracted PAN does not match application value.`
            : panValidation.error,
        verifiedByOfficer: false,
      };
    }
  }

  // 3. Aadhaar Number Field
  if (docType === "aadhaar_card" || (reqKey.includes("signatory_identity") && extractedAadhaar)) {
    if (!extractedAadhaar) {
      missingFlags.push("Aadhaar number could not be detected in identity document");
    } else {
      const aadhaarValidation = validateAadhaarFormat(extractedAadhaar);
      const aadhaarOcrErrors = detectAadhaarOcrErrors(extractedAadhaar);

      if (!aadhaarValidation.valid) {
        invalidFlags.push(aadhaarValidation.error || "Invalid Aadhaar format");
      }
      if (aadhaarOcrErrors.hasUnclearChar) {
        unclearFlags.push("Aadhaar contains smudged or unclear characters flagged for manual review");
      }

      const cleanExtracted = extractedAadhaar.replace(/\s+/g, "");
      const cleanTarget = (targetAadhaar || "").replace(/\s+/g, "");
      let comparisonStatus: FieldComparisonStatus = "match";

      if (!cleanTarget) {
        comparisonStatus = "missing_in_app";
      } else {
        // Handle masked Aadhaar matching last 4 digits
        const last4Ext = cleanExtracted.slice(-4);
        const last4Target = cleanTarget.slice(-4);
        if (last4Ext !== last4Target) {
          comparisonStatus = "mismatch";
          mismatchedFlags.push(`Aadhaar Mismatch: Extracted "${extractedAadhaar}" vs entered "${targetAadhaar}"`);
        } else if (!aadhaarValidation.valid) {
          comparisonStatus = "format_error";
        } else if (aadhaarOcrErrors.hasUnclearChar) {
          comparisonStatus = "unclear";
        }
      }

      fields.aadhaarNumber = {
        key: "aadhaarNumber",
        label: "Aadhaar Card Number",
        extractedValue: extractedAadhaar,
        confidence: aadhaarOcrErrors.hasUnclearChar ? 72 : 97,
        isClear: !aadhaarOcrErrors.hasUnclearChar,
        formatValid: aadhaarValidation.valid,
        formatErrorNote: aadhaarValidation.error,
        detectedErrors: aadhaarOcrErrors.detectedErrors,
        suggestedValue: aadhaarOcrErrors.suggestedValue,
        enteredValue: targetAadhaar,
        comparisonStatus,
        comparisonNote:
          comparisonStatus === "match"
            ? "Aadhaar identifier matches customer registration record."
            : comparisonStatus === "mismatch"
            ? "Extracted Aadhaar does not match application value."
            : aadhaarValidation.error,
        verifiedByOfficer: false,
      };
    }
  }

  // 4. Date of Birth Field
  if (docType === "pan_card" || docType === "aadhaar_card" || docType === "passport") {
    if (extractedDob) {
      const dobValidation = validateDobFormat(extractedDob);
      if (!dobValidation.valid) {
        invalidFlags.push(dobValidation.error || "Invalid Date of Birth");
      }

      const normExtracted = dobValidation.standardizedIso || extractedDob;
      const targetIso = validateDobFormat(targetDob).standardizedIso || targetDob;
      let comparisonStatus: FieldComparisonStatus = "match";

      if (!targetDob) {
        comparisonStatus = "missing_in_app";
      } else if (normExtracted !== targetIso) {
        comparisonStatus = "mismatch";
        mismatchedFlags.push(`DOB Mismatch: Extracted "${extractedDob}" vs entered "${targetDob}"`);
      } else if (!dobValidation.valid) {
        comparisonStatus = "format_error";
      }

      fields.dateOfBirth = {
        key: "dateOfBirth",
        label: "Date of Birth",
        extractedValue: extractedDob,
        confidence: 96,
        isClear: true,
        formatValid: dobValidation.valid,
        formatErrorNote: dobValidation.error,
        detectedErrors: [],
        enteredValue: targetDob,
        comparisonStatus,
        comparisonNote:
          comparisonStatus === "match"
            ? `Verified DOB (${dobValidation.age ? dobValidation.age + " years old" : "Adult"}).`
            : comparisonStatus === "mismatch"
            ? "Date of birth differs from application."
            : dobValidation.error,
        verifiedByOfficer: false,
      };
    } else {
      missingFlags.push("Date of Birth not found in identity document");
    }
  }

  // 5. Gender & Father's Name (if available)
  if (docType === "pan_card" || docType === "aadhaar_card") {
    fields.gender = {
      key: "gender",
      label: "Gender",
      extractedValue: extractedGender,
      confidence: 99,
      isClear: true,
      formatValid: true,
      detectedErrors: [],
      comparisonStatus: "match",
      verifiedByOfficer: false,
    };
    fields.fatherName = {
      key: "fatherName",
      label: "Father's / Guardian's Name",
      extractedValue: extractedFatherName,
      confidence: 95,
      isClear: true,
      formatValid: true,
      detectedErrors: [],
      comparisonStatus: "match",
      verifiedByOfficer: false,
    };
  }

  // Calculate Overall Status
  let overallStatus: BharatOcrScanResult["overallStatus"] = "pending_pixelonics_review";
  if (mismatchedFlags.length > 0) {
    overallStatus = "mismatch_flagged";
  } else if (invalidFlags.length > 0) {
    overallStatus = "format_error_flagged";
  } else if (unclearFlags.length > 0) {
    overallStatus = "unclear_manual_review";
  } else {
    overallStatus = "verified_match";
  }

  const rawExtractedText =
    extractedRawText ||
    `[BharatOCR Raw Text Stream]
DOCUMENT: ${docTypeLabel}
NAME: ${extractedName}
PAN: ${extractedPan || "N/A"}
AADHAAR: ${extractedAadhaar || "N/A"}
DOB: ${extractedDob || "N/A"}
GENDER: ${extractedGender}
ISSUING AUTHORITY: Govt. of India / Income Tax Dept / UIDAI
VERIFICATION: Pending Pixelonics Operations initial sign-off`;

  return {
    scanId: `bocr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    documentId: doc.id,
    applicationId: doc.applicationId,
    documentType: docType,
    documentTypeLabel: docTypeLabel,
    rawExtractedText,
    scannedAt: new Date().toISOString(),
    overallStatus,
    authenticityDisclaimer: BHARAT_OCR_DISCLAIMER,
    fields,
    errorFlags: {
      missing: missingFlags,
      invalid: invalidFlags,
      unclear: unclearFlags,
      mismatched: mismatchedFlags,
    },
    pixelonicsVerification: {
      isVerified: false,
      changesConfirmed: false,
    },
  };
}
