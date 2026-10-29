"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  Video,
  XCircle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { validateApplicationForApproval } from "@/lib/utils/verification-rules";
import type { Application, ApplicationDocument, CompliancePolicy } from "@/lib/types";
import { toast } from "sonner";

interface ComplianceVerificationGateProps {
  app: Application;
  policy?: CompliancePolicy;
  onApprove: (reason: string) => void;
  onReject: (reason: string) => void;
  onOpenDocument: (doc: ApplicationDocument) => void;
  onOpenVideoKyc?: () => void;
}

export function ComplianceVerificationGate({
  app,
  policy,
  onApprove,
  onReject,
  onOpenDocument,
  onOpenVideoKyc,
}: ComplianceVerificationGateProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("All required documents and KYC video verified by Compliance Officer.");

  const report = validateApplicationForApproval(app, policy);

  const handleConfirmApprove = () => {
    if (!report.canApprove) {
      toast.error("Cannot approve: All required documents and the KYC video must be verified first.");
      return;
    }
    onApprove(approvalNotes.trim() || "Approved by Compliance Officer");
    setApproveDialogOpen(false);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a specific justification for application rejection.");
      return;
    }
    onReject(rejectionReason.trim());
    setRejectDialogOpen(false);
    setRejectionReason("");
  };

  return (
    <Card className={`border-2 transition-all ${
      report.canApprove
        ? "border-emerald-500/50 bg-emerald-500/5 shadow-sm"
        : "border-amber-500/40 bg-amber-500/5"
    }`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              report.canApprove
                ? "bg-emerald-600 text-white"
                : "bg-amber-500 text-white"
            }`}>
              {report.canApprove ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <ShieldAlert className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  Compliance Verification &amp; Decision Gate
                </CardTitle>
                <Badge className={
                  report.canApprove
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-600 text-white"
                }>
                  {report.canApprove
                    ? "Eligible for Approval"
                    : "Verification Required"}
                </Badge>
              </div>
              <CardDescription className="mt-1">
                {report.canApprove
                  ? "All required KYC documents and the customer's Video KYC have been reviewed and verified by an officer. Onboarding may be completed."
                  : "The officer must verify all uploaded documents and review the customer's KYC video before approving or rejecting this onboarding application."}
              </CardDescription>
            </div>
          </div>

          {/* MAIN DECISION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className={
                report.canApprove
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                  : "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
              }
              onClick={() => {
                if (report.canApprove) {
                  setApproveDialogOpen(true);
                } else {
                  toast.error(
                    "Approval blocked: Verify all required documents and review the KYC video first.",
                    {
                      description: report.blockingReasons[0] || "Requirements incomplete.",
                    }
                  );
                }
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve Application
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={() => setRejectDialogOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Application
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* CHECKLIST ITEMS */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* 1. DOCUMENT VERIFICATION CHECKLIST */}
          <div className={`rounded-xl border p-4 space-y-2.5 bg-card ${
            report.allDocumentsVerified
              ? "border-emerald-500/40"
              : "border-amber-500/40"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {report.allDocumentsVerified ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-semibold text-sm">
                  Required Documents Verification
                </span>
              </div>
              <Badge variant={report.allDocumentsVerified ? "default" : "outline"} className={
                report.allDocumentsVerified ? "bg-emerald-600 text-white" : ""
              }>
                {report.totalVerified} / {report.totalRequired} Verified
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              {report.allDocumentsVerified
                ? "✓ All required entity, signatory, financial and declaration documents are verified."
                : `Officer must inspect and verify the remaining ${
                    report.missingRequiredSlots.length +
                    report.unverifiedRequiredDocs.length +
                    report.unverifiedAdditionalDocs.length
                  } document(s).`}
            </p>

            {/* UNVERIFIED DOCUMENTS SHORTCUT LIST */}
            {(report.unverifiedRequiredDocs.length > 0 ||
              report.unverifiedAdditionalDocs.length > 0) && (
              <div className="space-y-1.5 pt-1 border-t border-border/40">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Documents Pending Officer Verification:
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {[...report.unverifiedRequiredDocs, ...report.unverifiedAdditionalDocs]
                    .slice(0, 5)
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between text-xs rounded-md border bg-muted/20 px-2 py-1.5"
                      >
                        <span className="truncate max-w-[200px] font-medium">
                          {doc.label}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-primary px-2 hover:bg-primary/10"
                          onClick={() => onOpenDocument(doc)}
                        >
                          <FileSearch className="mr-1 h-3 w-3" />
                          Review &amp; Verify
                        </Button>
                      </div>
                    ))}
                  {report.unverifiedRequiredDocs.length +
                    report.unverifiedAdditionalDocs.length >
                    5 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      +{" "}
                      {report.unverifiedRequiredDocs.length +
                        report.unverifiedAdditionalDocs.length -
                        5}{" "}
                      more documents in Documents tab
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. VIDEO KYC VERIFICATION CHECKLIST */}
          <div className={`rounded-xl border p-4 space-y-2.5 bg-card ${
            report.videoKycVerified
              ? "border-emerald-500/40"
              : "border-amber-500/40"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {report.videoKycVerified ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-semibold text-sm">
                  Customer KYC Video Review
                </span>
              </div>
              <Badge variant={report.videoKycVerified ? "default" : "outline"} className={
                report.videoKycVerified ? "bg-emerald-600 text-white" : ""
              }>
                {report.videoKycVerified ? "Verified" : "Pending Officer Review"}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              {report.videoKycVerified
                ? "✓ Customer Video KYC recording has been reviewed, declaration matched, and identity verified."
                : report.videoKycRecorded
                ? "Customer video declaration uploaded. Officer must review video playback and approve."
                : "Customer has not yet recorded or uploaded their Video KYC declaration."}
            </p>

            {onOpenVideoKyc && (
              <div className="pt-1 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={onOpenVideoKyc}
                >
                  <Video className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  {report.videoKycVerified
                    ? "Watch Customer KYC Video"
                    : "Review & Verify Customer KYC Video"}
                  <ArrowRight className="ml-1.5 h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* BLOCKING REASONS WARNING */}
        {!report.canApprove && report.blockingReasons.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
              Onboarding completion is locked until these compliance conditions are met:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
              {report.blockingReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {/* APPROVAL CONFIRMATION DIALOG */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Application Approval</DialogTitle>
            <DialogDescription>
              All {report.totalVerified} required documents and the customer Video KYC have been verified. Approving will activate this corporate trading client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold">Compliance Approval Notes</label>
            <Textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Enter final approval comments or conditions..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmApprove}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm &amp; Complete Onboarding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECTION CONFIRMATION DIALOG */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Onboarding Application</DialogTitle>
            <DialogDescription>
              Specify the compliance or regulatory grounds for rejecting this onboarding application. The customer will be formally notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold">
              Rejection Justification / Reason *
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Failed AML source-of-funds screening, fraudulent documentation, or unverified identity..."
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmReject}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
