"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { validateApplicationForApproval } from "@/lib/utils/verification-rules";
import { CheckCircle2, FileSearch, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";

export default function PandosoftApprovalsPage() {
  const { summaries, getApplication, recordDecision, policy } = useOnboarding();
  const approved = summaries.filter((a) => a.status === "approved");
  const pendingApproval = summaries.filter((a) => a.status !== "approved");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pandosoft Compliance Approvals</h1>
        <p className="text-muted-foreground">
          Final onboarding sign-off: Initial document and detail verification is performed by the Pixelonics team. Pandosoft team reviews the verified information and performs final approval or rejection.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approved Clients ({approved.length})</CardTitle>
          <CardDescription>Corporate accounts with completed Pandosoft approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {approved.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approved applications yet. Applications will appear here after final Pandosoft approval.
            </p>
          ) : (
            approved.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{app.reference}</p>
                  <p className="text-sm text-muted-foreground">{app.businessName}</p>
                </div>
                <ApplicationStatusBadge status={app.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {pendingApproval.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Final Decision ({pendingApproval.length})</CardTitle>
            <CardDescription>
              Applications undergo initial verification at Pixelonics before final Pandosoft sign-off
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApproval.map((appSummary) => {
              const fullApp = getApplication(appSummary.id);
              const report = validateApplicationForApproval(fullApp, policy);

              return (
                <div
                  key={appSummary.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:border-primary/40 bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{appSummary.reference}</p>
                      <ApplicationStatusBadge status={appSummary.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{appSummary.businessName}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <Badge variant="outline" className={report.isForwardedToPandosoft ? "border-emerald-500 text-emerald-600" : "border-amber-400 text-amber-600"}>
                        {report.isForwardedToPandosoft ? "Verified & Forwarded by Pixelonics" : "Initial Verification in Pixelonics"}
                      </Badge>
                      <Badge variant="outline" className={report.allDocumentsVerified ? "border-emerald-500 text-emerald-600" : ""}>
                        {report.totalVerified}/{report.totalRequired} Docs Verified
                      </Badge>
                      <Badge variant="outline" className={report.videoKycVerified ? "border-emerald-500 text-emerald-600" : ""}>
                        Video KYC: {report.videoKycVerified ? "Verified" : "Pending Pixelonics"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {report.canApprove ? (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        onClick={() => {
                          recordDecision(
                            appSummary.id,
                            "approved",
                            "All customer documents, details, and Video KYC verified by Pixelonics team. Approved by Pandosoft Compliance Officer."
                          );
                          toast.success(`Application ${appSummary.reference} APPROVED by Pandosoft!`);
                        }}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Final Approval &amp; Activate
                      </Button>
                    ) : (
                      <Button size="sm" variant="default" asChild>
                        <Link href={`/pandosoft/applications/${appSummary.id}`}>
                          <FileSearch className="mr-1.5 h-3.5 w-3.5" />
                          Review Verified Package
                          <ArrowRight className="ml-1.5 h-3 w-3" />
                        </Link>
                      </Button>
                    )}

                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/pandosoft/applications/${appSummary.id}`}>Inspect</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
