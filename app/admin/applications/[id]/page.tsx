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
  BANK_ACCOUNT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
  SOURCE_OF_FUNDS_LABELS,
  VIDEO_KYC_STATUS_LABELS,
  WALLET_STATUS_LABELS,
} from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { ComplianceVerificationGate } from "@/components/verification/compliance-verification-gate";
import { DocumentViewerModal } from "@/components/documents/document-viewer-modal";
import { buildPrefilledVideoKycScript } from "@/components/onboarding/video-kyc-recorder";
import type { ApplicationDocument } from "@/lib/types";
import { isPdfFile, isImageFile } from "@/lib/utils/document-previews";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Eye,
  Video,
  FileText,
  CheckCircle2,
  Database,
  MapPin,
  ExternalLink,
  Camera,
  Building2,
} from "lucide-react";
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
    policy,
    hydrated,
  } = useOnboarding();

  const app = getApplication(id);
  const [activeTab, setActiveTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [corrReason, setCorrReason] = useState("");
  const [showCorr, setShowCorr] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ApplicationDocument | null>(null);
  const [videoNotes, setVideoNotes] = useState(app.videoKyc.outcomeNote || "");

  if (!hydrated) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-md bg-secondary" />
          <div className="h-4 w-80 rounded-md bg-secondary/70" />
        </div>
        <div className="h-64 w-full rounded-xl border bg-card" />
      </div>
    );
  }

  const handleApprove = (reason: string) => {
    recordDecision(app.id, "approved", reason);
    addInternalNote(app.id, `Compliance Approved: ${reason}`);
    toast.success(`Application ${app.reference} APPROVED and activated!`);
  };

  const handleReject = (reason: string) => {
    recordDecision(app.id, "rejected", reason);
    addInternalNote(app.id, `Compliance Rejected: ${reason}`);
    toast.error(`Application ${app.reference} marked as REJECTED.`);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
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

      {/* REGULATORY COMPLIANCE GATE & VERIFICATION BANNER */}
      <ComplianceVerificationGate
        app={app}
        policy={policy}
        onApprove={handleApprove}
        onReject={handleReject}
        onOpenDocument={(doc) => setSelectedDoc(doc)}
        onOpenVideoKyc={() => setActiveTab("video-kyc")}
      />

      {/* QUICK ACTIONS BAR */}
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
          onClick={() => setActiveTab("video-kyc")}
        >
          <Video className="mr-2 h-4 w-4" />
          Review Video KYC
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

      {/* MAIN TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({app.documents.length})
          </TabsTrigger>
          <TabsTrigger value="video-kyc">
            Video KYC
            {app.videoKyc.status === "completed" ? (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px] bg-emerald-600 text-white">
                ✓
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[10px]">
                Pending
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="ubo">UBO ({app.beneficialOwners.length})</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="wallets">Wallets ({app.wallets.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({app.auditTrail.length})</TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
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

        {/* 2. DOCUMENTS TAB (VIEW & REVIEW ANY FORMAT) */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Uploaded Documents ({app.documents.length})</CardTitle>
                  <CardDescription>
                    The officer must view and review all documents (PDFs, Images, Word, and other formats) before approving or rejecting
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
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors hover:border-primary/40 bg-card"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border text-muted-foreground">
                        {isPdf ? (
                          <span className="text-[10px] font-bold text-rose-600">PDF</span>
                        ) : isImage ? (
                          <span className="text-[10px] font-bold text-sky-600">IMG</span>
                        ) : (
                          <FileText className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {doc.label}
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
                          reviewDocument(app.id, doc.id, "verified_demo", "Verified by Officer");
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
                          reviewDocument(app.id, doc.id, "replacement_required", "Please re-upload a clearer copy");
                          toast.warning(`Flagged ${doc.label} for replacement`);
                        }}
                      >
                        Flag Replace
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. VIDEO KYC TAB */}
        <TabsContent value="video-kyc" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Customer Video KYC Review</CardTitle>
                  <CardDescription>
                    Review customer recording, check spoken declaration against compliance script, and verify
                  </CardDescription>
                </div>
                <Badge variant={app.videoKyc.status === "completed" ? "default" : "outline"} className={
                  app.videoKyc.status === "completed" ? "bg-emerald-600 text-white" : ""
                }>
                  {VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* DIRECTORS & UBOS COVERED BY THIS MASTER KYC */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-xs uppercase tracking-wider text-foreground">
                    Directors &amp; Beneficial Owners (UBOs) Covered Under This Master Video KYC
                  </span>
                  <Badge variant="outline" className="text-xs bg-background">
                    Single Session • Completed by Authorized Signatory ({app.signatory.fullName || "Signatory"})
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-lg border bg-background p-3 space-y-1.5 shadow-2xs">
                    <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                      Board of Directors ({(app.directors || []).length})
                    </p>
                    {(app.directors || []).length > 0 ? (
                      <ul className="space-y-1.5">
                        {(app.directors || []).map((dir) => (
                          <li key={dir.id} className="flex items-center justify-between font-medium text-foreground">
                            <span>{dir.fullName}</span>
                            <span className="text-[11px] text-muted-foreground">
                              ({dir.designation}{dir.identificationNumber ? ` • DIN: ${dir.identificationNumber}` : ""})
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground italic">Listed under company registration</p>
                    )}
                  </div>

                  <div className="rounded-lg border bg-background p-3 space-y-1.5 shadow-2xs">
                    <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                      Ultimate Beneficial Owners ({(app.beneficialOwners || []).length})
                    </p>
                    {(app.beneficialOwners || []).length > 0 ? (
                      <ul className="space-y-1.5">
                        {(app.beneficialOwners || []).map((ubo) => (
                          <li key={ubo.id} className="flex items-center justify-between font-medium text-foreground">
                            <span>{ubo.fullName}</span>
                            <span className="text-[11px] text-muted-foreground">
                              ({ubo.ownershipPercentage}% Ownership • {ubo.role})
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground italic">Listed under beneficial ownership</p>
                    )}
                  </div>
                </div>
              </div>

              {/* VIDEO PLAYER & SCRIPT COMPARISON */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* VIDEO PLAYER */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-primary" />
                      Recorded Video Playback
                    </p>
                    {app.videoKyc.videoUrl && (
                      <Badge className="bg-emerald-600 text-white text-[11px]">
                        <Database className="mr-1 h-3 w-3" />
                        Saved in DB
                      </Badge>
                    )}
                  </div>

                  {app.videoKyc.videoUrl ? (
                    <div className="overflow-hidden rounded-xl border bg-black shadow-inner aspect-video flex items-center justify-center">
                      <video
                        controls
                        preload="metadata"
                        src={app.videoKyc.videoUrl}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-8 text-center bg-muted/20 space-y-3 aspect-video flex flex-col items-center justify-center">
                      <Video className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">No Customer Video Uploaded Yet</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                          Customer must complete and upload their Video KYC declaration from the customer portal.
                        </p>
                      </div>
                    </div>
                  )}

                  {app.videoKyc.fileName && (
                    <p className="text-xs text-muted-foreground">
                      File: <span className="font-mono text-foreground">{app.videoKyc.fileName}</span>
                      {app.videoKyc.uploadedAt ? ` • Uploaded ${new Date(app.videoKyc.uploadedAt).toLocaleString()}` : ""}
                    </p>
                  )}
                </div>

                {/* SCRIPT CHECK */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Mandatory Spoken Script Comparison</p>
                  <div className="rounded-xl border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-line space-y-2 max-h-[300px] overflow-y-auto">
                    <p className="font-semibold text-foreground">Expected Declaration:</p>
                    <p>{app.videoKyc.spokenScript || buildPrefilledVideoKycScript(app)}</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold">Officer Video Review Notes</label>
                    <Textarea
                      placeholder="Add observations, audio/video clarity confirmation, or identity match notes..."
                      value={videoNotes}
                      onChange={(e) => setVideoNotes(e.target.value)}
                      rows={3}
                      className="text-xs"
                    />
                  </div>

                  {/* VIDEO ACTION BUTTONS */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      onClick={() => {
                        recordVideoKycOutcome(
                          app.id,
                          "completed",
                          videoNotes.trim() || "Video KYC reviewed and identity verified by Officer"
                        );
                        toast.success("Video KYC marked as VERIFIED and Completed!");
                      }}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Mark Video KYC Verified
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-amber-600 border-amber-300 hover:bg-amber-50"
                      onClick={() => {
                        recordVideoKycOutcome(
                          app.id,
                          "action_required",
                          videoNotes.trim() || "Please re-record Video KYC with clear audio reading full declaration script."
                        );
                        toast.warning("Requested customer to re-record Video KYC");
                      }}
                    >
                      Request Re-recording
                    </Button>
                  </div>
                </div>
              </div>

              {/* DIRECTORS VERIFICATION PANEL */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Directors Geo-Tagged Photos (GPS Map Camera) ({(app.directors || []).length})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Inspect uploaded GPS Map Camera photos, stamped coordinates, timestamp, and face photo for each Board Director.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {(app.directors || []).map((dir) => (
                    <div key={dir.id} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{dir.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {dir.designation} • DIN: {dir.identificationNumber || "N/A"}
                          </p>
                        </div>
                        <Badge variant={dir.selfie ? "default" : "outline"} className={dir.selfie ? "bg-emerald-600 text-white text-[11px]" : ""}>
                          {dir.selfie ? "Photo Uploaded" : "Photo Pending"}
                        </Badge>
                      </div>

                      {/* Photo & Geo info */}
                      {dir.selfie ? (
                        <div className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
                          <img
                            src={dir.selfie.photoUrl}
                            alt={dir.fullName}
                            className="h-20 w-16 rounded-md object-cover border shrink-0 bg-slate-900 cursor-pointer"
                            onClick={() => window.open(dir.selfie?.photoUrl, "_blank")}
                          />
                          <div className="text-xs space-y-1">
                            <p className="font-medium flex items-center gap-1 text-primary">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {dir.selfie.geoLocation
                                ? `${dir.selfie.geoLocation.latitude}° N, ${dir.selfie.geoLocation.longitude}° E`
                                : "GPS Coordinates Attached"}
                            </p>
                            {dir.selfie.geoLocation?.addressString && (
                              <p className="text-[11px] text-muted-foreground">
                                {dir.selfie.geoLocation.addressString}
                              </p>
                            )}
                            {dir.selfie.geoLocation && (
                              <a
                                href={`https://www.google.com/maps?q=${dir.selfie.geoLocation.latitude},${dir.selfie.geoLocation.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium"
                              >
                                View on Google Maps
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600 italic">No photo uploaded yet</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* UBO VERIFICATION PANEL */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Beneficial Owners (UBO) Geo-Tagged Photos (GPS Map Camera) ({(app.beneficialOwners || []).length})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Inspect uploaded GPS Map Camera photos, stamped coordinates, timestamp, and face photo for each UBO.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {(app.beneficialOwners || []).map((ubo) => (
                    <div key={ubo.id} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{ubo.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {ubo.ownershipPercentage}% Ownership • {ubo.role} • PAN: {ubo.pan}
                          </p>
                        </div>
                        <Badge variant={ubo.selfie ? "default" : "outline"} className={ubo.selfie ? "bg-emerald-600 text-white text-[11px]" : ""}>
                          {ubo.selfie ? "Photo Uploaded" : "Photo Pending"}
                        </Badge>
                      </div>

                      {/* Photo & Geo info */}
                      {ubo.selfie ? (
                        <div className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
                          <img
                            src={ubo.selfie.photoUrl}
                            alt={ubo.fullName}
                            className="h-20 w-16 rounded-md object-cover border shrink-0 bg-slate-900 cursor-pointer"
                            onClick={() => window.open(ubo.selfie?.photoUrl, "_blank")}
                          />
                          <div className="text-xs space-y-1">
                            <p className="font-medium flex items-center gap-1 text-primary">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {ubo.selfie.geoLocation
                                ? `${ubo.selfie.geoLocation.latitude}° N, ${ubo.selfie.geoLocation.longitude}° E`
                                : "GPS Coordinates Attached"}
                            </p>
                            {ubo.selfie.geoLocation?.addressString && (
                              <p className="text-[11px] text-muted-foreground">
                                {ubo.selfie.geoLocation.addressString}
                              </p>
                            )}
                            {ubo.selfie.geoLocation && (
                              <a
                                href={`https://www.google.com/maps?q=${ubo.selfie.geoLocation.latitude},${ubo.selfie.geoLocation.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium"
                              >
                                View on Google Maps
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600 italic">No photo uploaded yet</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. BUSINESS TAB */}
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

        {/* 5. UBO TAB */}
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

        {/* 6. FINANCIAL TAB */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Financial &amp; Bank Accounts Profile
                  </CardTitle>
                  <CardDescription>
                    Corporate banking facilities and corresponding verified supporting documents
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {((app.financial.bankAccounts && app.financial.bankAccounts.length > 0)
                    ? app.financial.bankAccounts
                    : [app.financial.bankAccount]
                  ).length} Bank Account(s)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* LIST OF BANK ACCOUNTS */}
              <div className="space-y-4">
                {((app.financial.bankAccounts && app.financial.bankAccounts.length > 0)
                  ? app.financial.bankAccounts
                  : [{ ...app.financial.bankAccount, id: app.financial.bankAccount.id || "bank-1", isPrimary: true }]
                ).map((bank, idx) => {
                  const bankId = bank.id || `bank-${idx + 1}`;
                  const bankDocs = app.documents.filter(
                    (d) => d.section === "financial" && (d.ownerRef === bankId || (!d.ownerRef && idx === 0))
                  );

                  return (
                    <div key={bankId} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {bank.bankName || `Bank Account ${idx + 1}`}
                            </span>
                            {bank.isPrimary && (
                              <Badge className="bg-primary text-primary-foreground text-[10px]">
                                Primary Account
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              {bank.accountType ? BANK_ACCOUNT_TYPE_LABELS[bank.accountType] : "Current"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Account Holder: <span className="font-medium text-foreground">{bank.accountHolderName || app.business.legalName}</span>
                          </p>
                        </div>
                        <div className="text-xs font-mono text-right">
                          <p className="font-medium">{bank.accountNumber}</p>
                          <p className="text-[11px] text-muted-foreground">IFSC: {bank.ifsc}</p>
                        </div>
                      </div>

                      {/* Supporting Documents for this Bank */}
                      <div className="space-y-2 pt-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Supporting Bank Documents ({bankDocs.length} uploaded):
                        </p>
                        {bankDocs.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {bankDocs.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between rounded-lg border bg-background p-2.5 text-xs shadow-2xs"
                              >
                                <div className="space-y-0.5 min-w-0 pr-2">
                                  <p className="font-medium truncate">{doc.label}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {doc.fileName}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge variant="outline" className="text-[10px]">
                                    {DOCUMENT_STATUS_LABELS[doc.status]}
                                  </Badge>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setSelectedDoc(doc)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-amber-600 italic">No supporting documents uploaded for this account</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SOURCE OF FUNDS SUMMARY */}
              <div className="rounded-xl border bg-background p-4 space-y-2 text-sm">
                <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Source of Funds &amp; Activity
                </p>
                <div className="flex justify-between border-b pb-1.5 text-xs">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">
                    {app.financial.sourceOfFundsCategory
                      ? SOURCE_OF_FUNDS_LABELS[app.financial.sourceOfFundsCategory]
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1.5 text-xs">
                  <span className="text-muted-foreground">Expected Volume</span>
                  <span>{app.financial.expectedVolumeRange} ({app.financial.expectedFrequency})</span>
                </div>
                {app.financial.sourceOfFundsExplanation && (
                  <div className="pt-1 text-xs">
                    <span className="text-muted-foreground">Explanation:</span>
                    <p className="text-muted-foreground mt-0.5">{app.financial.sourceOfFundsExplanation}</p>
                  </div>
                )}
                {app.financial.tradingActivityDescription && (
                  <div className="pt-1 text-xs">
                    <span className="text-muted-foreground">Trading Activity:</span>
                    <p className="text-muted-foreground mt-0.5">{app.financial.tradingActivityDescription}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. WALLETS TAB */}
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

        {/* 8. TIMELINE TAB */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {app.auditTrail.map((event, idx) => (
                  <div key={`${event.id}-${idx}`} className="flex gap-4 border-l-2 border-primary/30 pl-4">
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
