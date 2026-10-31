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
  ENTITY_TYPE_LABELS,
  VIDEO_KYC_STATUS_LABELS,
  WALLET_STATUS_LABELS,
} from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { ComplianceVerificationGate } from "@/components/verification/compliance-verification-gate";
import { DocumentViewerModal } from "@/components/documents/document-viewer-modal";
import { isPdfFile, isImageFile } from "@/lib/utils/document-previews";
import { validateApplicationForApproval } from "@/lib/utils/verification-rules";
import type { ApplicationDocument } from "@/lib/types";
import {
  ArrowLeft,
  AlertCircle,
  Eye,
  Video,
  FileText,
  CheckCircle2,
  XCircle,
  Building,
  CreditCard,
  Wallet as WalletIcon,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function PandosoftApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getApplication,
    recordDecision,
    requestCorrection,
    addInternalNote,
    policy,
  } = useOnboarding();

  const app = getApplication(id);
  const [comments, setComments] = useState(app.complianceReviewNotes || app.decisionReason || "");
  const [selectedDoc, setSelectedDoc] = useState<ApplicationDocument | null>(null);

  const report = validateApplicationForApproval(app, policy);
  const isForwarded =
    app.status === "ready_for_compliance" ||
    Boolean(app.forwardedToPandosoftAt) ||
    app.status === "approved" ||
    app.status === "rejected";

  const handleApprove = (reason?: string) => {
    const finalReason =
      reason || comments.trim() || "Approved by Pandosoft Compliance for corporate trading activation.";
    recordDecision(app.id, "approved", finalReason);
    addInternalNote(app.id, `Pandosoft Final Decision: Approved — ${finalReason}`);
    toast.success(`Application ${app.reference} APPROVED for activation by Pandosoft!`);
  };

  const handleReject = (reason?: string) => {
    const finalReason = reason || comments.trim() || "Rejected during Pandosoft Compliance review.";
    recordDecision(app.id, "rejected", finalReason);
    addInternalNote(app.id, `Pandosoft Final Decision: Rejected — ${finalReason}`);
    toast.error(`Application ${app.reference} marked as REJECTED by Pandosoft`);
  };

  const handleRequestClarification = () => {
    const note = comments.trim() || "Please provide clarification on beneficial ownership and source of funds.";
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
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Pandosoft Compliance Final Review — {app.reference}
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Final Approval / Rejection Authority
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {app.business.legalName} • Pandosoft team performs the final review and either approves or rejects this application
          </p>
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

      {/* VERIFICATION HANDOVER STATUS BANNER */}
      {isForwarded ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">
                Verified Information Package Forwarded by Pixelonics
              </p>
              <p className="text-xs text-muted-foreground">
                The Pixelonics team completed the initial verification of all customer-uploaded documents and details. Pandosoft team performs the final review to approve or reject.
              </p>
              {app.opsReviewNotes && (
                <p className="text-xs italic text-emerald-800 dark:text-emerald-300 mt-1">
                  Pixelonics Handover: &ldquo;{app.opsReviewNotes}&rdquo;
                </p>
              )}
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white">
            Ready for Final Decision
          </Badge>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">
                Initial Verification in Progress at Pixelonics
              </p>
              <p className="text-xs text-muted-foreground">
                The initial document and detail verification is currently handled by the Pixelonics team. Once Pixelonics completes the verification, they will forward the verified information to Pandosoft for final approval or rejection.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-400 text-amber-600">
            Awaiting Pixelonics Verification
          </Badge>
        </div>
      )}

      {/* COMPLIANCE VERIFICATION & REGULATORY DECISION GATE */}
      <ComplianceVerificationGate
        app={app}
        policy={policy}
        onApprove={handleApprove}
        onReject={handleReject}
        onOpenDocument={(doc) => setSelectedDoc(doc)}
      />

      {/* VERIFIED ENTITY & FINANCIAL DETAILS */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                Verified Entity &amp; UBO Structure
              </CardTitle>
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                Verified by Pixelonics
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Legal Name</span>
              <span className="font-medium">{app.business.legalName}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Entity Type</span>
              <span>{ENTITY_TYPE_LABELS[app.business.entityType as keyof typeof ENTITY_TYPE_LABELS] || app.business.entityType}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">PAN / CIN</span>
              <span className="font-mono">
                {app.business.pan} / {app.business.registrationNumber}
              </span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">GSTIN</span>
              <span className="font-mono">{app.business.gstin || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Signatory</span>
              <span>{app.signatory.fullName} ({app.signatory.designation})</span>
            </div>
            <div className="pt-2">
              <p className="mb-1 font-medium text-xs text-muted-foreground">Declared Beneficial Owners (UBOs):</p>
              {app.beneficialOwners.map((u) => (
                <p key={u.id} className="text-xs text-muted-foreground">
                  • <span className="font-medium text-foreground">{u.fullName}</span> — {u.ownershipPercentage}% ({u.role}, PAN: {u.pan})
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wallets & Video KYC Verified Package */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <WalletIcon className="h-4 w-4 text-primary" />
                Wallets &amp; Video KYC (Verified by Pixelonics)
              </CardTitle>
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                Verified by Pixelonics
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {app.wallets.map((w) => {
              const isVerified = w.verificationStatus === "verified_demo" || (w.verificationStatus as string) === "verified";
              return (
                <div key={w.id} className="rounded-lg border p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs">
                      {w.label} ({w.network.toUpperCase()})
                    </span>
                    <Badge variant={isVerified ? "default" : "outline"} className={isVerified ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}>
                      {isVerified ? "Verified by Pixelonics" : WALLET_STATUS_LABELS[w.verificationStatus]}
                    </Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground truncate">{w.address}</p>
                </div>
              );
            })}

            <div className="rounded-lg border p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-xs flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 text-primary" />
                    Customer KYC Video
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {app.videoKyc.status === "completed"
                      ? "Verified by Pixelonics Operations"
                      : VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}
                  </p>
                </div>
                <Badge variant={app.videoKyc.status === "completed" ? "default" : "outline"} className={app.videoKyc.status === "completed" ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}>
                  {app.videoKyc.status === "completed" ? "Verified by Pixelonics" : "Pending Pixelonics"}
                </Badge>
              </div>
              {app.videoKyc.videoUrl ? (
                <div className="overflow-hidden rounded-md border bg-black">
                  <video
                    controls
                    preload="metadata"
                    src={app.videoKyc.videoUrl}
                    className="aspect-video w-full max-h-36 object-contain"
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Video declaration uploaded by customer.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VERIFIED CUSTOMER DOCUMENTS (READ-ONLY INSPECTION BY PANDOSOFT) */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Customer Uploaded Documents ({app.documents.length})</CardTitle>
              <CardDescription>
                Initial document verification is performed by Pixelonics. Pandosoft officers inspect documents for final compliance sign-off.
              </CardDescription>
            </div>
            <Badge variant="outline" className={report.allDocumentsVerified ? "border-emerald-500 text-emerald-600" : ""}>
              {report.totalVerified} of {report.totalRequired} Verified by Pixelonics
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {app.documents.map((doc) => {
            const isPdf = isPdfFile(doc.fileName, doc.mimeType);
            const isImage = isImageFile(doc.fileName, doc.mimeType);
            const isVerified = doc.status === "verified_demo";

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
                  {doc.bharatOcr && (
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                      {doc.bharatOcr.pixelonicsVerification.isVerified ? "OCR Verified" : "OCR Scanned"}
                    </Badge>
                  )}
                  <Badge variant={isVerified ? "default" : "outline"} className={isVerified ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}>
                    {isVerified ? "Verified by Pixelonics" : DOCUMENT_STATUS_LABELS[doc.status]}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Inspect File
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* FINAL PANDOSOFT COMPLIANCE REVIEW & DECISION NOTES */}
      <Card>
        <CardHeader>
          <CardTitle>Pandosoft Final Decision &amp; Review Remarks</CardTitle>
          <CardDescription>
            Record final compliance evaluation remarks and execute either approval or rejection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium text-sm">Pandosoft Compliance Review Comments / Justification</p>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add final compliance evaluation comments, AML screening notes, conditions, or rejection rationale..."
              rows={3}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className={
                report.canApprove
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  : "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
              }
              onClick={() => {
                if (report.canApprove) {
                  handleApprove();
                } else {
                  toast.error(
                    "Approval locked: Initial verification must be completed by Pixelonics first.",
                    { description: report.blockingReasons[0] || "Requirements incomplete." }
                  );
                }
              }}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Final Approval &amp; Activate Trading
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleReject()}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Reject Application
            </Button>
            <Button type="button" variant="outline" onClick={handleRequestClarification}>
              <AlertCircle className="mr-1.5 h-4 w-4" />
              Request Clarification from Customer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DOCUMENT VIEWER MODAL IN READ-ONLY MODE (NO INITIAL VERIFICATION IN PANDOSOFT) */}
      <DocumentViewerModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        application={app}
        allDocuments={app.documents}
        onSelectDocument={(doc) => setSelectedDoc(doc)}
        isOfficer={false}
      />
    </div>
  );
}
