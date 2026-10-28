"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import {
  DOCUMENT_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
  SOURCE_OF_FUNDS_LABELS,
  VIDEO_KYC_STATUS_LABELS,
  WALLET_STATUS_LABELS,
} from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";

export default function AdminApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getApplication,
    recordDecision,
    requestCorrection,
    assignReviewer,
    recordVideoKycOutcome,
    recordWalletVerification,
    reviewDocument,
    addInternalNote,
  } = useOnboarding();

  const app = getApplication(id);
  const [noteText, setNoteText] = useState("");
  const [corrReason, setCorrReason] = useState("");
  const [showCorr, setShowCorr] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Review Application {app.reference}
          </h1>
          <p className="text-muted-foreground">{app.business.legalName}</p>
        </div>
        <div className="flex items-center gap-2">
          <ApplicationStatusBadge status={app.status} />
          <Button variant="outline" asChild>
            <Link href="/admin/applications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setShowCorr((v) => !v)}>
          <AlertCircle className="mr-2 h-4 w-4" />
          Request Corrections
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const nextReviewer =
              app.assignedReviewerId === "usr-pan-rev-1" ? "usr-rev-1" : "usr-pan-rev-1";
            assignReviewer(app.id, nextReviewer);
            toast.success("Updated assigned reviewer");
          }}
        >
          Switch Assigned Reviewer
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            recordVideoKycOutcome(app.id, "completed", "Video KYC completed & verified");
            toast.success("Recorded Video KYC outcome: Completed");
          }}
        >
          Record Video KYC Outcome
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const firstWallet = app.wallets[0];
            if (firstWallet) {
              recordWalletVerification(app.id, firstWallet.id, "verified_demo", "Verified by Admin");
              toast.success(`Verified wallet ${firstWallet.label}`);
            }
          }}
        >
          Record Wallet Verification
        </Button>
        <Button
          type="button"
          className="bg-success hover:bg-success/90"
          onClick={() => {
            recordDecision(app.id, "approved", "Approved by Head of Compliance");
            toast.success(`Application ${app.reference} APPROVED!`);
          }}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve Application
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            recordDecision(app.id, "rejected", "Rejected by Compliance");
            toast.error(`Application ${app.reference} REJECTED`);
          }}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject Application
        </Button>
      </div>

      {showCorr && (
        <Card className="border-warning/40">
          <CardHeader>
            <CardTitle>Request Customer Correction</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={corrReason}
              onChange={(e) => setCorrReason(e.target.value)}
              placeholder="Enter correction reason & instructions..."
            />
            <Button
              type="button"
              onClick={() => {
                if (!corrReason.trim()) return;
                requestCorrection(app.id, {
                  category: "missing_information",
                  sections: ["business"],
                  reason: corrReason.trim(),
                  instructions: corrReason.trim(),
                });
                setCorrReason("");
                setShowCorr(false);
                toast.success("Correction requested");
              }}
            >
              Send Request
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="documents">Documents ({app.documents.length})</TabsTrigger>
          <TabsTrigger value="ubo">UBO ({app.beneficialOwners.length})</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="wallets">Wallets ({app.wallets.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({app.auditTrail.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <ApplicationStatusBadge status={app.status} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">
                  {app.submittedAt ? new Date(app.submittedAt).toLocaleString() : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned Reviewer</p>
                <p className="font-medium">
                  {app.assignedReviewerId === "usr-pan-rev-1" ? "Sneha Iyer (Pandosoft)" : "Neha Kulkarni (Pixelonics)"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Video KYC</p>
                <p className="font-medium">{VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Documents Verified</p>
                <p className="font-medium">
                  {app.documents.filter((d) => d.status === "verified_demo").length}/{app.documents.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-medium">{app.reference}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Compliance Notes ({app.internalNotes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add an internal compliance note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-10"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (!noteText.trim()) return;
                    addInternalNote(app.id, noteText.trim());
                    setNoteText("");
                    toast.success("Internal note added");
                  }}
                >
                  Add Note
                </Button>
              </div>
              {app.internalNotes.map((n) => (
                <div key={n.id} className="rounded-lg border p-3 text-sm">
                  <p>{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.author.name} • {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile &amp; Signatory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Legal Name</span>
                <span className="font-medium">{app.business.legalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entity Type</span>
                <span>{app.business.entityType ? ENTITY_TYPE_LABELS[app.business.entityType] : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PAN</span>
                <span>{app.business.pan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CIN / Registration No</span>
                <span>{app.business.registrationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GSTIN</span>
                <span>{app.business.gstin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Authorized Signatory</span>
                <span>
                  {app.signatory.fullName} ({app.signatory.designation}) — {app.signatory.email}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents ({app.documents.length})</CardTitle>
              <CardDescription>Review and verify uploaded documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {app.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{doc.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.fileName} • v{doc.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        reviewDocument(app.id, doc.id, "verified_demo", "Verified by Compliance");
                        toast.success(`Verified ${doc.label}`);
                      }}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => {
                        reviewDocument(app.id, doc.id, "replacement_required", "Replacement requested");
                        toast.warning(`Flagged ${doc.label}`);
                      }}
                    >
                      Reject / Replace
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ubo">
          <Card>
            <CardHeader>
              <CardTitle>Beneficial Owners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {app.beneficialOwners.map((ubo) => (
                <div key={ubo.id} className="rounded-lg border p-3">
                  <p className="font-medium">{ubo.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {ubo.ownershipPercentage}% ownership • {ubo.role} • PAN: {ubo.pan} • Evidence:{" "}
                    {ubo.ownershipEvidence}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial &amp; Source of Funds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Name</span>
                <span className="font-medium">{app.financial.bankAccount.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number / IFSC</span>
                <span>
                  {app.financial.bankAccount.accountNumber} / {app.financial.bankAccount.ifsc}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source of Funds</span>
                <span>
                  {app.financial.sourceOfFundsCategory
                    ? SOURCE_OF_FUNDS_LABELS[app.financial.sourceOfFundsCategory]
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Volume</span>
                <span>{app.financial.expectedVolumeRange}</span>
              </div>
              <div className="pt-2">
                <p className="text-muted-foreground">{app.financial.sourceOfFundsExplanation}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Crypto Wallets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {app.wallets.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">
                      {w.label} ({w.network})
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{w.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{WALLET_STATUS_LABELS[w.verificationStatus]}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        recordWalletVerification(app.id, w.id, "verified_demo", "Verified");
                        toast.success(`Verified wallet ${w.label}`);
                      }}
                    >
                      Verify Wallet
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {app.auditTrail.map((event) => (
                  <div key={event.id} className="flex gap-4 border-l-2 border-primary/30 pl-4">
                    <div className="flex-1">
                      <p className="font-medium">{event.label}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()} • {event.actor.name} (
                        {event.actor.role})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
