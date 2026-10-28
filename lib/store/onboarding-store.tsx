"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
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
import { getAllVideosFromIndexedDb, saveVideoToIndexedDb } from "@/lib/utils/video-db";

const STORAGE_KEY = "pixelonics_onboarding_state_v1";

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
  addInternalNote: (applicationId: string, body: string) => void;
  toggleOpsChecklist: (applicationId: string, key: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updatePolicy: (patch: Partial<CompliancePolicy>) => void;
}

const initialState: PersistedState = {
  currentUser: currentMockUser,
  users: mockUsers,
  applications: mockApplications,
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

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  const stateRef = useRef<PersistedState>(state);
  stateRef.current = state;

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

  // 1. Lightweight hydration from localStorage on mount (with strict safety against giant blobs)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // If raw is abnormally large (>50KB) or contains embedded base64 data URLs, sanitize immediately
        if (raw.length > 50_000 || raw.includes("data:video") || raw.includes("data:image")) {
          localStorage.removeItem(STORAGE_KEY);
        } else {
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
                return {
                  ...a,
                  declarations: decls,
                  documents:
                    a.id === "app-demo-001" && (!a.documents || a.documents.length === 0)
                      ? mockApplications[0].documents
                      : a.documents,
                };
              }),
            };
            const cleaned = sanitizeStateForStorage(merged);
            setState(cleaned);
          }
        }
      }
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    setHydrated(true);
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
          expectedVolumeRange: "₹1 crore – ₹5 crore per month",
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
            id: `audit-${Date.now()}`,
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
              id: `notif-${Date.now()}`,
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
                id: `audit-${Date.now()}`,
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
              id: `audit-${Date.now()}`,
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
            id: `notif-${Date.now()}`,
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

      const newDoc: ApplicationDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        applicationId,
        requirementKey: meta.requirementKey,
        section: meta.section,
        ownerRef: meta.ownerRef,
        label: meta.label,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/pdf",
        uploadedAt: now,
        version: 1,
        status: "ready_for_review",
        reviewerNotes: "",
        previewUrl,
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
                id: `audit-${Date.now()}`,
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
              d.id === documentId ? { ...d, status, reviewerNotes: notes ?? d.reviewerNotes } : d
            ),
            auditTrail: [
              {
                id: `audit-${Date.now()}`,
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
        id: `corr-${Date.now()}`,
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
                id: `audit-${Date.now()}`,
                applicationId: app.id,
                applicationReference: app.reference,
                type: "correction_requested" as const,
                label: "Correction Requested",
                description: `${payload.reason} — ${payload.instructions}`,
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
              id: `notif-${Date.now()}`,
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
                        id: `resp-${Date.now()}`,
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
                id: `audit-${Date.now()}`,
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
      setState((prev) => {
        const now = new Date().toISOString();
        const apps = prev.applications.map((app) => {
          if (app.id !== applicationId) return app;
          return {
            ...app,
            status,
            decidedAt: status === "approved" || status === "rejected" ? now : app.decidedAt,
            decisionReason: reason ?? app.decisionReason,
            updatedAt: now,
            auditTrail: [
              {
                id: `audit-${Date.now()}`,
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
              id: `notif-${Date.now()}`,
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
              id: `audit-${Date.now()}`,
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
              id: `audit-${Date.now()}`,
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
              outcomeNote: note ?? app.videoKyc.outcomeNote,
            },
            auditTrail: [
              {
                id: `audit-${Date.now()}`,
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
                id: `audit-${Date.now()}`,
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
                ? { ...w, verificationStatus: status, verificationNote: note ?? w.verificationNote }
                : w
            ),
            auditTrail: [
              {
                id: `audit-${Date.now()}`,
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
              id: `note-${Date.now()}`,
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
              id: `audit-${Date.now()}`,
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
      addInternalNote,
      toggleOpsChecklist,
      markNotificationRead,
      markAllNotificationsRead,
      updatePolicy,
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
      addInternalNote,
      toggleOpsChecklist,
      markNotificationRead,
      markAllNotificationsRead,
      updatePolicy,
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
