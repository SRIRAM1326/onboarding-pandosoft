"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";

export default function PandosoftApprovalsPage() {
  const { summaries, recordDecision } = useOnboarding();
  const approved = summaries.filter((a) => a.status === "approved");
  const pendingApproval = summaries.filter((a) => a.status !== "approved");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance Approvals</h1>
        <p className="text-muted-foreground">Final sign-off and approved corporate clients</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approved Clients ({approved.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {approved.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approved applications yet. Approve an application below or from the Review Queue.
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
            <CardTitle>Pending Final Approval ({pendingApproval.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApproval.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{app.reference}</p>
                  <p className="text-sm text-muted-foreground">{app.businessName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-success hover:bg-success/90"
                    onClick={() => recordDecision(app.id, "approved", "Final approval granted by Pandosoft")}
                  >
                    Approve Now
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/pandosoft/applications/${app.id}`}>Inspect</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
