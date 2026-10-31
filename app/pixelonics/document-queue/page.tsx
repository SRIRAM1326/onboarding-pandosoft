"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_STATUS_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { DocumentViewerModal } from "@/components/documents/document-viewer-modal";
import { isPdfFile, isImageFile, isWordFile } from "@/lib/utils/document-previews";
import { BHARAT_OCR_DISCLAIMER } from "@/lib/utils/bharat-ocr-engine";
import type { ApplicationDocument } from "@/lib/types";
import { Check, X, Eye, FileText, Sparkles, ShieldCheck, AlertTriangle, CheckCircle2, HelpCircle, Info } from "lucide-react";
import { toast } from "sonner";

export default function PixelonicsDocumentQueuePage() {
  const { applications, reviewDocument, verifyBharatOcrDetails } = useOnboarding();
  const [selectedDoc, setSelectedDoc] = useState<(ApplicationDocument & { appId: string }) | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "ocr_flagged" | "verified">("all");

  const docs = applications.flatMap((app) =>
    app.documents.map((d) => ({ ...d, appId: app.id, appRef: app.reference, businessName: app.business.legalName }))
  );

  const filteredDocs = docs.filter((doc) => {
    if (filterMode === "verified") {
      return doc.status === "verified_demo" || doc.bharatOcr?.pixelonicsVerification?.isVerified;
    }
    if (filterMode === "ocr_flagged") {
      const st = doc.bharatOcr?.overallStatus;
      return st === "mismatch_flagged" || st === "unclear_manual_review" || st === "format_error_flagged";
    }
    return true;
  });

  const targetApp = selectedDoc
    ? applications.find((a) => a.id === selectedDoc.appId)
    : undefined;

  const renderBharatOcrBadge = (doc: ApplicationDocument) => {
    const bocr = doc.bharatOcr;
    if (!bocr) {
      return (
        <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
          <Sparkles className="h-2.5 w-2.5 text-amber-500" />
          OCR Ready
        </Badge>
      );
    }

    if (bocr.pixelonicsVerification.isVerified) {
      return (
        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 font-semibold">
          <CheckCircle2 className="h-2.5 w-2.5" />
          BharatOCR Verified
        </Badge>
      );
    }

    switch (bocr.overallStatus) {
      case "mismatch_flagged":
        return (
          <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-300 gap-1 font-semibold">
            <AlertTriangle className="h-2.5 w-2.5" />
            OCR Mismatch
          </Badge>
        );
      case "unclear_manual_review":
        return (
          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 gap-1 font-semibold">
            <HelpCircle className="h-2.5 w-2.5" />
            OCR Unclear
          </Badge>
        );
      case "format_error_flagged":
        return (
          <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-300 gap-1 font-semibold">
            <AlertTriangle className="h-2.5 w-2.5" />
            Format Error
          </Badge>
        );
      case "verified_match":
      default:
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
            <Sparkles className="h-2.5 w-2.5 text-amber-500" />
            OCR Matched
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Pixelonics Document Queue</h1>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            BharatOCR Powered
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Initial verification queue: All uploaded PAN cards, Aadhaar cards, and documents are automatically scanned by BharatOCR. Pixelonics Operations must review and verify all extracted details before forwarding to Pandosoft.
        </p>
      </div>

      {/* BHARAT OCR COMPLIANCE BANNER */}
      <div className="rounded-xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-start gap-2.5">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              BharatOCR Automatic Scanning &amp; Verification Protocol
            </p>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              {BHARAT_OCR_DISCLAIMER} Original files are preserved unmodified in server storage and SQLite database.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="border-amber-400 text-amber-800 dark:text-amber-200 bg-amber-100/50">
            Pixelonics: Initial Verification
          </Badge>
          <Badge variant="outline" className="border-slate-400 text-slate-700 dark:text-slate-300 bg-slate-100/50">
            Pandosoft: Final Approval
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>All Uploaded Documents ({filteredDocs.length})</CardTitle>
              <CardDescription>
                Click &ldquo;View &amp; Review&rdquo; to inspect original documents side-by-side with BharatOCR extraction
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    filterMode === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  All ({docs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("ocr_flagged")}
                  className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                    filterMode === "ocr_flagged" ? "bg-background text-foreground shadow-xs text-rose-600 font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3 text-rose-500" />
                  OCR Flagged
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("verified")}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    filterMode === "verified" ? "bg-background text-foreground shadow-xs text-emerald-600 font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Verified ({docs.filter((d) => d.status === "verified_demo").length})
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredDocs.map((doc) => {
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-foreground truncate">{doc.label}</p>
                      <span className="text-xs text-muted-foreground">({doc.appRef})</span>
                      {renderBharatOcrBadge(doc)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.businessName} • {doc.fileName} • v{doc.version}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 bg-primary hover:bg-primary/90 text-white gap-1"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View &amp; Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-emerald-600 border-emerald-300"
                    onClick={() => {
                      reviewDocument(doc.appId, doc.id, "verified_demo", "Verified by Pixelonics Ops");
                      toast.success(`Verified ${doc.label}`);
                    }}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-destructive"
                    onClick={() => {
                      reviewDocument(doc.appId, doc.id, "replacement_required", "Replacement requested by Ops");
                      toast.warning(`Flagged ${doc.label} for replacement`);
                    }}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Replace
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* DOCUMENT VIEWER MODAL WITH BHARAT OCR INTEGRATION */}
      <DocumentViewerModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        application={targetApp}
        allDocuments={docs}
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
        onVerifyBharatOcr={(docId, opts) => {
          if (selectedDoc) {
            verifyBharatOcrDetails(selectedDoc.appId, docId, opts);
          }
        }}
      />
    </div>
  );
}
