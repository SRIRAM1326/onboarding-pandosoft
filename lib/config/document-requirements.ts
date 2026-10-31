import type {
  Application,
  ApplicationDocument,
  CompliancePolicy,
  EntityType,
  SectionKey,
} from "@/lib/types";

export type RequirementLevel = "required" | "conditional" | "optional";
export type RequirementScope = "application" | "beneficial_owner" | "wallet" | "bank_account";

export interface DocumentRequirement {
  key: string;
  label: string;
  description: string;
  section: SectionKey;
  scope: RequirementScope;
  level: RequirementLevel;
  /** Shown next to conditional requirements, e.g. "Required when a GSTIN is provided". */
  conditionLabel?: string;
  /** Evaluates whether the requirement is applicable to this entity/application type. */
  isApplicable?: (app: Application) => boolean;
  /** Evaluates whether the requirement applies to a given application. */
  isRequired: (app: Application, policy: CompliancePolicy, ownerRef?: string) => boolean;
}

const COMPANY_TYPES: EntityType[] = ["private_limited", "public_limited"];

function isCompany(app: Application): boolean {
  return COMPANY_TYPES.includes(app.business.entityType as EntityType);
}

function isPartnershipOrLlp(app: Application): boolean {
  return app.business.entityType === "partnership" || app.business.entityType === "llp";
}

function isNotProprietorship(app: Application): boolean {
  return app.business.entityType !== "proprietorship";
}

export function constitutionDocumentLabel(entityType: EntityType | ""): string {
  switch (entityType) {
    case "llp":
      return "LLP Agreement";
    case "partnership":
      return "Partnership Deed";
    default:
      return "Partnership Deed / LLP Agreement";
  }
}

