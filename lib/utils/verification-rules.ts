import type {
  Application,
  ApplicationDocument,
  CompliancePolicy,
  Wallet,
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
  walletsVerified: boolean;
  unverifiedWallets: Wallet[];
  isForwardedToPandosoft: boolean;
  blockingReasons: string[];
}

export interface PixelonicsForwardingReport {
  canForward: boolean;
  totalRequired: number;
  totalUploaded: number;
  totalVerified: number;
  allDocumentsVerified: boolean;
  videoKycRecorded: boolean;
  videoKycVerified: boolean;
  walletsVerified: boolean;
  unverifiedWallets: Wallet[];
  missingRequiredSlots: DocumentSlot[];
  unverifiedRequiredDocs: ApplicationDocument[];
  unverifiedAdditionalDocs: ApplicationDocument[];
  hasOpenCorrections: boolean;
  openCorrectionsCount: number;
  blockingReasons: string[];
}

/**
 * Validates whether the Pixelonics team has completed the initial verification process
 * (all documents, details, wallets, and Video KYC verified) and can forward to Pandosoft.
 */
export function validateApplicationForPixelonicsForwarding(
  app: Application,
  policy: CompliancePolicy = defaultCompliancePolicy
): PixelonicsForwardingReport {
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

  const unverifiedWallets = (app.wallets || []).filter(
    (w) => w.verificationStatus !== "verified_demo" && (w.verificationStatus as string) !== "verified"
  );
  const walletsVerified = unverifiedWallets.length === 0;

  const openCorrections = (app.corrections || []).filter((c) => c.status === "open");
  const hasOpenCorrections = openCorrections.length > 0;

  const blockingReasons: string[] = [];

  if (missingRequiredSlots.length > 0) {
    blockingReasons.push(
      `${missingRequiredSlots.length} required document(s) have not been uploaded by the customer.`
    );
  }

  if (unverifiedRequiredDocs.length > 0) {
    blockingReasons.push(
      `${unverifiedRequiredDocs.length} required document(s) are awaiting Pixelonics verification.`
    );
  }

  if (unverifiedAdditionalDocs.length > 0) {
    blockingReasons.push(
      `${unverifiedAdditionalDocs.length} additional document(s) must be verified by Pixelonics.`
    );
  }

  if (!videoKycRecorded) {
    blockingReasons.push(
      "Customer has not uploaded or recorded a Video KYC declaration."
    );
  } else if (!videoKycVerified) {
    blockingReasons.push(
      "Customer's KYC video must be reviewed and verified by Pixelonics."
    );
  }

  if (unverifiedWallets.length > 0) {
    blockingReasons.push(
      `${unverifiedWallets.length} customer crypto wallet(s) must be verified by Pixelonics.`
    );
  }

  if (hasOpenCorrections) {
    blockingReasons.push(
      `${openCorrections.length} correction request(s) are still open with the customer.`
    );
  }

  const canForward =
    allDocumentsVerified && videoKycVerified && walletsVerified && !hasOpenCorrections;

  return {
    canForward,
    totalRequired: requiredSlots.length,
    totalUploaded: (app.documents || []).length,
    totalVerified,
    allDocumentsVerified,
    videoKycRecorded,
    videoKycVerified,
    walletsVerified,
    unverifiedWallets,
    missingRequiredSlots,
    unverifiedRequiredDocs,
    unverifiedAdditionalDocs,
    hasOpenCorrections,
    openCorrectionsCount: openCorrections.length,
    blockingReasons,
  };
}

/**
 * Validates whether an onboarding application meets all regulatory compliance requirements
 * for Pandosoft team's final review and approval:
 * 1. Pixelonics team has completed initial document verification and forwarded the application.
 * 2. All required documents verified by Pixelonics.
 * 3. Video KYC reviewed and verified by Pixelonics.
 * 4. Wallets verified by Pixelonics.
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

  const unverifiedWallets = (app.wallets || []).filter(
    (w) => w.verificationStatus !== "verified_demo" && (w.verificationStatus as string) !== "verified"
  );
  const walletsVerified = unverifiedWallets.length === 0;

  const isForwardedToPandosoft =
    app.status === "ready_for_compliance" ||
    Boolean(app.forwardedToPandosoftAt) ||
    Boolean(app.opsReviewedAt) ||
    app.status === "approved" ||
    app.status === "rejected";

  const blockingReasons: string[] = [];

  if (!isForwardedToPandosoft) {
    blockingReasons.push(
      "Initial verification is in progress by Pixelonics. The application must be verified and forwarded by Pixelonics before Pandosoft final approval."
    );
  }

  if (missingRequiredSlots.length > 0) {
    blockingReasons.push(
      `${missingRequiredSlots.length} required document(s) have not been uploaded by the customer.`
    );
  }

  if (unverifiedRequiredDocs.length > 0) {
    blockingReasons.push(
      `${unverifiedRequiredDocs.length} required document(s) must be verified by Pixelonics first.`
    );
  }

  if (unverifiedAdditionalDocs.length > 0) {
    blockingReasons.push(
      `${unverifiedAdditionalDocs.length} additional uploaded document(s) must be verified by Pixelonics.`
    );
  }

  if (!videoKycRecorded) {
    blockingReasons.push(
      "Customer has not uploaded or recorded a Video KYC declaration."
    );
  } else if (!videoKycVerified) {
    blockingReasons.push(
      "Customer's KYC video must be verified by Pixelonics."
    );
  }

  if (!walletsVerified) {
    blockingReasons.push(
      "Customer's crypto wallet(s) must be verified by Pixelonics."
    );
  }

  const canApprove =
    isForwardedToPandosoft && allDocumentsVerified && videoKycVerified && walletsVerified;
  const canReject = true; // Pandosoft can always reject an application after final review

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
    walletsVerified,
    unverifiedWallets,
    isForwardedToPandosoft,
    blockingReasons,
  };
}
