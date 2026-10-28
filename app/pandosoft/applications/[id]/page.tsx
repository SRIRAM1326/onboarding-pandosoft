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
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Check } from "lucide-react";
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
  } = useOnboarding();

  const app = getApplication(id);
  const [comments, setComments] = useState(app.decisionReason ?? "");

  const handleApprove = () => {
    const reason = comments.trim() || "Approved by Pandosoft Compliance for corporate trading activation.";
    recordDecision(app.id, "approved", reason);
    addInternalNote(app.id, `Compliance Approved: ${reason}`);
    toast.success(`Application ${app.reference} APPROVED for activation!`);
  };

  const handleReject = () => {
    const reason = comments.trim() || "Rejected during Pandosoft Compliance review.";
    recordDecision(app.id, "rejected", reason);
    addInternalNote(app.id, `Compliance Rejected: ${reason}`);
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
                  <p className="font-medium">Video KYC Status</p>
                  <p className="text-xs text-muted-foreground">
                    {VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}
                    {app.videoKyc.fileName ? ` • ${app.videoKyc.fileName}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    recordVideoKycOutcome(app.id, "completed", "Completed and verified by Pandosoft");
                    toast.success("Marked Video KYC as Completed");
                  }}
                >
                  Mark Video KYC Complete
                </Button>
              </div>
              {app.videoKyc.videoUrl && (
                <div className="overflow-hidden rounded-lg border bg-black">
                  <video
                    controls
                    preload="metadata"
                    src={app.videoKyc.videoUrl}
                    className="aspect-video w-full object-contain"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents ({app.documents.length})</CardTitle>
          <CardDescription>Verify remaining KYC &amp; financial documents</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {app.documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{doc.label}</p>
                <p className="text-xs text-muted-foreground">{doc.fileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                {doc.status !== "verified_demo" && (
                  <Button
                    size="sm"
                    variant="outline"
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
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Final Compliance Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium">Compliance Review Comments / Decision Notes</p>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add compliance review comments, AML screening notes, or conditions..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="bg-success hover:bg-success/90" onClick={handleApprove}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve for Activation
            </Button>
            <Button type="button" variant="outline" onClick={handleRequestClarification}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Request Clarification
            </Button>
            <Button type="button" variant="destructive" onClick={handleReject}>
              <XCircle className="mr-2 h-4 w-4" />
              Reject Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
