"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { DOCUMENT_STATUS_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { DocumentViewerModal } from "@/components/documents/document-viewer-modal";
import { isPdfFile, isImageFile } from "@/lib/utils/document-previews";
import type { ApplicationDocument } from "@/lib/types";
import { ArrowLeft, CheckCircle, AlertCircle, Check, X, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

export default function PixelonicsApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getApplication,
    opsChecklists,
    toggleOpsChecklist,
    reviewDocument,
    requestCorrection,
    recordDecision,
    assignReviewer,
  } = useOnboarding();

  const app = getApplication(id);
  const checklist = opsChecklists[app.id] ?? {
    completeness: true,
    documentsUploaded: true,
    signedAndStamped: false,
    readyForCompliance: false,
  };

  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [corrReason, setCorrReason] = useState("");
  const [corrInstructions, setCorrInstructions] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<ApplicationDocument | null>(null);

  const handleMarkReady = () => {
    assignReviewer(app.id, "usr-pan-rev-1");
    recordDecision(
      app.id,
      "under_review",
      "Marked Ready for Pandosoft Compliance Review by Pixelonics Operations."
    );
    toast.success(`Application ${app.reference} forwarded to Pandosoft Compliance`);
  };

  const handleCreateCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrReason.trim() || !corrInstructions.trim()) {
      toast.error("Please provide both reason and instructions");
      return;
    }
    requestCorrection(app.id, {
      category: "missing_information",
      sections: ["business", "declarations"],
      reason: corrReason.trim(),
      instructions: corrInstructions.trim(),
    });
    setCorrReason("");
    setCorrInstructions("");
    setShowCorrectionForm(false);
    toast.success("Correction request sent to customer");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Operations Review — {app.reference}
          </h1>
          <p className="text-muted-foreground">{app.business.legalName}</p>
        </div>
        <div className="flex items-center gap-2">
          <ApplicationStatusBadge status={app.status} />
          <Button variant="outline" asChild>
            <Link href="/pixelonics/applications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCorrectionForm((v) => !v)}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Request Corrections
        </Button>
        <Button type="button" onClick={handleMarkReady}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark Ready for Pandosoft Compliance Review
        </Button>
      </div>

      {showCorrectionForm && (
        <Card className="border-warning/40">
          <CardHeader>
            <CardTitle>Raise Correction Request</CardTitle>
            <CardDescription>Customer will be notified immediately</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCorrection} className="space-y-4">
              <div className="space-y-2">
                <Label>Correction Title / Reason *</Label>
                <Input
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  placeholder="e.g. Missing stamp on Board Resolution"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Detailed Instructions for Customer *</Label>
                <Textarea
                  value={corrInstructions}
                  onChange={(e) => setCorrInstructions(e.target.value)}
                  placeholder="Specify what needs to be corrected or re-uploaded..."
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Send Correction Request</Button>
                <Button type="button" variant="outline" onClick={() => setShowCorrectionForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Operations Review Checklist</CardTitle>
          <CardDescription>Toggle items as you verify the application package</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "completeness", label: "Application completeness & PAN/GSTIN cross-check" },
            { key: "documentsUploaded", label: "All required entity, signatory, UBO & bank documents uploaded" },
            { key: "signedAndStamped", label: "Generated declarations signed & company-stamped" },
            { key: "readyForCompliance", label: "Ready to forward to Pandosoft Compliance" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between border-b pb-2.5 last:border-0">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={item.key}
                  checked={Boolean(checklist[item.key])}
                  onCheckedChange={() => toggleOpsChecklist(app.id, item.key)}
                />
                <Label htmlFor={item.key}>{item.label}</Label>
              </div>
              <Badge variant={checklist[item.key] ? "default" : "outline"}>
                {checklist[item.key] ? "Verified" : "Pending"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Document Verification Queue ({app.documents.length})</CardTitle>
              <CardDescription>
                Review and verify all customer-uploaded documents (Images, PDFs, Word, and other formats)
              </CardDescription>
            </div>
            <Badge variant="outline">
              {app.documents.filter((d) => d.status === "verified_demo").length} of {app.documents.length} Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {app.documents.map((doc) => {
            const isPdf = isPdfFile(doc.fileName, doc.mimeType);
            const isImage = isImageFile(doc.fileName, doc.mimeType);

            return (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm transition-colors hover:border-primary/40 bg-card"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold">
                    {isPdf ? "PDF" : isImage ? "IMG" : <FileText className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-emerald-600 border-emerald-300"
                    onClick={() => {
                      reviewDocument(app.id, doc.id, "verified_demo", "Verified by Pixelonics Ops");
                      toast.success(`Verified ${doc.label}`);
                    }}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Verify
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-destructive"
                    onClick={() => {
                      reviewDocument(app.id, doc.id, "replacement_required", "Please re-upload a clearer copy");
                      toast.warning(`Requested replacement for ${doc.label}`);
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

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        application={app}
        allDocuments={app.documents}
        onSelectDocument={(doc) => setSelectedDoc(doc)}
        onVerify={(docId, notes) => {
          reviewDocument(app.id, docId, "verified_demo", notes);
        }}
        onReject={(docId, notes) => {
          reviewDocument(app.id, docId, "replacement_required", notes);
        }}
      />
    </div>
  );
}
