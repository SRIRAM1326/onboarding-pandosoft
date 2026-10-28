"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";

export default function PandosoftMyReviewsPage() {
  const { summaries } = useOnboarding();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Reviews</h1>
        <p className="text-muted-foreground">Applications assigned to Pandosoft Compliance Reviewer</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Applications ({summaries.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summaries.map((app) => (
            <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{app.reference}</p>
                <p className="text-sm text-muted-foreground">{app.businessName}</p>
              </div>
              <div className="flex items-center gap-2">
                <ApplicationStatusBadge status={app.status} />
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/pandosoft/applications/${app.id}`}>Open Review</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
