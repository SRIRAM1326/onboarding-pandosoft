"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VIDEO_KYC_STATUS_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { buildPrefilledVideoKycScript } from "@/components/onboarding/video-kyc-recorder";
import { Database, Video, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function VideoKycPage() {
  const { applications, recordVideoKycOutcome } = useOnboarding();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Video KYC</h1>
        <p className="text-muted-foreground">
          Review customer-recorded Video KYC declarations, reference video, and compliance outcomes
        </p>
      </div>

      {/* Standard Spoken Script Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mandatory Spoken Declaration Template</CardTitle>
              <CardDescription>
                Required script for customer Video KYC verification
              </CardDescription>
            </div>
            <Badge variant="secondary">Compliance Standard</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed space-y-3">
            <p className="text-muted-foreground">
              &ldquo;My name is [Full Name], authorized representative of [Your Company Name], completing the Video KYC on [Date] for our GK Enterprises trading account. The Company PAN is [Company PAN], my PAN is [Personal PAN], and the registered email is [Email ID]. This is my wallet ID: [Wallet ID Number].
            </p>
            <p className="text-muted-foreground">
              I confirm that I am duly authorized to operate this account as per the Board Resolution / Authorization Letter. We are the rightful owners of this account, and all funds used are from legitimate and lawful sources. These funds are not customer funds, borrowed funds, or pooled public money. Withdrawals are made only to verified, self-owned wallets, and we indemnify GK Enterprises against any false declarations made by us.&rdquo;
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Video KYC Submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="rounded-lg border p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {app.reference} — {app.business.legalName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Signatory: {app.signatory.fullName} • Officer:{" "}
                    {app.videoKyc.officerName || "Ananya Roy"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}</Badge>
                  {app.videoKyc.videoUrl && (
                    <Badge className="bg-success text-white">
                      <Database className="mr-1 h-3 w-3" />
                      Video Saved in DB
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      recordVideoKycOutcome(app.id, "completed", "Completed and identity verified");
                      toast.success("Recorded Video KYC as Completed");
                    }}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Mark Verified
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      recordVideoKycOutcome(
                        app.id,
                        "action_required",
                        "Please re-record Video KYC reading the full GK Enterprises declaration script clearly."
                      );
                      toast.warning("Requested Video KYC re-recording");
                    }}
                  >
                    <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                    Request Re-record
                  </Button>
                </div>
              </div>

              {app.videoKyc.videoUrl ? (
                <div className="grid gap-4 border-t pt-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <Video className="h-3.5 w-3.5 text-primary" />
                      Uploaded Customer Video ({app.videoKyc.fileName || "Video_KYC.mp4"})
                    </p>
                    <div className="overflow-hidden rounded-lg border bg-black">
                      <video
                        controls
                        preload="none"
                        src={app.videoKyc.videoUrl}
                        className="aspect-video w-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      Expected Spoken Script for {app.business.legalName}:
                    </p>
                    <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                      {app.videoKyc.spokenScript || buildPrefilledVideoKycScript(app)}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No customer Video KYC recording uploaded yet.
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
