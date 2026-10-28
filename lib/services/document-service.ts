import type { ApplicationDocument } from "@/lib/types";
import { appConfig } from "@/lib/config/env";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface DocumentService {
  upload: (file: File, meta: Partial<ApplicationDocument>) => Promise<ApplicationDocument>;
  remove: (id: string) => Promise<void>;
}

class MockDocumentService implements DocumentService {
  async upload(file: File, meta: Partial<ApplicationDocument>) {
    await delay(appConfig.mockLatencyMs);
    const now = new Date().toISOString();
    const doc: ApplicationDocument = {
      id: `doc-${Date.now()}`,
      applicationId: meta.applicationId ?? "",
      requirementKey: meta.requirementKey ?? "",
      section: meta.section ?? "business",
      ownerRef: meta.ownerRef,
      label: meta.label ?? file.name,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: now,
      version: 1,
      status: "ready_for_review",
      reviewerNotes: "",
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
    return doc;
  }

  async remove() {
    await delay(150);
  }
}

export const documentService: DocumentService = new MockDocumentService();