export const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  /* ------------------------------ Business ------------------------------ */
  {
    key: "business_pan",
    label: "Business PAN Card",
    description: "Clear copy of the entity's PAN card.",
    section: "business",
    scope: "application",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "business_incorporation",
    label: "Certificate of Incorporation / Registration",
    description: "Issued by the MCA / Registrar of Firms or the relevant authority.",
    section: "business",
    scope: "application",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "business_gst",
    label: "GST Certificate",
    description: "GST registration certificate (Form REG-06).",
    section: "business",
    scope: "application",
    level: "conditional",
    conditionLabel: "Required when a GSTIN is provided",
    isRequired: (app) => app.business.gstin.trim().length > 0,
  },
  {
    key: "business_moa",
    label: "Memorandum of Association (MOA)",
    description: "Clear copy of the signed / certified Memorandum of Association (MOA).",
    section: "business",
    scope: "application",
    level: "conditional",
    conditionLabel: "Required for Private & Public Limited companies",
    isApplicable: (app) => !app.business.entityType || isCompany(app),
    isRequired: (app) => isCompany(app) || !app.business.entityType,
  },
  {
    key: "business_aoa",
    label: "Articles of Association (AOA)",
    description: "Clear copy of the signed / certified Articles of Association (AOA).",
    section: "business",
    scope: "application",
    level: "conditional",
    conditionLabel: "Required for Private & Public Limited companies",
    isApplicable: (app) => !app.business.entityType || isCompany(app),
    isRequired: (app) => isCompany(app) || !app.business.entityType,
  },
  {
    key: "business_constitution",
    label: "Partnership Deed / LLP Agreement",
    description: "Constitutional document applicable to LLPs and Partnerships.",
    section: "business",
    scope: "application",
    level: "conditional",
    conditionLabel: "Required for LLP / Partnership entities",
    isApplicable: (app) => !app.business.entityType || isPartnershipOrLlp(app),
    isRequired: (app) => isPartnershipOrLlp(app),
  },
  {
    key: "business_udyam",
    label: "Udyam Registration Certificate",
    description: "MSME Udyam registration certificate.",
    section: "business",
    scope: "application",
    level: "conditional",
    conditionLabel: "Required when a Udyam number is provided",
    isRequired: (app) => app.business.udyamNumber.trim().length > 0,
  },
  {
    key: "business_shareholding",
    label: "Latest Shareholding Pattern",
    description: "Signed shareholding / capital contribution pattern on letterhead.",
    section: "business",
    scope: "application",
    level: "conditional",
    conditionLabel: "Not applicable to proprietorships",
    isRequired: (app) => isNotProprietorship(app),
  },
  {
    key: "business_directors_list",
    label: "List of Directors / Partners",
    description: "Current list of directors or designated partners, signed and stamped.",
    section: "business",
    scope: "application",
    level: "conditional",
    conditionLabel: "Not applicable to proprietorships",
    isRequired: (app) => isNotProprietorship(app),
  },
  {
    key: "business_address_proof",
    label: "Business Address Proof",
    description: "Utility bill, lease agreement or property tax receipt not older than 3 months.",
    section: "business",
    scope: "application",
    level: "required",
    isRequired: () => true,
  },

  /* ------------------------------ Signatory ----------------------------- */
  {
    key: "signatory_pan",
    label: "Signatory PAN Card",
    description: "PAN card of the authorized signatory.",
    section: "signatory",
    scope: "application",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "signatory_identity",
    label: "Identity Proof (Aadhaar / Passport / Driving License)",
    description: "Accepted identity document matching the details entered. Mask the first 8 digits of Aadhaar.",
    section: "signatory",
    scope: "application",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "signatory_photo",
    label: "Passport-size Photograph",
    description: "Recent colour photograph against a plain background (JPEG or PNG preferred).",
    section: "signatory",
    scope: "application",
    level: "required",
    isRequired: () => true,
  },

  /* -------------------------------- UBO -------------------------------- */
  {
    key: "ubo_pan",
    label: "UBO PAN Card",
    description: "PAN card of the beneficial owner.",
    section: "ubo",
    scope: "beneficial_owner",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "ubo_identity",
    label: "Accepted Identity Proof",
    description: "Passport, Aadhaar (masked) or driving license.",
    section: "ubo",
    scope: "beneficial_owner",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "ubo_address",
    label: "Address Proof",
    description: "Utility bill or bank statement not older than 3 months.",
    section: "ubo",
    scope: "beneficial_owner",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "ubo_ownership",
    label: "Shareholding / Ownership Evidence",
    description: "Share certificate, register of members extract or ownership chart.",
    section: "ubo",
    scope: "beneficial_owner",
    level: "required",
    isRequired: () => true,
  },

  /* ----------------------------- Financial ----------------------------- */
  {
    key: "fin_cancelled_cheque",
    label: "Cancelled Cheque",
    description: "Cancelled cheque of the account entered above, showing the entity name.",
    section: "financial",
    scope: "bank_account",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "fin_bank_statements",
    label: "Bank Statements",
    description: "Statements for the period required by the compliance policy.",
    section: "financial",
    scope: "bank_account",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "fin_income_proof",
    label: "Business Income Proof",
    description: "ITR acknowledgement or CA-certified income statement.",
    section: "financial",
    scope: "bank_account",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "fin_financial_statements",
    label: "Financial Statements",
    description: "Latest audited balance sheet and profit & loss statement.",
    section: "financial",
    scope: "bank_account",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "fin_gst_returns",
    label: "GST Returns",
    description: "GSTR-3B returns for the most recent quarter.",
    section: "financial",
    scope: "bank_account",
    level: "conditional",
    conditionLabel: "Required when a GSTIN is provided",
    isRequired: (app) => app.business.gstin.trim().length > 0,
  },
  {
    key: "fin_trading_evidence",
    label: "Supporting Trading Activity Evidence",
    description: "Optional: invoices, contracts or exchange statements supporting the declared activity.",
    section: "financial",
    scope: "bank_account",
    level: "optional",
    isRequired: () => false,
  },

  /* ------------------------------- Wallets ------------------------------ */
  {
    key: "wallet_screenshot",
    label: "Wallet Dashboard Screenshot",
    description: "Screenshot showing the wallet address and label. Never include seed phrases or private keys.",
    section: "wallets",
    scope: "wallet",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "wallet_declaration",
    label: "Wallet Ownership Declaration",
    description: "Signed declaration that the entity owns and controls this wallet.",
    section: "wallets",
    scope: "wallet",
    level: "required",
    isRequired: () => true,
  },
  {
    key: "wallet_test_txn",
    label: "Test Transaction Evidence",
    description: "Transaction hash or explorer screenshot of the test transaction requested by compliance.",
    section: "wallets",
    scope: "wallet",
    level: "conditional",
    conditionLabel: "Required when a test transaction is requested",
    isRequired: (app, policy, ownerRef) => {
      if (policy.requireTestTransaction) return true;
      const wallet = app.wallets.find((w) => w.id === ownerRef);
      return wallet?.verificationMethod === "test_transaction";
    },
  },
];

