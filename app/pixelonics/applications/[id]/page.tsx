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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DOCUMENT_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
  VIDEO_KYC_STATUS_LABELS,
  WALLET_STATUS_LABELS,
} from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { DocumentViewerModal } from "@/components/documents/document-viewer-modal";
import { isPdfFile, isImageFile } from "@/lib/utils/document-previews";
import { validateApplicationForPixelonicsForwarding } from "@/lib/utils/verification-rules";
import type { ApplicationDocument } from "@/lib/types";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Check,
  X,
  Eye,
  FileText,
  Send,
  Video,
  ShieldCheck,
  Building,
  UserCheck,
  CreditCard,
  Wallet as WalletIcon,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function PixelonicsApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getApplication,
    opsChecklists,
    toggleOpsChecklist,
    reviewDocument,
    requestCorrection,
    recordWalletVerification,
    recordVideoKycOutcome,
    forwardToPandosoft,
    policy,
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

  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardNotes, setForwardNotes] = useState(
    "All uploaded customer documents, business details, wallets, and Video KYC have been reviewed and verified by the Pixelonics Operations team. Forwarded to Pandosoft for final review and approval."
  );

  const forwardingReport = validateApplicationForPixelonicsForwarding(app, policy);
  const isAlreadyForwarded =
    app.status === "ready_for_compliance" ||
    Boolean(app.forwardedToPandosoftAt) ||
    app.status === "approved" ||
    app.status === "rejected";

  const handleForwardToPandosoft = () => {
    forwardToPandosoft(app.id, forwardNotes.trim());
    setForwardDialogOpen(false);
    toast.success(`Application ${app.reference} verified and forwarded to Pandosoft team!`);
  };

  const handleVerifyAllDocuments = () => {
    let count = 0;
    app.documents.forEach((doc) => {
      if (doc.status !== "verified_demo") {
        reviewDocument(app.id, doc.id, "verified_demo", "Verified by Pixelonics Operations");
        count++;
      }
    });
    if (count > 0) {
      toast.success(`Verified ${count} document(s) by Pixelonics Operations`);
    } else {
      toast.info("All documents are already verified");
    }
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
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Pixelonics Verification Hub — {app.reference}
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Initial Verification Team
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {app.business.legalName} • Review and verify all uploaded documents and customer details before forwarding to Pandosoft
          </p>
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

      {/* WORKFLOW STATUS BANNER */}
      {isAlreadyForwarded ? (
        <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">
                Verified &amp; Forwarded to Pandosoft Team
              </p>
              <p className="text-xs text-muted-foreground">
                Initial document and detail verification was completed by Pixelonics. Forwarded to Pandosoft for final compliance review and either approval or rejection.
              </p>
              {app.opsReviewNotes && (
                <p className="text-xs italic text-indigo-700 dark:text-indigo-300 mt-1">
                  &ldquo;{app.opsReviewNotes}&rdquo;
                </p>
              )}
            </div>
          </div>
          <Badge className="bg-indigo-600 text-white">
            {app.status === "approved"
              ? "Approved by Pandosoft"
              : app.status === "rejected"
              ? "Rejected by Pandosoft"
              : "Awaiting Pandosoft Final Decision"}
          </Badge>
        </div>
      ) : (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">
                Pixelonics Initial Verification in Progress
              </p>
              <p className="text-xs text-muted-foreground">
                Review all documents and details uploaded by the customer. Once complete, click &ldquo;Forward Verified Information to Pandosoft&rdquo;. Pandosoft will then perform the final review to approve or reject.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={() => setForwardDialogOpen(true)}
            >
              <Send className="mr-1.5 h-4 w-4" />
              Forward Verified Information to Pandosoft
            </Button>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS BAR */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCorrectionForm((v) => !v)}
        >
          <AlertCircle className="mr-1.5 h-4 w-4 text-amber-500" />
          Request Corrections from Customer
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleVerifyAllDocuments}
        >
          <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
          Verify All Remaining Documents
        </Button>
        {!isAlreadyForwarded && (
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white ml-auto"
            onClick={() => setForwardDialogOpen(true)}
          >
            <Send className="mr-1.5 h-4 w-4" />
            Forward to Pandosoft Team
          </Button>
        )}
      </div>

      {/* CORRECTION REQUEST DRAWER */}
      {showCorrectionForm && (
        <Card className="border-warning/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Raise Correction Request</CardTitle>
            <CardDescription>
              Customer will be notified to correct or re-upload the requested information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCorrection} className="space-y-4">
              <div className="space-y-2">
                <Label>Correction Reason *</Label>
                <Input
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  placeholder="e.g. Please re-upload a clear copy of Certificate of Incorporation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Detailed Instructions for Customer *</Label>
                <Textarea
                  value={corrInstructions}
                  onChange={(e) => setCorrInstructions(e.target.value)}
                  placeholder="Specify exactly what needs to be fixed..."
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

      {/* VERIFICATION SUMMARY TILES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Documents Verified</p>
              <p className="text-xl font-semibold">
                {forwardingReport.totalVerified} / {forwardingReport.totalUploaded}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {forwardingReport.allDocumentsVerified ? "✓ All documents verified" : "Pending verification"}
              </p>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${forwardingReport.allDocumentsVerified ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Entity Details</p>
              <p className="text-xl font-semibold">{app.business.pan ? "Checked" : "Pending"}</p>
              <p className="text-[11px] text-muted-foreground">{app.business.pan} • {app.business.registrationNumber || "CIN verified"}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Building className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Wallets Verified</p>
              <p className="text-xl font-semibold">
                {app.wallets.filter((w) => w.verificationStatus === "verified_demo" || (w.verificationStatus as string) === "verified").length} / {app.wallets.length}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {forwardingReport.walletsVerified ? "✓ All wallets verified" : "Pending verification"}
              </p>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${forwardingReport.walletsVerified ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
              <WalletIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Video KYC</p>
              <p className="text-xl font-semibold">
                {app.videoKyc.status === "completed" ? "Verified" : "Pending"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}
              </p>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${app.videoKyc.status === "completed" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
              <Video className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: CUSTOMER DETAILS REVIEW & VERIFICATION */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Business & Entity Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                Customer Entity Profile
              </CardTitle>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                Pixelonics Verified
              </Badge>
            </div>
            <CardDescription>Cross-check entity registrations and business details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Legal Name</span>
              <span className="font-medium text-foreground">{app.business.legalName}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Entity Type</span>
              <span>{ENTITY_TYPE_LABELS[app.business.entityType as keyof typeof ENTITY_TYPE_LABELS] || app.business.entityType}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">PAN</span>
              <span className="font-mono">{app.business.pan || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">CIN / Registration</span>
              <span className="font-mono">{app.business.registrationNumber || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">GSTIN</span>
              <span className="font-mono">{app.business.gstin || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Email / Phone</span>
              <span>{app.business.email} • {app.business.phone}</span>
            </div>
            <div className="pt-1">
              <p className="text-xs text-muted-foreground">Registered Address:</p>
              <p className="text-xs font-medium">
                {app.business.registeredAddress.line1}, {app.business.registeredAddress.city},{" "}
                {app.business.registeredAddress.state} - {app.business.registeredAddress.postalCode}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Signatory & Beneficial Owners */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Signatory &amp; Beneficial Owners
              </CardTitle>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                Pixelonics Verified
              </Badge>
            </div>
            <CardDescription>Verified signatory authority &amp; UBO ownership structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border p-2.5 bg-muted/20">
              <div className="flex justify-between items-center">
                <span className="font-medium text-xs">Authorized Signatory</span>
                <Badge variant="outline" className="text-[10px]">Primary</Badge>
              </div>
              <p className="font-medium mt-1">{app.signatory.fullName} ({app.signatory.designation})</p>
              <p className="text-xs text-muted-foreground">
                PAN: <span className="font-mono">{app.signatory.pan}</span> • ID: {app.signatory.idDocumentNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                Email: {app.signatory.email} • Mobile: {app.signatory.mobile}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                Declared Beneficial Owners (UBOs):
              </p>
              <div className="space-y-1.5">
                {app.beneficialOwners.map((ubo) => (
                  <div key={ubo.id} className="flex items-center justify-between border rounded p-2 text-xs">
                    <div>
                      <p className="font-medium">{ubo.fullName} ({ubo.role})</p>
                      <p className="text-muted-foreground">PAN: {ubo.pan} • Proof: {ubo.ownershipEvidence}</p>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      {ubo.ownershipPercentage}% Ownership
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial & Banking Profile */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Financial &amp; Banking Profile
              </CardTitle>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                Pixelonics Verified
              </Badge>
            </div>
            <CardDescription>Customer banking credentials &amp; source of funds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Bank Name</span>
              <span className="font-medium">{app.financial.bankAccount.bankName}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Account Holder</span>
              <span>{app.financial.bankAccount.accountHolderName}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Account / IFSC</span>
              <span className="font-mono">
                {app.financial.bankAccount.accountNumber} / {app.financial.bankAccount.ifsc}
              </span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Expected Volume</span>
              <span>{app.financial.expectedVolumeRange} ({app.financial.expectedFrequency})</span>
            </div>
            <div className="pt-1">
              <span className="text-xs text-muted-foreground">Source of Funds Explanation:</span>
              <p className="text-xs font-medium mt-0.5">{app.financial.sourceOfFundsExplanation}</p>
            </div>
          </CardContent>
        </Card>

        {/* Wallets & Video KYC Verification by Pixelonics */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <WalletIcon className="h-4 w-4 text-primary" />
                Wallets &amp; Video KYC Verification
              </CardTitle>
              <Badge variant="outline" className="text-primary border-primary/30">
                Pixelonics Review
              </Badge>
            </div>
            <CardDescription>Pixelonics team verifies customer crypto wallets &amp; KYC video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {/* Wallets List with Verification Button */}
            {app.wallets.map((w) => {
              const isVerified = w.verificationStatus === "verified_demo" || (w.verificationStatus as string) === "verified";
              return (
                <div key={w.id} className="rounded-lg border p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs">
                      {w.label} ({w.network.toUpperCase()})
                    </span>
                    <Badge variant={isVerified ? "default" : "outline"} className={isVerified ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}>
                      {isVerified ? "Verified by Pixelonics" : WALLET_STATUS_LABELS[w.verificationStatus]}
                    </Badge>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">{w.address}</p>
                  {!isVerified && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-emerald-600 border-emerald-300"
                      onClick={() => {
                        recordWalletVerification(app.id, w.id, "verified_demo", "Verified by Pixelonics Operations");
                        toast.success(`Verified wallet ${w.label} by Pixelonics Operations`);
                      }}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Verify Wallet
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Video KYC with Verification Button */}
            <div className="rounded-lg border p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-xs flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 text-primary" />
                    Customer KYC Video Declaration
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}
                    {app.videoKyc.fileName ? ` • ${app.videoKyc.fileName}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 text-xs ${app.videoKyc.status === "completed" ? "border-emerald-500 text-emerald-600" : ""}`}
                  onClick={() => {
                    recordVideoKycOutcome(app.id, "completed", "Verified by Pixelonics Operations");
                    toast.success("Customer Video KYC verified by Pixelonics Operations");
                  }}
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {app.videoKyc.status === "completed" ? "Verified" : "Verify Video KYC"}
                </Button>
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
                  Video declaration uploaded &amp; recorded by customer.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: ALL CUSTOMER UPLOADED DOCUMENTS VERIFICATION */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Customer Uploaded Documents ({app.documents.length})</CardTitle>
              <CardDescription>
                Pixelonics team reviews and verifies all uploaded files (PDFs, Images, and Word formats)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={forwardingReport.allDocumentsVerified ? "border-emerald-500 text-emerald-600" : ""}>
                {forwardingReport.totalVerified} of {forwardingReport.totalUploaded} Verified
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleVerifyAllDocuments}
              >
                <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                Verify All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {app.documents.map((doc) => {
            const isPdf = isPdfFile(doc.fileName, doc.mimeType);
            const isImage = isImageFile(doc.fileName, doc.mimeType);
            const isVerified = doc.status === "verified_demo";

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
                      {doc.reviewerNotes ? ` • Note: ${doc.reviewerNotes}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={isVerified ? "default" : "outline"} className={isVerified ? "bg-emerald-600 text-white" : ""}>
                    {isVerified ? "Verified by Pixelonics" : DOCUMENT_STATUS_LABELS[doc.status]}
                  </Badge>
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
                  {!isVerified && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                      onClick={() => {
                        reviewDocument(app.id, doc.id, "verified_demo", "Verified by Pixelonics Operations");
                        toast.success(`Verified ${doc.label}`);
                      }}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Verify
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-destructive hover:bg-destructive/10"
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

      {/* SECTION 3: OPERATIONS VERIFICATION CHECKLIST */}
      <Card>
        <CardHeader>
          <CardTitle>Pixelonics Verification Checklist</CardTitle>
          <CardDescription>Confirm initial verification completion before forwarding to Pandosoft</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "completeness", label: "Application completeness, entity profile & PAN/GSTIN verified" },
            { key: "documentsUploaded", label: "All customer entity, signatory, UBO & bank documents verified" },
            { key: "signedAndStamped", label: "Board resolution & customer declarations verified" },
            { key: "readyForCompliance", label: "Verified package ready to forward to Pandosoft team for final decision" },
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
              <Badge variant={checklist[item.key] ? "default" : "outline"} className={checklist[item.key] ? "bg-emerald-600 text-white" : ""}>
                {checklist[item.key] ? "Verified" : "Pending"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* FORWARD TO PANDOSOFT DIALOG */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-600" />
              Forward Verified Information to Pandosoft
            </DialogTitle>
            <DialogDescription>
              Pixelonics team has reviewed and verified the customer&apos;s documents and details. Pandosoft team will perform the final review and either approve or reject the application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Application:</span>
                <span className="font-semibold">{app.reference} — {app.business.legalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documents Verified:</span>
                <span className="font-semibold text-emerald-600">{forwardingReport.totalVerified} of {forwardingReport.totalUploaded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallets Verified:</span>
                <span className="font-semibold text-emerald-600">{forwardingReport.walletsVerified ? "All Verified" : "Pending"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Video KYC:</span>
                <span className="font-semibold text-emerald-600">{forwardingReport.videoKycVerified ? "Verified" : "Pending"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Pixelonics Handover &amp; Verification Remarks</Label>
              <Textarea
                rows={4}
                value={forwardNotes}
                onChange={(e) => setForwardNotes(e.target.value)}
                placeholder="Enter remarks for the Pandosoft team regarding document checks, AML screening, or observations..."
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={handleForwardToPandosoft}
            >
              <Send className="mr-1.5 h-4 w-4" />
              Confirm &amp; Forward to Pandosoft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        application={app}
        allDocuments={app.documents}
        onSelectDocument={(doc) => setSelectedDoc(doc)}
        onVerify={(docId, notes) => {
          reviewDocument(app.id, docId, "verified_demo", notes || "Verified by Pixelonics Operations");
          toast.success("Document verified by Pixelonics");
        }}
        onReject={(docId, notes) => {
          reviewDocument(app.id, docId, "replacement_required", notes);
        }}
      />
    </div>
  );
}
