"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import {
  DOCUMENT_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
  SECTION_LABELS,
  VIDEO_KYC_STATUS_LABELS,
  WALLET_STATUS_LABELS,
} from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { ArrowLeft, Edit, Download, AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getApplication, respondToCorrection, hydrated } = useOnboarding();
  const app = getApplication(id);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const handleReply = (corrId: string) => {
    const msg = replyText[corrId]?.trim();
    if (!msg) {
      toast.error("Please enter a response message");
      return;
    }
    respondToCorrection(app.id, corrId, msg);
    setReplyText((prev) => ({ ...prev, [corrId]: "" }));
    toast.success("Correction response submitted to compliance");
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Application {app.reference}</h1>
          <p className="text-muted-foreground">{app.business.legalName || "Draft Corporate Application"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ApplicationStatusBadge status={app.status} />
          <Button variant="outline" asChild>
            <Link href={`/portal/applications/${app.id}/documents-generation`}>
              <Download className="mr-2 h-4 w-4" />
              Declarations &amp; Templates
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/portal">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portal
            </Link>
          </Button>
        </div>
      </div>

      {app.corrections.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Compliance Correction Requests ({app.corrections.length})
            </CardTitle>
            <CardDescription>
              Respond below and update any requested sections or documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {app.corrections.map((corr) => (
              <div key={corr.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{corr.reason}</p>
                    <p className="text-sm text-muted-foreground">{corr.instructions}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Raised by {corr.createdBy.name} • {new Date(corr.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={corr.status === "open" ? "destructive" : "secondary"}>
                    {corr.status.toUpperCase()}
                  </Badge>
                </div>

                {corr.responses.length > 0 && (
                  <div className="space-y-2 rounded-md bg-muted/50 p-3 text-sm">
                    {corr.responses.map((r) => (
                      <div key={r.id}>
                        <p className="font-medium">{r.respondedBy.name}:</p>
                        <p className="text-muted-foreground">{r.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {corr.status !== "resolved" && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write your clarification or confirm document replacement..."
                      value={replyText[corr.id] || ""}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [corr.id]: e.target.value }))}
                      className="min-h-10"
                    />
                    <Button type="button" onClick={() => handleReply(corr.id)}>
                      <Send className="mr-2 h-4 w-4" />
                      Reply
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-4 md:grid-cols-7">
        {(["business", "signatory", "ubo", "financial", "wallets", "declarations", "review"] as const).map(
          (secKey, idx) => {
            const step = idx + 1;
            return (
              <Button key={secKey} variant="outline" className="justify-start text-xs" asChild>
                <Link href={`/portal/applications/${app.id}/step/${step}`}>
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  {step}. {SECTION_LABELS[secKey].split(" ")[0]}
                </Link>
              </Button>
            );
          }
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Legal Name</span>
              <span className="font-medium">{app.business.legalName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entity Type</span>
              <span>{app.business.entityType ? ENTITY_TYPE_LABELS[app.business.entityType] : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PAN</span>
              <span>{app.business.pan || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CIN / Reg No</span>
              <span>{app.business.registrationNumber || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GSTIN</span>
              <span>{app.business.gstin || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authorized Signatory &amp; Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{app.signatory.fullName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Designation</span>
              <span>{app.signatory.designation || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{app.signatory.email || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Video KYC</span>
              <span>{VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wallet Status</span>
              <span>
                {app.wallets[0]
                  ? WALLET_STATUS_LABELS[app.wallets[0].verificationStatus]
                  : "No wallet added"}
              </span>
            </div>
            {app.videoKyc.videoUrl && (
              <div className="pt-2 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Uploaded Video KYC ({app.videoKyc.fileName || "Video_KYC.mp4"}):
                </p>
                <div className="overflow-hidden rounded-lg border bg-black">
                  <video
                    controls
                    preload="metadata"
                    src={app.videoKyc.videoUrl}
                    className="aspect-video w-full object-contain"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents ({app.documents.length})</CardTitle>
          <CardDescription>Real-time verification status from Pixelonics &amp; Pandosoft</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {app.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{doc.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.fileName} • v{doc.version}
                  </p>
                  {doc.reviewerNotes && (
                    <p className="text-xs text-muted-foreground">Note: {doc.reviewerNotes}</p>
                  )}
                </div>
                <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Activity</CardTitle>
          <CardDescription>Complete audit trail</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {app.auditTrail.map((event, idx) => (
              <div key={`${event.id}-${idx}`} className="flex gap-4 border-l-2 border-primary/30 pl-4">
                <div className="flex-1">
                  <p className="font-medium">{event.label}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()} • {event.actor.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