export const REQUIREMENTS_BY_KEY: Record<string, DocumentRequirement> = Object.fromEntries(
  DOCUMENT_REQUIREMENTS.map((r) => [r.key, r]),
);

export function requirementsForSection(section: SectionKey): DocumentRequirement[] {
  return DOCUMENT_REQUIREMENTS.filter((r) => r.section === section);
}

export function resolveRequirementLabel(
  requirement: DocumentRequirement,
  app: Pick<Application, "business">,
  policy: CompliancePolicy,
): string {
  if (requirement.key === "business_constitution") {
    return constitutionDocumentLabel(app.business.entityType);
  }
  if (requirement.key === "fin_bank_statements") {
    return `Bank Statements (last ${policy.bankStatementMonths} months)`;
  }
  if (requirement.key === "business_incorporation" && COMPANY_TYPES.includes(app.business.entityType as EntityType)) {
    return "Certificate of Incorporation";
  }
  return requirement.label;
}

export interface DocumentSlot {
  requirement: DocumentRequirement;
  label: string;
  ownerRef?: string;
  ownerLabel?: string;
  required: boolean;
  document?: ApplicationDocument;
}

/** Expands the catalog into concrete slots for an application (per owner / per wallet). */
export function getDocumentSlots(app: Application, policy: CompliancePolicy, section?: SectionKey): DocumentSlot[] {
  const slots: DocumentSlot[] = [];
  const requirements = section ? requirementsForSection(section) : DOCUMENT_REQUIREMENTS;

  for (const requirement of requirements) {
    if (requirement.isApplicable && !requirement.isApplicable(app)) {
      continue;
    }
    const label = resolveRequirementLabel(requirement, app, policy);
    if (requirement.scope === "application") {
      slots.push({
        requirement,
        label,
        required: requirement.isRequired(app, policy),
        document: findDocument(app.documents, requirement.key),
      });
    } else if (requirement.scope === "beneficial_owner") {
      for (const owner of app.beneficialOwners) {
        slots.push({
          requirement,
          label,
          ownerRef: owner.id,
          ownerLabel: owner.fullName || "Unnamed owner",
          required: requirement.isRequired(app, policy, owner.id),
          document: findDocument(app.documents, requirement.key, owner.id),
        });
      }
    } else if (requirement.scope === "wallet") {
      for (const wallet of app.wallets) {
        slots.push({
          requirement,
          label,
          ownerRef: wallet.id,
          ownerLabel: wallet.label || "Unnamed wallet",
          required: requirement.isRequired(app, policy, wallet.id),
          document: findDocument(app.documents, requirement.key, wallet.id),
        });
      }
    } else if (requirement.scope === "bank_account") {
      const accounts =
        app.financial.bankAccounts && app.financial.bankAccounts.length > 0
          ? app.financial.bankAccounts
          : [app.financial.bankAccount];
      for (const acc of accounts) {
        const accId = acc.id || "bank-1";
        const accLabel = `${acc.bankName || "Bank"} (${acc.accountNumber ? `A/C ...${acc.accountNumber.slice(-4)}` : "Account"})`;
        slots.push({
          requirement,
          label,
          ownerRef: accId,
          ownerLabel: accLabel,
          required: requirement.isRequired(app, policy, accId),
          document:
            findDocument(app.documents, requirement.key, accId) ||
            findDocument(app.documents, requirement.key),
        });
      }
    }
  }
  return slots;
}

export function findDocument(
  documents: ApplicationDocument[],
  requirementKey: string,
  ownerRef?: string,
): ApplicationDocument | undefined {
  return documents.find(
    (d) => d.requirementKey === requirementKey && (d.ownerRef ?? undefined) === (ownerRef ?? undefined),
  );
}

/** A slot counts as satisfied when a file is present and not flagged for replacement or rejected. */
export function isSlotSatisfied(slot: DocumentSlot): boolean {
  const status = slot.document?.status;
  return (
    status === "ready_for_review" || status === "under_review" || status === "verified_demo"
  );
}

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/bmp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/zip",
] as const;

export const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".svg",
  ".gif",
  ".bmp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".zip",
] as const;
