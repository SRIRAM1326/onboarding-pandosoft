"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { FileSearch, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function PandosoftDashboard() {
  const { summaries } = useOnboarding();
  const awaiting = summaries.filter((a) => a.status === "under_review" || a.status === "submitted").length;
  const approved = summaries.filter((a) => a.status === "approved").length;

  const stats = [
    { label: "Awaiting Pandosoft Review", value: awaiting, icon: Clock },
    { label: "Total in Queue", value: summaries.length, icon: FileSearch },
    { label: "Approved for Activation", value: approved, icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pandosoft Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          Pandosoft India Private Limited — Final KYC, AML &amp; Wallet Compliance Review
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications Awaiting Compliance Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summaries.map((app) => (
              <div
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{app.reference}</p>
                  <p className="text-sm text-muted-foreground">
                    {app.businessName} • {app.documentProgress.verified}/{app.documentProgress.uploaded} Docs Verified
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ApplicationStatusBadge status={app.status} />
                  <Button size="sm" asChild>
                    <Link href={`/pandosoft/applications/${app.id}`}>Review Application</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
