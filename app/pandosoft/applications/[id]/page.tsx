"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import {
  DOCUMENT_STATUS_LABELS,
  VIDEO_KYC_STATUS_LABELS,
  WALLET_STATUS_LABELS,
} from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { ComplianceVerificationGate } from "@/components/verification/compliance-verification-gate";
import { DocumentViewerModal } from "@/components/documents/document-viewer-modal";
import { isPdfFile, isImageFile } from "@/lib/utils/document-previews";
import type { ApplicationDocument } from "@/lib/types";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Eye,
  Video,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function PandosoftApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getApplication,
    recordDecision,
    reviewDocument,
    recordWalletVerification,
    recordVideoKycOutcome,
    requestCorrection,
    addInternalNote,
    policy,
  } = useOnboarding();

  const app = getApplication(id);
  const [comments, setComments] = useState(app.decisionReason ?? "");
  const [selectedDoc, setSelectedDoc] = useState<ApplicationDocument | null>(null);

  const handleApprove = (reason?: string) => {
    const finalReason =
      reason || comments.trim() || "Approved by Pandosoft Compliance for corporate trading activation.";
    recordDecision(app.id, "approved", finalReason);
    addInternalNote(app.id, `Compliance Approved: ${finalReason}`);
    toast.success(`Application ${app.reference} APPROVED for activation!`);
  };

  const handleReject = (reason?: string) => {
    const finalReason = reason || comments.trim() || "Rejected during Pandosoft Compliance review.";
    recordDecision(app.id, "rejected", finalReason);
    addInternalNote(app.id, `Compliance Rejected: ${finalReason}`);
    toast.error(`Application ${app.reference} marked as REJECTED`);
  };

  const handleRequestClarification = () => {
    const note = comments.trim() || "Please provide updated Source of Funds supporting evidence.";
    requestCorrection(app.id, {
      category: "missing_information",
      sections: ["financial", "wallets"],
      reason: "Pandosoft Compliance Clarification Required",
      instructions: note,
    });
    toast.warning("Requested clarification from customer");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pandosoft Compliance Review — {app.reference}
          </h1>
          <p className="text-muted-foreground">{app.business.legalName}</p>
        </div>
        <div className="flex items-center gap-2">
          <ApplicationStatusBadge status={app.status} />
          <Button variant="outline" asChild>
            <Link href="/pandosoft/applications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Review Queue
            </Link>
          </Button>
        </div>
      </div>

      {/* COMPLIANCE VERIFICATION & REGULATORY DECISION GATE */}
      <ComplianceVerificationGate
        app={app}
        policy={policy}
        onApprove={handleApprove}
        onReject={handleReject}
        onOpenDocument={(doc) => setSelectedDoc(doc)}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entity &amp; UBO Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Legal Name</span>
              <span className="font-medium">{app.business.legalName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PAN / CIN</span>
              <span>
                {app.business.pan} / {app.business.registrationNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source of Funds</span>
              <span>{app.financial.sourceOfFundsExplanation}</span>
            </div>
            <div className="pt-2">
              <p className="mb-1 font-medium">Declared Beneficial Owners:</p>
              {app.beneficialOwners.map((u) => (
                <p key={u.id} className="text-muted-foreground">
                  • {u.fullName} — {u.ownershipPercentage}% ({u.role}, PAN: {u.pan})
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet &amp; Video KYC Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {app.wallets.map((w) => (
              <div key={w.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {w.label} ({w.network})
                  </span>
                  <Badge variant="outline">{WALLET_STATUS_LABELS[w.verificationStatus]}</Badge>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{w.address}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      recordWalletVerification(
                        app.id,
                        w.id,
                        "verified_demo",
                        "Verified by Pandosoft Compliance"
                      );
                      toast.success(`Verified wallet ${w.label}`);
                    }}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Verify Wallet
                  </Button>
                </div>
              </div>
            ))}

            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-primary" />
                    Customer KYC Video
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}
                    {app.videoKyc.fileName ? ` • ${app.videoKyc.fileName}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={app.videoKyc.status === "completed" ? "border-emerald-500 text-emerald-600" : ""}
                  onClick={() => {
                    recordVideoKycOutcome(app.id, "completed", "Completed and verified by Pandosoft");
                    toast.success("Marked Video KYC as Completed & Verified");
                  }}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {app.videoKyc.status === "completed" ? "Verified" : "Mark Video KYC Complete"}
                </Button>
              </div>
              {app.videoKyc.videoUrl ? (
                <div className="overflow-hidden rounded-lg border bg-black">
                  <video
                    controls
                    preload="metadata"
                    src={app.videoKyc.videoUrl}
                    className="aspect-video w-full object-contain"
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No video recording uploaded by customer yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ALL DOCUMENTS WITH VIEW & REVIEW BUTTONS */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Uploaded Documents ({app.documents.length})</CardTitle>
              <CardDescription>
                The officer must review all uploaded documents (PDFs, Images, and other supported formats)
              </CardDescription>
            </div>
            <Badge variant="outline">
              {app.documents.filter((d) => d.status === "verified_demo").length} of {app.documents.length} Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {app.documents.map((doc) => {
            const isPdf = isPdfFile(doc.fileName, doc.mimeType);
            const isImage = isImageFile(doc.fileName, doc.mimeType);

            return (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold">
                    {isPdf ? "PDF" : isImage ? "IMG" : <FileText className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    View
                  </Button>
                  {doc.status !== "verified_demo" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-emerald-600 border-emerald-300"
                      onClick={() => {
                        reviewDocument(app.id, doc.id, "verified_demo", "Verified by Pandosoft");
                        toast.success(`Verified ${doc.label}`);
                      }}
                    >
                      Verify
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Final Compliance Review Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium">Compliance Review Comments / Notes</p>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add compliance review comments, AML screening notes, or conditions..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleRequestClarification}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Request Clarification
            </Button>
          </div>
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
