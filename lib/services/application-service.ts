import type { Application, ApplicationSummary, SectionKey } from "@/lib/types";
import { mockApplications, mockApplicationSummaries } from "@/lib/mock-data/applications";
import { appConfig } from "@/lib/config/env";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ApplicationService {
  listMine: (customerId: string) => Promise<ApplicationSummary[]>;
  getById: (id: string) => Promise<Application | null>;
  createDraft: (customerId: string) => Promise<Application>;
  saveDraft: (application: Application) => Promise<Application>;
  submit: (id: string) => Promise<Application>;
}

class MockApplicationService implements ApplicationService {
  private apps = [...mockApplications];

  async listMine() {
    await delay(appConfig.mockLatencyMs);
    return mockApplicationSummaries;
  }

  async getById(id: string) {
    await delay(appConfig.mockLatencyMs);
    return this.apps.find((a) => a.id === id) ?? null;
  }

  async createDraft(customerId: string) {
    await delay(appConfig.mockLatencyMs);
    const app: Application = {
      id: `app-draft-${Date.now()}`,
      reference: `PX-DRFT-${String(Date.now()).slice(-6)}`,
      status: "draft",
      customerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      business: {
        legalName: "",
        entityType: "",
        entityTypeOther: "",
        pan: "",
        registrationNumber: "",
        gstin: "",
        udyamNumber: "",
        registeredAddress: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" },
        operationalSameAsRegistered: true,
        operationalAddress: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" },
        email: "",
        phone: "",
        website: "",
        incorporationDate: "",
      },
      directors: [],
      signatory: {
        fullName: "",
        designation: "",
        email: "",
        mobile: "",
        pan: "",
        dateOfBirth: "",
        idDocumentType: "",
        idDocumentNumber: "",
        residentialAddress: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" },
        authorizationSignedAndStamped: false,
      },
      beneficialOwners: [],
      financial: {
        bankAccount: { bankName: "", accountHolderName: "", accountNumber: "", ifsc: "", accountType: "" },
        sourceOfFundsCategory: "",
        sourceOfFundsExplanation: "",
        expectedVolumeRange: "",
        expectedFrequency: "",
        tradingActivityDescription: "",
      },
      wallets: [],
      declarations: [
        {
          key: "board_resolution",
          name: "Board Resolution / Authorization Letter",
          description: "Resolution authorizing onboarding and signatory powers.",
          hasTemplate: true,
          requiresSignature: true,
          requiresStamp: true,
          acknowledged: false,
        },
        {
          key: "lien_undertaking",
          name: "Customer Undertaking for Lien Resolution",
          description: "Undertaking regarding lien resolution process.",
          hasTemplate: true,
          requiresSignature: true,
          requiresStamp: false,
          acknowledged: false,
        },
        {
          key: "client_onboarding_form",
          name: "Client Onboarding Form",
          description: "Completed client onboarding form.",
          hasTemplate: true,
          requiresSignature: true,
          requiresStamp: true,
          acknowledged: false,
        },
        {
          key: "otc_aml_agreement",
          name: "OTC AML Agreement",
          description: "Anti-Money Laundering agreement for OTC transactions.",
          hasTemplate: true,
          requiresSignature: true,
          requiresStamp: true,
          acknowledged: false,
        },
        {
          key: "source_of_funds_declaration",
          name: "Source of Funds Declaration",
          description: "Declaration of source of funds.",
          hasTemplate: true,
          requiresSignature: true,
          requiresStamp: false,
          acknowledged: false,
        },
        {
          key: "ubo_declaration",
          name: "UBO Declaration",
          description: "Ultimate Beneficial Ownership declaration.",
          hasTemplate: true,
          requiresSignature: true,
          requiresStamp: false,
          acknowledged: false,
        },
        {
          key: "wallet_declaration",
          name: "Wallet Declaration",
          description: "Declaration of wallet ownership and control.",
          hasTemplate: true,
          requiresSignature: true,
          requiresStamp: false,
          acknowledged: false,
        },
      ],
      videoKyc: { status: "not_scheduled", durationMinutes: 15 },
      documents: [],
      corrections: [],
      verifications: [],
      auditTrail: [],
      internalNotes: [],
    };
    this.apps.push(app);
    return app;
  }

  async saveDraft(application: Application) {
    await delay(appConfig.mockLatencyMs);
    application.updatedAt = new Date().toISOString();
    const idx = this.apps.findIndex((a) => a.id === application.id);
    if (idx >= 0) this.apps[idx] = { ...application };
    else this.apps.push(application);
    return application;
  }

  async submit(id: string) {
    await delay(appConfig.mockLatencyMs);
    const app = this.apps.find((a) => a.id === id);
    if (app) {
      app.status = "submitted";
      app.submittedAt = new Date().toISOString();
      app.updatedAt = new Date().toISOString();
    }
    return app!;
  }
}

export const applicationService: ApplicationService = new MockApplicationService();
