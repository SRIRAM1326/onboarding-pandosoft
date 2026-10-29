import type {
  Application,
  ApplicationDocument,
  CompliancePolicy,
} from "@/lib/types";
import {
  getDocumentSlots,
  DocumentSlot,
} from "@/lib/config/document-requirements";
import { defaultCompliancePolicy } from "@/lib/mock-data/applications";

export interface VerificationChecklistReport {
  canApprove: boolean;
  canReject: boolean;
  totalRequired: number;
  totalUploaded: number;
  totalVerified: number;
  missingRequiredSlots: DocumentSlot[];
  unverifiedRequiredDocs: ApplicationDocument[];
  unverifiedAdditionalDocs: ApplicationDocument[];
  allDocumentsVerified: boolean;
  videoKycRecorded: boolean;
  videoKycVerified: boolean;
  videoKycStatus: Application["videoKyc"]["status"];
  blockingReasons: string[];
}

/**
 * Validates whether an onboarding application meets all regulatory compliance requirements:
 * 1. Officer has verified all uploaded documents.
 * 2. Officer has verified all required documents (no required documents missing or unverified).
 * 3. Officer has reviewed and verified the customer's KYC video.
 */
export function validateApplicationForApproval(
  app: Application,
  policy: CompliancePolicy = defaultCompliancePolicy
): VerificationChecklistReport {
  const slots = getDocumentSlots(app, policy);
  const requiredSlots = slots.filter((s) => s.required);

  const missingRequiredSlots: DocumentSlot[] = [];
  const unverifiedRequiredDocs: ApplicationDocument[] = [];

  for (const slot of requiredSlots) {
    if (!slot.document) {
      missingRequiredSlots.push(slot);
    } else if (slot.document.status !== "verified_demo") {
      unverifiedRequiredDocs.push(slot.document);
    }
  }

  // Any other uploaded documents that are not yet verified
  const unverifiedAdditionalDocs = (app.documents || []).filter(
    (d) => d.status !== "verified_demo" && !unverifiedRequiredDocs.some((req) => req.id === d.id)
  );

  const allDocumentsVerified =
    missingRequiredSlots.length === 0 &&
    unverifiedRequiredDocs.length === 0 &&
    unverifiedAdditionalDocs.length === 0;

  const totalVerified = (app.documents || []).filter(
    (d) => d.status === "verified_demo"
  ).length;

  const videoKycRecorded = Boolean(
    app.videoKyc.videoUrl ||
      app.videoKyc.fileName ||
      app.videoKyc.status === "completed" ||
      app.videoKyc.status === "in_progress"
  );
  const videoKycVerified = app.videoKyc.status === "completed";

  const blockingReasons: string[] = [];

  if (missingRequiredSlots.length > 0) {
    blockingReasons.push(
      `${missingRequiredSlots.length} required document(s) have not been uploaded by the customer.`
    );
  }

  if (unverifiedRequiredDocs.length > 0) {
    blockingReasons.push(
      `${unverifiedRequiredDocs.length} required document(s) are awaiting officer verification.`
    );
  }

  if (unverifiedAdditionalDocs.length > 0) {
    blockingReasons.push(
      `${unverifiedAdditionalDocs.length} additional uploaded document(s) must be reviewed and verified.`
    );
  }

  if (!videoKycRecorded) {
    blockingReasons.push(
      "Customer has not uploaded or recorded a Video KYC declaration."
    );
  } else if (!videoKycVerified) {
    blockingReasons.push(
      "Customer's KYC video has not been reviewed and verified by an officer."
    );
  }

  const canApprove = allDocumentsVerified && videoKycVerified;
  const canReject = true;

  return {
    canApprove,
    canReject,
    totalRequired: requiredSlots.length,
    totalUploaded: (app.documents || []).length,
    totalVerified,
    missingRequiredSlots,
    unverifiedRequiredDocs,
    unverifiedAdditionalDocs,
    allDocumentsVerified,
    videoKycRecorded,
    videoKycVerified,
    videoKycStatus: app.videoKyc.status,
    blockingReasons,
  };
}
