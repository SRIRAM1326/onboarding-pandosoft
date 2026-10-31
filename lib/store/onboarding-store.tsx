"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type {
  Application,
  ApplicationDocument,
  ApplicationStatus,
  ApplicationSummary,
  CompliancePolicy,
  CorrectionCategory,
  CorrectionRequest,
  DocumentStatus,
  PortalNotification,
  SectionKey,
  User,
  WalletVerificationStatus,
  VideoKycStatus,
  Director,
  IndividualSelfie,
  IndividualVideoKyc,
  BankAccount,
} from "@/lib/types";
import {
  mockApplications,
  computeApplicationSummary,
  defaultCompliancePolicy,
  videoKycSlots,
} from "@/lib/mock-data/applications";
import { mockUsers, currentMockUser } from "@/lib/mock-data/users";
import { mockNotifications } from "@/lib/mock-data/notifications";
import { appConfig } from "@/lib/config/env";
import { saveVideoToIndexedDb } from "@/lib/utils/video-db";
import { saveDocumentBlob } from "@/lib/utils/document-db";
import { validateApplicationForApproval } from "@/lib/utils/verification-rules";
import { scanDocumentWithBharatOcr } from "@/lib/utils/bharat-ocr-engine";
import { toast } from "sonner";

const STORAGE_KEY = "pixelonics_onboarding_state_v1";

let idCounter = 0;
function uniqueId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).substring(2, 7)}`;
}

interface PersistedState {
  currentUser: User;
  users: User[];
  applications: Application[];
  notifications: PortalNotification[];
  policy: CompliancePolicy;
  opsChecklists: Record<string, Record<string, boolean>>;
}

interface OnboardingContextValue extends PersistedState {
  hydrated: boolean;
  summaries: ApplicationSummary[];
  videoSlots: typeof videoKycSlots;
  loginAsEmail: (email: string, password?: string) => Promise<User>;
  loginByRole: (role: User["role"]) => User;
  registerUser: (data: {
    name: string;
    email: string;
    password?: string;
    organization?: string;
    phone?: string;
  }) => Promise<User>;
  updateCurrentUser: (patch: Partial<User>) => void;
  getApplication: (id: string) => Application;
  createApplication: (params?: {
    legalName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    createdByActor?: User;
  }) => Application;
  updateApplication: (
    id: string,
    updater: (app: Application) => Application,
    auditLabel?: string
  ) => Application;
  submitApplication: (id: string) => Application;
  uploadDocument: (
    applicationId: string,
    file: File,
    meta: { requirementKey: string; section: SectionKey; label: string; ownerRef?: string }
  ) => ApplicationDocument;
  reviewDocument: (
    applicationId: string,
    documentId: string,
    status: DocumentStatus,
    notes?: string
  ) => void;
  requestCorrection: (
    applicationId: string,
    payload: {
      category: CorrectionCategory;
      sections: SectionKey[];
      reason: string;
      instructions: string;
      dueDate?: string;
    }
  ) => CorrectionRequest;
  respondToCorrection: (applicationId: string, correctionId: string, message: string) => void;
  resolveCorrection: (applicationId: string, correctionId: string) => void;
  recordDecision: (applicationId: string, status: ApplicationStatus, reason?: string) => void;
  assignReviewer: (applicationId: string, reviewerId: string) => void;
  scheduleVideoKyc: (applicationId: string, slotId: string) => void;
  recordVideoKycOutcome: (applicationId: string, status: VideoKycStatus, note?: string) => void;
  uploadVideoKyc: (
    applicationId: string,
    file: File,
    spokenScript: string
  ) => Promise<{ videoUrl: string; document: ApplicationDocument }>;
  recordWalletVerification: (
    applicationId: string,
    walletId: string,
    status: WalletVerificationStatus,
    note?: string
  ) => void;
  forwardToPandosoft: (applicationId: string, notes?: string) => void;
  addInternalNote: (applicationId: string, body: string) => void;
  toggleOpsChecklist: (applicationId: string, key: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updatePolicy: (patch: Partial<CompliancePolicy>) => void;
  verifyBharatOcrDetails: (
    applicationId: string,
    documentId: string,
    options: {
      confirmChanges?: boolean;
      verifiedFields?: Record<string, string>;
      notes?: string;
    }
  ) => void;
  rescanDocumentWithBharatOcr: (
    applicationId: string,
    documentId: string,
    rawTextOverride?: string
  ) => void;
  saveDirectorSelfie: (applicationId: string, directorId: string, selfie: IndividualSelfie) => void;
  saveDirectorVideoKyc: (applicationId: string, directorId: string, videoKyc: IndividualVideoKyc) => void;
  saveUboSelfie: (applicationId: string, uboId: string, selfie: IndividualSelfie) => void;
  saveUboVideoKyc: (applicationId: string, uboId: string, videoKyc: IndividualVideoKyc) => void;
  addDirector: (applicationId: string, director: Omit<Director, "id">) => void;
  removeDirector: (applicationId: string, directorId: string) => void;
  addBankAccount: (applicationId: string, account: Omit<BankAccount, "id">) => void;
  removeBankAccount: (applicationId: string, accountId: string) => void;
  setPrimaryBankAccount: (applicationId: string, accountId: string) => void;
}

const initialState: PersistedState = {
  currentUser: currentMockUser,
  users: mockUsers,
  applications: mockApplications.map((app) => ({
    ...app,
    documents: (app.documents || []).map((d) => ({
      ...d,
      bharatOcr: d.bharatOcr || scanDocumentWithBharatOcr(d, app),
    })),
  })),
  notifications: mockNotifications,
  policy: defaultCompliancePolicy,
  opsChecklists: {
    "app-demo-001": {
      completeness: true,
      documentsUploaded: true,
      signedAndStamped: false,
      readyForCompliance: false,
    },
  },
};

/**
 * Strip large base64 data URLs and transient blob URLs before saving to localStorage
 * so JSON.stringify stays tiny (<25KB) and never blocks the main thread.
 */
function sanitizeStateForStorage(state: PersistedState): PersistedState {
  return {
    ...state,
    applications: state.applications.map((app) => ({
      ...app,
      videoKyc: {
        ...app.videoKyc,
        videoUrl:
          app.videoKyc.videoUrl &&
          (app.videoKyc.videoUrl.startsWith("blob:") ||
            app.videoKyc.videoUrl.startsWith("data:") ||
            app.videoKyc.videoUrl.length > 500)
            ? undefined
            : app.videoKyc.videoUrl,
      },
      documents: (app.documents || []).map((doc) => ({
        ...doc,
        previewUrl:
          doc.previewUrl &&
          (doc.previewUrl.startsWith("blob:") ||
            doc.previewUrl.startsWith("data:") ||
            doc.previewUrl.length > 500)
            ? undefined
            : doc.previewUrl,
      })),
    })),
  };
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function loadPersistedState(): PersistedState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    if (raw.length > 50_000 || raw.includes("data:video") || raw.includes("data:image")) {
      localStorage.removeItem(STORAGE_KEY);
      return initialState;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (parsed.applications && parsed.applications.length > 0) {
      const merged: PersistedState = {
        ...initialState,
        ...parsed,
        applications: parsed.applications.map((a) => {
          const hasOldDeclarations = a.declarations?.some(
            (d) => d.key === "client_onboarding_form" || d.key === "otc_aml_agreement"
          );
          const decls =
            !a.declarations || a.declarations.length === 0 || hasOldDeclarations
              ? mockApplications[0].declarations
              : a.declarations;
          const seenAuditIds = new Set<string>();
          const auditTrail = (a.auditTrail || []).map((ev, idx) => {
            let evId = ev.id || uniqueId("audit");
            if (seenAuditIds.has(evId)) {
              evId = `${evId}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
            }
            seenAuditIds.add(evId);
            return { ...ev, id: evId };
          });
          let docs = a.documents || [];
          if (
            a.id === "app-demo-001" &&
            (!a.documents ||
              a.documents.length === 0 ||
              a.documents.some((d) => d.requirementKey === "business_constitution"))
          ) {
            docs = mockApplications[0].documents;
          } else if (docs.some((d) => d.requirementKey === "business_constitution")) {
            docs = docs.map((d) =>
              d.requirementKey === "business_constitution"
                ? { ...d, requirementKey: "business_moa", label: "Memorandum of Association (MOA)" }
                : d
            );
          }
          const directors =
            a.id === "app-demo-001" &&
            (!a.directors || a.directors.length === 0 || !a.directors[0]?.selfie)
              ? mockApplications[0].directors
              : a.directors || [];
          const beneficialOwners =
            a.id === "app-demo-001" &&
            (!a.beneficialOwners ||
              a.beneficialOwners.length === 0 ||
              !a.beneficialOwners[0]?.selfie)
              ? mockApplications[0].beneficialOwners
              : a.beneficialOwners || [];

          // Bank Accounts migration / normalization
          const baseBank = a.financial?.bankAccount || mockApplications[0].financial.bankAccount;
          const bankAccounts =
            a.financial?.bankAccounts && a.financial.bankAccounts.length > 0
              ? a.financial.bankAccounts.map((b, idx) => ({ ...b, id: b.id || `bank-${idx + 1}` }))
              : [{ ...baseBank, id: baseBank.id || "bank-1", isPrimary: true }];
          const financial = {
            ...a.financial,
            bankAccount: bankAccounts.find((b) => b.isPrimary) || bankAccounts[0] || baseBank,
            bankAccounts,
          };

          // Attach un-owned financial docs to bank-1 if needed
          docs = docs.map((d) => {
            if (d.section === "financial" && !d.ownerRef && bankAccounts[0]?.id) {
              return { ...d, ownerRef: bankAccounts[0].id };
            }
            return d;
          });

          return {
            ...a,
            declarations: decls,
            documents: docs,
            directors,
            beneficialOwners,
            financial,
            auditTrail,
          };
        }),
      };
      return sanitizeStateForStorage(merged);
    }
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return initialState;
}

