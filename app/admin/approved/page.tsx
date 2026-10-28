"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";

export default function ApprovedPage() {
  const { summaries } = useOnboarding();
  const approved = summaries.filter((a) => a.status === "approved");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approved Clients</h1>
        <p className="text-muted-foreground">Approved corporate onboarding applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approved Applications ({approved.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {approved.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved applications yet</p>
          ) : (
            approved.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{app.reference}</p>
                  <p className="text-sm text-muted-foreground">{app.businessName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ApplicationStatusBadge status={app.status} />
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/applications/${app.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
