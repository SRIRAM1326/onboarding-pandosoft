"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_STATUS_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { DocumentViewerModal } from "@/components/documents/document-viewer-modal";
import { isPdfFile, isImageFile, isWordFile } from "@/lib/utils/document-previews";
import type { ApplicationDocument } from "@/lib/types";
import { Check, X, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

export default function DocumentReviewPage() {
  const { applications, reviewDocument } = useOnboarding();
  const [selectedDoc, setSelectedDoc] = useState<(ApplicationDocument & { appId: string }) | null>(null);

  const allDocs = applications.flatMap((app) =>
    app.documents.map((d) => ({ ...d, appId: app.id, appRef: app.reference }))
  );

  const targetApp = selectedDoc
    ? applications.find((a) => a.id === selectedDoc.appId)
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Document Review</h1>
        <p className="text-muted-foreground">
          View and review customer-uploaded documents across all applications (Images, PDFs, and supported formats)
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>All Uploaded Documents ({allDocs.length})</CardTitle>
              <CardDescription>
                Click &ldquo;View &amp; Review&rdquo; on any document to inspect content, zoom/rotate, check seals, and record compliance outcomes.
              </CardDescription>
            </div>
            <Badge variant="outline">
              {allDocs.filter((d) => d.status === "verified_demo").length} of {allDocs.length} Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {allDocs.map((doc) => {
            const isPdf = isPdfFile(doc.fileName, doc.mimeType);
            const isImage = isImageFile(doc.fileName, doc.mimeType);
            const isWord = isWordFile(doc.fileName, doc.mimeType);
            const fileExt = (doc.fileName?.split(".").pop() || "FILE").toUpperCase().slice(0, 4);

            return (
              <div
                key={`${doc.appId}-${doc.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors hover:border-primary/40 bg-card"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border text-muted-foreground font-mono">
                    {isPdf ? (
                      <span className="text-[10px] font-bold text-rose-600">PDF</span>
                    ) : isImage ? (
                      <span className="text-[10px] font-bold text-sky-600">IMG</span>
                    ) : isWord ? (
                      <span className="text-[10px] font-bold text-blue-600">DOC</span>
                    ) : (
                      <span className="text-[9px] font-bold text-primary">{fileExt}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {doc.label} <span className="text-xs text-muted-foreground">({doc.appRef})</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.fileName} • v{doc.version} • {(doc.fileSize / 1024).toFixed(0)} KB
                      {doc.reviewerNotes ? ` • Note: ${doc.reviewerNotes}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      doc.status === "verified_demo"
                        ? "bg-emerald-600 text-white border-transparent"
                        : doc.status === "replacement_required"
                        ? "bg-amber-600 text-white border-transparent"
                        : ""
                    }
                  >
                    {DOCUMENT_STATUS_LABELS[doc.status]}
                  </Badge>

                  <Button
                    size="sm"
                    variant="default"
                    className="bg-primary hover:bg-primary/90 text-white h-8"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View &amp; Review
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    onClick={() => {
                      reviewDocument(doc.appId, doc.id, "verified_demo", "Verified by Compliance");
                      toast.success(`Verified ${doc.label}`);
                    }}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Verify
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    onClick={() => {
                      reviewDocument(doc.appId, doc.id, "replacement_required", "Replacement requested");
                      toast.warning(`Requested replacement for ${doc.label}`);
                    }}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        application={targetApp}
        allDocuments={allDocs}
        onSelectDocument={(doc) => {
          const appDoc = doc as ApplicationDocument & { appId: string };
          setSelectedDoc(appDoc);
        }}
        onVerify={(docId, notes) => {
          if (selectedDoc) {
            reviewDocument(selectedDoc.appId, docId, "verified_demo", notes);
          }
        }}
        onReject={(docId, notes) => {
          if (selectedDoc) {
            reviewDocument(selectedDoc.appId, docId, "replacement_required", notes);
          }
        }}
      />
    </div>
  );
}