const emptySubscribe = () => () => {};

function detectDocumentMimeType(fileName: string, mimeType?: string): string {
  if (mimeType && mimeType.trim() && mimeType !== "application/octet-stream") {
    return mimeType;
  }
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "application/pdf";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    case "gif": return "image/gif";
    case "bmp": return "image/bmp";
    case "doc": return "application/msword";
    case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls": return "application/vnd.ms-excel";
    case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "csv": return "text/csv";
    case "txt": return "text/plain";
    case "json": return "application/json";
    case "xml": return "application/xml";
    case "zip": return "application/zip";
    default: return mimeType || "application/octet-stream";
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadPersistedState);
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const stateRef = useRef<PersistedState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const objectUrlsRef = useRef<string[]>([]);

  const trackObjectUrl = useCallback((url: string) => {
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      objectUrlsRef.current = [];
    };
  }, []);

  // 3. Debounced (500ms) & sanitized localStorage persistence
  useEffect(() => {
    if (!hydrated) return;
    const timeoutId = setTimeout(() => {
      try {
        const sanitized = sanitizeStateForStorage(stateRef.current);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      } catch {
        // ignore quota errors
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [state, hydrated]);

  const getApplication = useCallback(
    (id: string): Application => {
      const apps = state.applications.length > 0 ? state.applications : stateRef.current.applications;
      return apps.find((a) => a.id === id) ?? stateRef.current.applications.find((a) => a.id === id) ?? apps[0] ?? mockApplications[0];
    },
    [state.applications]
  );

  const loginAsEmail = useCallback(async (email: string, password?: string): Promise<User> => {
    try {
      const res = await fetch(`${appConfig.apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: password || "Password123!" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem("pixelonics_jwt", data.access_token);
        }
      }
    } catch {
      // Offline / local mode fallback
    }
    const cur = stateRef.current;
    const found =
      cur.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ??
      cur.currentUser;
    setState((prev) => ({ ...prev, currentUser: found }));
    return found;
  }, []);

  const loginByRole = useCallback((role: User["role"]): User => {
    const cur = stateRef.current;
    const found = cur.users.find((u) => u.role === role) ?? cur.users[0];
    setState((prev) => ({ ...prev, currentUser: found }));
    return found;
  }, []);

  const registerUser = useCallback(
    async (data: {
      name: string;
      email: string;
      password?: string;
      organization?: string;
      phone?: string;
    }): Promise<User> => {
      const initials = data.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone || "+91 98765 00000",
        role: "customer",
        title: "Authorized Signatory",
        organization: data.organization || "Corporate Applicant",
        initials: initials || "CA",
        createdAt: new Date().toISOString(),
      };
      try {
        await fetch(`${appConfig.apiBaseUrl}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            full_name: data.name,
            password: data.password || "Password123!",
            organization: data.organization,
            phone: data.phone,
          }),
        });
      } catch {
        // Offline / local fallback
      }
      setState((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        currentUser: newUser,
      }));
      return newUser;
    },
    []
  );

  const updateCurrentUser = useCallback((patch: Partial<User>) => {
    setState((prev) => {
      const updated = { ...prev.currentUser, ...patch };
      return {
        ...prev,
        currentUser: updated,
        users: prev.users.map((u) => (u.id === updated.id ? updated : u)),
      };
    });
  }, []);

  const createApplication = useCallback(
    (params?: {
      legalName?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      createdByActor?: User;
    }): Application => {
      const now = new Date().toISOString();
      const currentUser = stateRef.current.currentUser;
      const actor = params?.createdByActor ?? currentUser;
      const suffix = String(Date.now()).slice(-4);
      const emptyAddr = {
        line1: "",
        line2: "",
        city: "",
        state: "Maharashtra",
        postalCode: "",
        country: "India",
      };
      const newApp: Application = {
        id: `app-${Date.now()}`,
        reference: `PX-2026-${suffix}`,
        status: "draft",
        customerId: currentUser.id,
        createdAt: now,
        updatedAt: now,
        assignedReviewerId: "usr-rev-1",
        business: {
          legalName: params?.legalName ?? "",
          entityType: "private_limited",
          entityTypeOther: "",
          pan: "",
          registrationNumber: "",
          gstin: "",
          udyamNumber: "",
          registeredAddress: { ...emptyAddr },
          operationalSameAsRegistered: true,
          operationalAddress: { ...emptyAddr },
          email: params?.email ?? "",
          phone: params?.phone ?? "",
          website: "",
          incorporationDate: "",
        },
        directors: [],
        signatory: {
          fullName: params?.contactName ?? "",
          designation: "Managing Director",
          email: params?.email ?? "",
          mobile: params?.phone ?? "",
          pan: "",
          dateOfBirth: "",
          idDocumentType: "aadhaar",
          idDocumentNumber: "",
          residentialAddress: { ...emptyAddr },
          authorizationSignedAndStamped: false,
        },
        beneficialOwners: [],
        financial: {
          bankAccount: {
            bankName: "",
            accountHolderName: params?.legalName ?? "",
            accountNumber: "",
            ifsc: "",
            accountType: "current",
          },
          sourceOfFundsCategory: "business_revenue",
          sourceOfFundsExplanation: "",
          expectedVolumeRange: "Γé╣1 crore ΓÇô Γé╣5 crore per month",
          expectedFrequency: "Weekly",
          tradingActivityDescription: "",
        },
        wallets: [],
        declarations: mockApplications[0].declarations.map((d) => ({
          ...d,
          acknowledged: false,
          acknowledgedAt: undefined,
        })),
        videoKyc: { status: "not_scheduled", durationMinutes: 15 },
        documents: [],
        corrections: [],
        verifications: [],
        auditTrail: [
          {
            id: uniqueId("audit"),
            applicationId: `app-${Date.now()}`,
            applicationReference: `PX-2026-${suffix}`,
            type: "application_created",
            label: "Application Created",
            description: params?.legalName
              ? `Application created for ${params.legalName} by ${actor.name}.`
              : `Onboarding application created by ${actor.name}.`,
            actor: { id: actor.id, name: actor.name, role: actor.role },
            timestamp: now,
            isDemo: true,
          },
        ],
        internalNotes: [],
      };

      setState((prev) => {
        const nextState: PersistedState = {
          ...prev,
          applications: [newApp, ...prev.applications],
          notifications: [
            {
              id: uniqueId("notif"),
              userId: prev.currentUser.id,
              applicationId: newApp.id,
              kind: "info",
              title: `Application ${newApp.reference} Created`,
              body: `Draft application ${newApp.reference} is ready for completion.`,
              createdAt: now,
              read: false,
              href: `/portal/applications/${newApp.id}/step/1`,
            },
            ...prev.notifications,
          ],
        };
        stateRef.current = nextState;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeStateForStorage(nextState)));
        } catch {
          // ignore
        }
        return nextState;
      });
      return newApp;
    },
    []
  );

  const updateApplication = useCallback(
    (id: string, updater: (app: Application) => Application, auditLabel?: string): Application => {
      let updatedApp: Application =
        stateRef.current.applications.find((a) => a.id === id) ?? mockApplications[0];
      setState((prev) => {
        const now = new Date().toISOString();
        const apps = prev.applications.map((app) => {
          if (app.id !== id) return app;
          const next = updater({ ...app });
          next.updatedAt = now;
          if (auditLabel) {
            next.auditTrail = [
              {
                id: uniqueId("audit"),
                applicationId: app.id,
                applicationReference: app.reference,
                type: "draft_saved",
                label: auditLabel,
                description: `${auditLabel} by ${prev.currentUser.name}`,
                actor: {
                  id: prev.currentUser.id,
                  name: prev.currentUser.name,
                  role: prev.currentUser.role,
                },
                timestamp: now,
                isDemo: true,
              },
              ...next.auditTrail,
            ];
          }
          updatedApp = next;
          return next;
        });
        const nextState = { ...prev, applications: apps };
        stateRef.current = nextState;
        return nextState;
      });
      return updatedApp;
    },
    []
  );

  const submitApplication = useCallback((id: string): Application => {
    let submitted: Application =
      stateRef.current.applications.find((a) => a.id === id) ?? mockApplications[0];
    setState((prev) => {
      const now = new Date().toISOString();
      const apps = prev.applications.map((app) => {
        if (app.id !== id) return app;
        const next: Application = {
          ...app,
          status: "submitted",
          submittedAt: now,
          updatedAt: now,
          auditTrail: [
            {
              id: uniqueId("audit"),
              applicationId: app.id,
              applicationReference: app.reference,
              type: "application_submitted",
              label: "Application Submitted",
              description:
                "Customer completed all sections and submitted the application for review.",
              actor: {
                id: prev.currentUser.id,
                name: prev.currentUser.name,
                role: prev.currentUser.role,
              },
              timestamp: now,
              isDemo: true,
            },
            ...app.auditTrail,
          ],
        };
        submitted = next;
        return next;
      });
      const nextState: PersistedState = {
        ...prev,
        applications: apps,
        notifications: [
          {
            id: uniqueId("notif"),
            userId: prev.currentUser.id,
            applicationId: id,
            kind: "status",
            title: "Application Submitted for Review",
            body: `Your application ${submitted.reference} has been submitted to Pixelonics Operations.`,
            createdAt: now,
            read: false,
            href: `/portal/applications/${id}`,
          },
          ...prev.notifications,
        ],
      };
      stateRef.current = nextState;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeStateForStorage(nextState)));
      } catch {
        // ignore
      }
      return nextState;
    });
    return submitted;
  }, []);

  const uploadDocument = useCallback(
    (
      applicationId: string,
      file: File,
      meta: { requirementKey: string; section: SectionKey; label: string; ownerRef?: string }
    ): ApplicationDocument => {
      const now = new Date().toISOString();
      let previewUrl: string | undefined;
      try {
        previewUrl = trackObjectUrl(URL.createObjectURL(file));
      } catch {
        previewUrl = undefined;
      }

      const resolvedMime = detectDocumentMimeType(file.name, file.type);
      const targetApp = stateRef.current.applications.find((a) => a.id === applicationId);

      const tempDoc: ApplicationDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        applicationId,
        requirementKey: meta.requirementKey,
        section: meta.section,
        ownerRef: meta.ownerRef,
        label: meta.label,
        fileName: file.name,
        fileSize: file.size,
        mimeType: resolvedMime,
        uploadedAt: now,
        version: 1,
        status: "ready_for_review",
        reviewerNotes: "",
        previewUrl,
        history: [],
      };
      const bocrScan = scanDocumentWithBharatOcr(tempDoc, targetApp);

      const newDoc: ApplicationDocument = {
        ...tempDoc,
        bharatOcr: bocrScan,
        history: [
          {
            version: 1,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: now,
            status: "ready_for_review",
          },
        ],
      };

      setState((prev) => {
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          const existingIdx = app.documents.findIndex(
            (d) =>
              d.requirementKey === meta.requirementKey &&
              (d.ownerRef ?? undefined) === (meta.ownerRef ?? undefined)
          );
          let nextDocs: ApplicationDocument[];
          if (existingIdx >= 0) {
            const prevDoc = app.documents[existingIdx];
            const nextVer = prevDoc.version + 1;
            const replaced: ApplicationDocument = {
              ...newDoc,
              id: prevDoc.id,
              version: nextVer,
              history: [
                ...prevDoc.history,
                {
                  version: nextVer,
                  fileName: file.name,
                  fileSize: file.size,
                  uploadedAt: now,
                  status: "ready_for_review",
                },
              ],
            };
            nextDocs = app.documents.map((d, idx) => (idx === existingIdx ? replaced : d));
          } else {
            nextDocs = [...app.documents, newDoc];
          }
          return {
            ...app,
            updatedAt: now,
            documents: nextDocs,
            auditTrail: [
              {
                id: uniqueId("audit"),
                applicationId: app.id,
                applicationReference: app.reference,
                type: (existingIdx >= 0 ? "document_replaced" : "document_uploaded") as
                  | "document_replaced"
                  | "document_uploaded",
                label: existingIdx >= 0 ? "Document Replaced" : "Document Uploaded",
                description: `${meta.label} (${file.name}) uploaded.`,
                actor: {
                  id: prev.currentUser.id,
                  name: prev.currentUser.name,
                  role: prev.currentUser.role,
                },
                timestamp: now,
                isDemo: true as const,
              },
              ...app.auditTrail,
            ],
          };
        });
        return { ...prev, applications: apps };
      });

      // Identify target doc id whether new or replacement
      const existingApp = stateRef.current.applications.find((a) => a.id === applicationId);
      const existingDoc = existingApp?.documents.find(
        (d) =>
          d.requirementKey === meta.requirementKey &&
          (d.ownerRef ?? undefined) === (meta.ownerRef ?? undefined)
      );
      const targetDocId = existingDoc ? existingDoc.id : newDoc.id;

      // 1. Persist raw file Blob to client IndexedDB immediately
      saveDocumentBlob(newDoc.id, file, file.name, resolvedMime, applicationId).catch(() => {});
      if (existingDoc) {
        saveDocumentBlob(targetDocId, file, file.name, resolvedMime, applicationId).catch(() => {});
      }

      // 2. Asynchronously persist uploaded document to server storage & SQLite database
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("applicationId", applicationId);
        form.append("requirementKey", meta.requirementKey);
        form.append("section", meta.section);
        form.append("label", meta.label);
        if (meta.ownerRef) form.append("ownerRef", meta.ownerRef);

        fetch("/api/documents", {
          method: "POST",
          body: form,
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.fileUrl) {
              setState((prev) => ({
                ...prev,
                applications: prev.applications.map((app) =>
                  app.id !== applicationId
                    ? app
                    : {
                        ...app,
                        documents: app.documents.map((d) =>
                          d.id === targetDocId || d.id === newDoc.id
                            ? {
                                ...d,
                                previewUrl: data.fileUrl,
                                fileName: data.fileName || d.fileName,
                                fileSize: data.fileSize || d.fileSize,
                                mimeType: data.mimeType || d.mimeType,
                              }
                            : d
                        ),
                      }
                ),
              }));
            }
          })
          .catch(() => {});
      } catch {
        // ignore background upload errors
      }

      return newDoc;
    },
    [trackObjectUrl]
  );

  const reviewDocument = useCallback(
    (applicationId: string, documentId: string, status: DocumentStatus, notes?: string) => {
      setState((prev) => {
        const now = new Date().toISOString();
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          const targetDoc = app.documents.find((d) => d.id === documentId);
          return {
            ...app,
            updatedAt: now,
            documents: app.documents.map((d) =>
              d.id === documentId
                ? {
                    ...d,
                    status,
                    reviewerNotes:
                      notes !== undefined
                        ? notes
                        : status === "verified_demo"
                        ? "Verified by Pixelonics Operations"
                        : d.reviewerNotes,
                  }
                : d
            ),
            auditTrail: [
              {
                id: uniqueId("audit"),
                applicationId: app.id,
                applicationReference: app.reference,
                type: "document_reviewed" as const,
                label: "Document Reviewed",
                description: `${targetDoc?.label ?? "Document"} marked as ${status.replace(/_/g, " ")}${notes ? `: ${notes}` : ""}`,
                actor: {
                  id: prev.currentUser.id,
                  name: prev.currentUser.name,
                  role: prev.currentUser.role,
                },
                timestamp: now,
                isDemo: true as const,
              },
              ...app.auditTrail,
            ],
          };
        });
        return { ...prev, applications: apps };
      });
    },
    []
  );

  const verifyBharatOcrDetails = useCallback(
    (
      applicationId: string,
      documentId: string,
      options: {
        confirmChanges?: boolean;
        verifiedFields?: Record<string, string>;
        notes?: string;
      }
    ) => {
      setState((prev) => {
        const now = new Date().toISOString();
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          let updatedApp = { ...app };
          const docIndex = updatedApp.documents.findIndex((d) => d.id === documentId);
          if (docIndex < 0) return app;

          const doc = updatedApp.documents[docIndex];
          const prevBocr = doc.bharatOcr || scanDocumentWithBharatOcr(doc, app);

          // Only update application fields if explicitly confirmed by officer!
          // "Do not automatically change PAN or Aadhaar numbers without confirmation."
          if (options.confirmChanges && options.verifiedFields) {
            const { panNumber, aadhaarNumber, fullName, dateOfBirth } = options.verifiedFields;
            if (doc.section === "signatory" || doc.requirementKey.includes("signatory")) {
              updatedApp = {
                ...updatedApp,
                signatory: {
                  ...updatedApp.signatory,
                  ...(panNumber ? { pan: panNumber } : {}),
                  ...(aadhaarNumber ? { idDocumentNumber: aadhaarNumber } : {}),
                  ...(fullName ? { fullName } : {}),
                  ...(dateOfBirth ? { dateOfBirth } : {}),
                },
              };
            } else if (doc.section === "business" || doc.requirementKey.includes("business")) {
              updatedApp = {
                ...updatedApp,
                business: {
                  ...updatedApp.business,
                  ...(panNumber ? { pan: panNumber } : {}),
                  ...(fullName ? { legalName: fullName } : {}),
                },
              };
            }
          }

          const updatedBocr = {
            ...prevBocr,
            overallStatus: "verified_match" as const,
            pixelonicsVerification: {
              isVerified: true,
              verifiedBy: prev.currentUser.name,
              verifiedAt: now,
              reviewNotes: options.notes || "Verified by Pixelonics Operations",
              changesConfirmed: Boolean(options.confirmChanges),
            },
          };

          const updatedDoc: ApplicationDocument = {
            ...doc,
            status: "verified_demo",
            reviewerNotes: options.notes || "Verified via BharatOCR by Pixelonics Operations",
            bharatOcr: updatedBocr,
          };

          const nextDocs = [...updatedApp.documents];
          nextDocs[docIndex] = updatedDoc;

          return {
            ...updatedApp,
            updatedAt: now,
            documents: nextDocs,
            auditTrail: [
              {
                id: uniqueId("audit"),
                applicationId: app.id,
                applicationReference: app.reference,
                type: "document_reviewed" as const,
                label: "BharatOCR Verified",
                description: `${doc.label} verified by Pixelonics Ops${
                  options.confirmChanges ? " (Changes explicitly confirmed to application)" : ""
                }. ${options.notes || ""}`,
                actor: {
                  id: prev.currentUser.id,
                  name: prev.currentUser.name,
                  role: prev.currentUser.role,
                },
                timestamp: now,
                isDemo: true as const,
              },
              ...app.auditTrail,
            ],
          };
        });
        return { ...prev, applications: apps };
      });
    },
    []
  );

  const rescanDocumentWithBharatOcr = useCallback(
    (applicationId: string, documentId: string, rawTextOverride?: string) => {
      setState((prev) => {
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          return {
            ...app,
            documents: app.documents.map((d) => {
              if (d.id !== documentId) return d;
              const freshScan = scanDocumentWithBharatOcr(d, app, rawTextOverride);
              return {
                ...d,
                bharatOcr: freshScan,
              };
            }),
          };
        });
        return { ...prev, applications: apps };
      });
    },
    []
  );

  const requestCorrection = useCallback(
    (
      applicationId: string,
      payload: {
        category: CorrectionCategory;
        sections: SectionKey[];
        reason: string;
        instructions: string;
        dueDate?: string;
      }
    ): CorrectionRequest => {
      const now = new Date().toISOString();
      const currentUser = stateRef.current.currentUser;
      const corr: CorrectionRequest = {
        id: uniqueId("corr"),
        applicationId,
        sections: payload.sections,
        documentIds: [],
        category: payload.category,
        reason: payload.reason,
        instructions: payload.instructions,
        dueDate: payload.dueDate,
        status: "open",
        createdAt: now,
        createdBy: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
        responses: [],
      };
      setState((prev) => {
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          return {
            ...app,
            status: "action_required" as ApplicationStatus,
            updatedAt: now,
            corrections: [corr, ...app.corrections],
            auditTrail: [
              {
                id: uniqueId("audit"),
                applicationId: app.id,
                applicationReference: app.reference,
                type: "correction_requested" as const,
                label: "Correction Requested",
                description: `${payload.reason} ΓÇö ${payload.instructions}`,
                actor: {
                  id: prev.currentUser.id,
                  name: prev.currentUser.name,
                  role: prev.currentUser.role,
                },
                timestamp: now,
                isDemo: true as const,
              },
              ...app.auditTrail,
            ],
          };
        });
        return {
          ...prev,
          applications: apps,
          notifications: [
            {
              id: uniqueId("notif"),
              userId: prev.currentUser.id,
              applicationId,
              kind: "action_required",
              title: `Correction Requested: ${payload.reason}`,
              body: payload.instructions,
              createdAt: now,
              read: false,
              href: `/portal/applications/${applicationId}`,
            },
            ...prev.notifications,
          ],
        };
      });
      return corr;
    },
    []
  );

  const respondToCorrection = useCallback(
    (applicationId: string, correctionId: string, message: string) => {
      setState((prev) => {
        const now = new Date().toISOString();
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          return {
            ...app,
            status: "under_review" as ApplicationStatus,
            updatedAt: now,
            corrections: app.corrections.map((c) =>
              c.id === correctionId
                ? {
                    ...c,
                    status: "responded" as const,
                    responses: [
                      ...c.responses,
                      {
                        id: uniqueId("resp"),
                        message,
                        respondedAt: now,
                        respondedBy: {
                          id: prev.currentUser.id,
                          name: prev.currentUser.name,
                          role: prev.currentUser.role,
                        },
                      },
                    ],
                  }
                : c
            ),
            auditTrail: [
              {
                id: uniqueId("audit"),
                applicationId: app.id,
                applicationReference: app.reference,
                type: "correction_responded" as const,
                label: "Correction Response Submitted",
                description: message,
                actor: {
                  id: prev.currentUser.id,
                  name: prev.currentUser.name,
                  role: prev.currentUser.role,
                },
                timestamp: now,
                isDemo: true as const,
              },
              ...app.auditTrail,
            ],
          };
        });
        return { ...prev, applications: apps };
      });
    },
    []
  );

  const resolveCorrection = useCallback((applicationId: string, correctionId: string) => {
    setState((prev) => {
      const now = new Date().toISOString();
      const apps = prev.applications.map((app) => {
        if (app.id !== applicationId) return app;
        return {
          ...app,
          updatedAt: now,
          corrections: app.corrections.map((c) =>
            c.id === correctionId ? { ...c, status: "resolved" as const } : c
          ),
        };
      });
      return { ...prev, applications: apps };
    });
  }, []);

  const recordDecision = useCallback(
    (applicationId: string, status: ApplicationStatus, reason?: string) => {
      const cur = stateRef.current;
      const targetApp = cur.applications.find((a) => a.id === applicationId);

      // Compliance validation gate: Approval requires all required documents and video KYC to be verified
      if (status === "approved" && targetApp) {
        const report = validateApplicationForApproval(targetApp, cur.policy);
        if (!report.canApprove) {
          toast.error(
            "Approval blocked: All required documents and the customer's KYC video must be verified first.",
            {
              description: report.blockingReasons[0] || "Compliance conditions incomplete.",
            }
          );
          return;
        }
      }

      setState((prev) => {
        const now = new Date().toISOString();
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          return {
            ...app,
            status,
            decidedAt: status === "approved" || status === "rejected" ? now : app.decidedAt,
            complianceReviewedAt: status === "approved" || status === "rejected" ? now : app.complianceReviewedAt,
            complianceReviewNotes:
              status === "approved" || status === "rejected"
                ? (reason ?? app.complianceReviewNotes)
                : app.complianceReviewNotes,
            decisionReason: reason ?? app.decisionReason,
            updatedAt: now,
            auditTrail: [
              {
                id: uniqueId("audit"),
                applicationId: app.id,
                applicationReference: app.reference,
                type: "decision_recorded" as const,
                label: `Application Status Updated: ${status.replace(/_/g, " ").toUpperCase()}`,
                description: reason || `Status updated to ${status} by ${prev.currentUser.name}.`,
                actor: {
                  id: prev.currentUser.id,
                  name: prev.currentUser.name,
                  role: prev.currentUser.role,
                },
                timestamp: now,
                isDemo: true as const,
              },
              ...app.auditTrail,
            ],
          };
        });
        return {
          ...prev,
          applications: apps,
          notifications: [
            {
              id: uniqueId("notif"),
              userId: prev.currentUser.id,
              applicationId,
              kind: "status",
              title: `Application ${status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Updated"}`,
              body: reason || `Application status is now ${status.replace(/_/g, " ")}.`,
              createdAt: now,
              read: false,
              href: `/portal/applications/${applicationId}`,
            },
            ...prev.notifications,
          ],
        };
      });
    },
    []
  );

  const assignReviewer = useCallback((applicationId: string, reviewerId: string) => {
    setState((prev) => {
      const now = new Date().toISOString();
      const reviewer = prev.users.find((u) => u.id === reviewerId);
      const apps = prev.applications.map((app) => {
        if (app.id !== applicationId) return app;
        return {
          ...app,
          assignedReviewerId: reviewerId,
          updatedAt: now,
          auditTrail: [
            {
              id: uniqueId("audit"),
              applicationId: app.id,
              applicationReference: app.reference,
              type: "reviewer_assigned" as const,
              label: "Reviewer Assigned",
              description: `Assigned to ${reviewer?.name ?? reviewerId} for compliance review.`,
              actor: {
                id: prev.currentUser.id,
                name: prev.currentUser.name,
                role: prev.currentUser.role,
              },
              timestamp: now,
              isDemo: true as const,
            },
            ...app.auditTrail,
          ],
        };
      });
      return { ...prev, applications: apps };
    });
  }, []);

  const forwardToPandosoft = useCallback((applicationId: string, notes?: string) => {
    setState((prev) => {
      const now = new Date().toISOString();
      const defaultNotes =
        notes?.trim() ||
        "All customer documents, details, wallets, and Video KYC verified by Pixelonics Operations. Forwarded to Pandosoft for final review.";
      const apps = prev.applications.map((app) => {
        if (app.id !== applicationId) return app;
        return {
          ...app,
          status: "ready_for_compliance" as ApplicationStatus,
          forwardedToPandosoftAt: now,
          opsReviewedAt: now,
          opsReviewNotes: defaultNotes,
          assignedReviewerId: "usr-pan-rev-1",
          updatedAt: now,
          auditTrail: [
            {
              id: uniqueId("audit"),
              applicationId: app.id,
              applicationReference: app.reference,
              type: "decision_recorded" as const,
              label: "Verified by Pixelonics — Forwarded to Pandosoft",
              description: defaultNotes,
              actor: {
                id: prev.currentUser.id,
                name: prev.currentUser.name,
                role: prev.currentUser.role,
              },
              timestamp: now,
              isDemo: true as const,
            },
            ...app.auditTrail,
          ],
        };
      });

      const updatedChecklists = {
        ...prev.opsChecklists,
        [applicationId]: {
          completeness: true,
          documentsUploaded: true,
          signedAndStamped: true,
          readyForCompliance: true,
        },
      };

      return {
        ...prev,
        applications: apps,
        opsChecklists: updatedChecklists,
        notifications: [
          {
            id: uniqueId("notif"),
            userId: "usr-pan-rev-1",
            applicationId,
            kind: "status" as const,
            title: "Application Forwarded for Final Review",
            body: `Application has been verified by Pixelonics Operations and forwarded to Pandosoft for final review.`,
            createdAt: now,
            read: false,
            href: `/pandosoft/applications/${applicationId}`,
          },
          ...prev.notifications,
        ],
      };
    });
  }, []);

  const scheduleVideoKyc = useCallback((applicationId: string, slotId: string) => {
    const slot = videoKycSlots.find((s) => s.id === slotId) ?? videoKycSlots[0];
    setState((prev) => {
      const now = new Date().toISOString();
      const apps = prev.applications.map((app) => {
        if (app.id !== applicationId) return app;
        return {
          ...app,
          updatedAt: now,
          videoKyc: {
            ...app.videoKyc,
            status: "scheduled" as VideoKycStatus,
            slotId: slot.id,
            scheduledAt: slot.startsAt,
            durationMinutes: slot.durationMinutes,
            officerName: slot.officerName,
          },
          auditTrail: [
            {
              id: uniqueId("audit"),
              applicationId: app.id,
              applicationReference: app.reference,
              type: "video_kyc_scheduled" as const,
              label: "Video KYC Scheduled",
              description: `Video KYC scheduled with ${slot.officerName} at ${new Date(slot.startsAt).toLocaleString()}.`,
              actor: {
                id: prev.currentUser.id,
                name: prev.currentUser.name,
                role: prev.currentUser.role,
              },
              timestamp: now,
              isDemo: true as const,
            },
            ...app.auditTrail,
          ],
        };
      });
      return { ...prev, applications: apps };
    });
  }, []);

  const recordVideoKycOutcome = useCallback(
    (applicationId: string, status: VideoKycStatus, note?: string) => {
      setState((prev) => {
        const now = new Date().toISOString();
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          return {
            ...app,
            updatedAt: now,
            videoKyc: {
              ...app.videoKyc,
              status,
              outcomeNote: note ?? (status === "completed" ? "Verified by Pixelonics Operations" : app.videoKyc.outcomeNote),
            },
            auditTrail: [
              {
                id: uniqueId("audit"),
                applicationId: app.id,
                applicationReference: app.reference,
                type: "video_kyc_recorded" as const,
                label: "Video KYC Outcome Recorded",
                description: `Video KYC marked as ${status}${note ? `: ${note}` : ""}`,
                actor: {
                  id: prev.currentUser.id,
                  name: prev.currentUser.name,
                  role: prev.currentUser.role,
                },
                timestamp: now,
                isDemo: true as const,
              },
              ...app.auditTrail,
            ],
          };
        });
        return { ...prev, applications: apps };
      });
    },
    []
  );

  const uploadVideoKyc = useCallback(
    async (
      applicationId: string,
      file: File,
      spokenScript: string
    ): Promise<{ videoUrl: string; document: ApplicationDocument }> => {
      const cur = stateRef.current;
      const targetApp = cur.applications.find((a) => a.id === applicationId) ?? cur.applications[0];
      const reference = targetApp?.reference ?? "PX-DEMO-001";
      const uploadedAt = new Date().toISOString();
      const documentId = `doc-vkyc-${Date.now()}`;

      let videoUrl = "";
      if (typeof URL !== "undefined") {
        try {
          videoUrl = trackObjectUrl(URL.createObjectURL(file));
        } catch {
          videoUrl = "";
        }
      }

      // 1. Save immediately in IndexedDB
      try {
        await saveVideoToIndexedDb({
          applicationId,
          reference,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "video/mp4",
          spokenScript,
          uploadedAt,
          blob: file,
        });
      } catch {
        // ignore IndexedDB errors
      }

      // 2. Sync to FastAPI backend SQLite database
      const fastApiForm = new FormData();
      fastApiForm.append("file", file);
      fastApiForm.append("application_id", applicationId);
      fastApiForm.append("reference", reference);
      fastApiForm.append("spoken_script", spokenScript);
      fastApiForm.append("uploaded_by", cur.currentUser.name);

      fetch(`${appConfig.apiBaseUrl}/documents/video-kyc`, {
        method: "POST",
        body: fastApiForm,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.videoUrl) {
            saveVideoToIndexedDb({
              applicationId,
              reference,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || "video/mp4",
              spokenScript,
              uploadedAt,
              blob: file,
              serverVideoUrl: data.videoUrl,
            }).catch(() => {});
          }
        })
        .catch(() => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("applicationId", applicationId);
          formData.append("reference", reference);
          formData.append("spokenScript", spokenScript);
          formData.append("uploadedBy", cur.currentUser.name);
          fetch("/api/video-kyc", { method: "POST", body: formData }).catch(() => {});
        });

      const newDoc: ApplicationDocument = {
        id: documentId,
        applicationId,
        requirementKey: "video_kyc",
        section: "declarations",
        label: "Video KYC Recording",
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "video/mp4",
        uploadedAt,
        version: 1,
        status: "ready_for_review",
        reviewerNotes: "",
        previewUrl: videoUrl,
        history: [
          {
            version: 1,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt,
            status: "ready_for_review",
          },
        ],
      };

      setState((prev) => {
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          const existingIdx = app.documents.findIndex((d) => d.requirementKey === "video_kyc");
          let nextDocs: ApplicationDocument[];
          if (existingIdx >= 0) {
            const prevDoc = app.documents[existingIdx];
            const nextVer = prevDoc.version + 1;
            const replaced: ApplicationDocument = {
              ...newDoc,
              id: prevDoc.id,
              version: nextVer,
              history: [
                ...prevDoc.history,
                {
                  version: nextVer,
                  fileName: file.name,
                  fileSize: file.size,
                  uploadedAt,
                  status: "ready_for_review",
                },
              ],
            };
            nextDocs = app.documents.map((d, idx) => (idx === existingIdx ? replaced : d));
          } else {
            nextDocs = [...app.documents, newDoc];
          }
          return {
            ...app,
            updatedAt: uploadedAt,
            videoKyc: {
              ...app.videoKyc,
              status: "completed" as VideoKycStatus,
              videoUrl,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || "video/mp4",
              uploadedAt,
              spokenScript,
              documentId: newDoc.id,
              outcomeNote: "Video KYC recorded and saved to database.",
            },
            documents: nextDocs,
            auditTrail: [
              {
                id: uniqueId("audit"),
                applicationId: app.id,
                applicationReference: app.reference,
                type: "video_kyc_recorded" as const,
                label: "Video KYC Recording Uploaded & Saved",
                description: `Video KYC recording (${file.name}, ${(file.size / (1024 * 1024)).toFixed(2)} MB) uploaded and saved to database.`,
                actor: {
                  id: prev.currentUser.id,
                  name: prev.currentUser.name,
                  role: prev.currentUser.role,
                },
                timestamp: uploadedAt,
                isDemo: true as const,
              },
              ...app.auditTrail,
            ],
          };
        });
        return { ...prev, applications: apps };
      });

      return { videoUrl, document: newDoc };
    },
    [trackObjectUrl]
  );

  const recordWalletVerification = useCallback(
    (applicationId: string, walletId: string, status: WalletVerificationStatus, note?: string) => {
      setState((prev) => {
        const now = new Date().toISOString();
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          return {
            ...app,
            updatedAt: now,
            wallets: app.wallets.map((w) =>
              w.id === walletId
                ? {
                    ...w,
                    verificationStatus: status,
                    verificationNote:
                      note ??
                      (status === "verified_demo"
                        ? "Verified by Pixelonics Operations"
                        : w.verificationNote),
                  }
                : w
            ),
            auditTrail: [
              {
                id: uniqueId("audit"),
                applicationId: app.id,
                applicationReference: app.reference,
                type: "wallet_verification_recorded" as const,
                label: "Wallet Verification Recorded",
                description: `Wallet verification updated to ${status.replace(/_/g, " ")}${note ? `: ${note}` : ""}`,
                actor: {
                  id: prev.currentUser.id,
                  name: prev.currentUser.name,
                  role: prev.currentUser.role,
                },
                timestamp: now,
                isDemo: true as const,
              },
              ...app.auditTrail,
            ],
          };
        });
        return { ...prev, applications: apps };
      });
    },
    []
  );

  const addInternalNote = useCallback((applicationId: string, body: string) => {
    setState((prev) => {
      const now = new Date().toISOString();
      const apps = prev.applications.map((app) => {
        if (app.id !== applicationId) return app;
        return {
          ...app,
          updatedAt: now,
          internalNotes: [
            {
              id: uniqueId("note"),
              body,
              author: {
                id: prev.currentUser.id,
                name: prev.currentUser.name,
                role: prev.currentUser.role,
              },
              createdAt: now,
            },
            ...app.internalNotes,
          ],
          auditTrail: [
            {
              id: uniqueId("audit"),
              applicationId: app.id,
              applicationReference: app.reference,
              type: "internal_note_added" as const,
              label: "Internal Note Added",
              description: body,
              actor: {
                id: prev.currentUser.id,
                name: prev.currentUser.name,
                role: prev.currentUser.role,
              },
              timestamp: now,
              isDemo: true as const,
            },
            ...app.auditTrail,
          ],
        };
      });
      return { ...prev, applications: apps };
    });
  }, []);

  const toggleOpsChecklist = useCallback((applicationId: string, key: string) => {
    setState((prev) => {
      const current = prev.opsChecklists[applicationId] ?? {
        completeness: false,
        documentsUploaded: false,
        signedAndStamped: false,
        readyForCompliance: false,
      };
      return {
        ...prev,
        opsChecklists: {
          ...prev.opsChecklists,
          [applicationId]: {
            ...current,
            [key]: !current[key],
          },
        },
      };
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const updatePolicy = useCallback((patch: Partial<CompliancePolicy>) => {
    setState((prev) => ({
      ...prev,
      policy: { ...prev.policy, ...patch },
    }));
  }, []);

  const saveDirectorSelfie = useCallback(
    (applicationId: string, directorId: string, selfie: IndividualSelfie) => {
      updateApplication(
        applicationId,
        (cur) => ({
          ...cur,
          directors: (cur.directors || []).map((d) =>
            d.id === directorId ? { ...d, selfie } : d
          ),
        }),
        `Captured Geo-Tagged Selfie for Director`
      );
    },
    [updateApplication]
  );

  const saveDirectorVideoKyc = useCallback(
    (applicationId: string, directorId: string, videoKyc: IndividualVideoKyc) => {
      updateApplication(
        applicationId,
        (cur) => ({
          ...cur,
          directors: (cur.directors || []).map((d) =>
            d.id === directorId ? { ...d, videoKyc } : d
          ),
        }),
        `Recorded Video KYC for Director`
      );
    },
    [updateApplication]
  );

  const saveUboSelfie = useCallback(
    (applicationId: string, uboId: string, selfie: IndividualSelfie) => {
      updateApplication(
        applicationId,
        (cur) => ({
          ...cur,
          beneficialOwners: (cur.beneficialOwners || []).map((u) =>
            u.id === uboId ? { ...u, selfie } : u
          ),
        }),
        `Captured Geo-Tagged Selfie for Beneficial Owner`
      );
    },
    [updateApplication]
  );

  const saveUboVideoKyc = useCallback(
    (applicationId: string, uboId: string, videoKyc: IndividualVideoKyc) => {
      updateApplication(
        applicationId,
        (cur) => ({
          ...cur,
          beneficialOwners: (cur.beneficialOwners || []).map((u) =>
            u.id === uboId ? { ...u, videoKyc } : u
          ),
        }),
        `Recorded Video KYC for Beneficial Owner`
      );
    },
    [updateApplication]
  );

  const addDirector = useCallback(
    (applicationId: string, directorData: Omit<Director, "id">) => {
      const newDir: Director = {
        ...directorData,
        id: `dir-${Date.now()}`,
      };
      updateApplication(
        applicationId,
        (cur) => ({
          ...cur,
          directors: [...(cur.directors || []), newDir],
        }),
        `Added Director ${newDir.fullName}`
      );
    },
    [updateApplication]
  );

  const removeDirector = useCallback(
    (applicationId: string, directorId: string) => {
      updateApplication(
        applicationId,
        (cur) => ({
          ...cur,
          directors: (cur.directors || []).filter((d) => d.id !== directorId),
        }),
        `Removed Director`
      );
    },
    [updateApplication]
  );

  const addBankAccount = useCallback(
    (applicationId: string, accountData: Omit<BankAccount, "id">) => {
      const newAcc: BankAccount = {
        ...accountData,
        id: `bank-${Date.now()}`,
      };
      updateApplication(
        applicationId,
        (cur) => {
          const currentList =
            cur.financial?.bankAccounts && cur.financial.bankAccounts.length > 0
              ? cur.financial.bankAccounts
              : [{ ...cur.financial.bankAccount, id: cur.financial.bankAccount.id || "bank-1" }];
          const updatedList = [...currentList, newAcc];
          const primaryAcc = updatedList.find((b) => b.isPrimary) || updatedList[0];
          return {
            ...cur,
            financial: {
              ...cur.financial,
              bankAccount: primaryAcc,
              bankAccounts: updatedList,
            },
          };
        },
        `Added Bank Account ${newAcc.bankName}`
      );
    },
    [updateApplication]
  );

  const removeBankAccount = useCallback(
    (applicationId: string, accountId: string) => {
      updateApplication(
        applicationId,
        (cur) => {
          const currentList =
            cur.financial?.bankAccounts && cur.financial.bankAccounts.length > 0
              ? cur.financial.bankAccounts
              : [{ ...cur.financial.bankAccount, id: cur.financial.bankAccount.id || "bank-1" }];
          const updatedList = currentList.filter((b) => b.id !== accountId);
          const primaryAcc =
            updatedList.find((b) => b.isPrimary) || updatedList[0] || cur.financial.bankAccount;
          return {
            ...cur,
            financial: {
              ...cur.financial,
              bankAccount: primaryAcc,
              bankAccounts: updatedList,
            },
          };
        },
        `Removed Bank Account`
      );
    },
    [updateApplication]
  );

  const setPrimaryBankAccount = useCallback(
    (applicationId: string, accountId: string) => {
      updateApplication(
        applicationId,
        (cur) => {
          const currentList =
            cur.financial?.bankAccounts && cur.financial.bankAccounts.length > 0
              ? cur.financial.bankAccounts
              : [{ ...cur.financial.bankAccount, id: cur.financial.bankAccount.id || "bank-1" }];
          const updatedList = currentList.map((b) => ({
            ...b,
            isPrimary: b.id === accountId,
          }));
          const primaryAcc = updatedList.find((b) => b.id === accountId) || updatedList[0];
          return {
            ...cur,
            financial: {
              ...cur.financial,
              bankAccount: primaryAcc,
              bankAccounts: updatedList,
            },
          };
        },
        `Updated Primary Bank Account`
      );
    },
    [updateApplication]
  );

  const summaries = useMemo(
    () => state.applications.map(computeApplicationSummary),
    [state.applications]
  );

  const contextValue = useMemo<OnboardingContextValue>(
    () => ({
      ...state,
      hydrated,
      summaries,
      videoSlots: videoKycSlots,
      loginAsEmail,
      loginByRole,
      registerUser,
      updateCurrentUser,
      getApplication,
      createApplication,
      updateApplication,
      submitApplication,
      uploadDocument,
      reviewDocument,
      requestCorrection,
      respondToCorrection,
      resolveCorrection,
      recordDecision,
      assignReviewer,
      scheduleVideoKyc,
      recordVideoKycOutcome,
      uploadVideoKyc,
      recordWalletVerification,
      forwardToPandosoft,
      addInternalNote,
      toggleOpsChecklist,
      markNotificationRead,
      markAllNotificationsRead,
      updatePolicy,
      verifyBharatOcrDetails,
      rescanDocumentWithBharatOcr,
      saveDirectorSelfie,
      saveDirectorVideoKyc,
      saveUboSelfie,
      saveUboVideoKyc,
      addDirector,
      removeDirector,
      addBankAccount,
      removeBankAccount,
      setPrimaryBankAccount,
    }),
    [
      state,
      hydrated,
      summaries,
      loginAsEmail,
      loginByRole,
      registerUser,
      updateCurrentUser,
      getApplication,
      createApplication,
      updateApplication,
      submitApplication,
      uploadDocument,
      reviewDocument,
      requestCorrection,
      respondToCorrection,
      resolveCorrection,
      recordDecision,
      assignReviewer,
      scheduleVideoKyc,
      recordVideoKycOutcome,
      uploadVideoKyc,
      recordWalletVerification,
      forwardToPandosoft,
      addInternalNote,
      toggleOpsChecklist,
      markNotificationRead,
      markAllNotificationsRead,
      updatePolicy,
      verifyBharatOcrDetails,
      rescanDocumentWithBharatOcr,
      saveDirectorSelfie,
      saveDirectorVideoKyc,
      saveUboSelfie,
      saveUboVideoKyc,
      addDirector,
      removeDirector,
      addBankAccount,
      removeBankAccount,
      setPrimaryBankAccount,
    ]
  );

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
