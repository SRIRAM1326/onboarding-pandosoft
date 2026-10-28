"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { FileCheck, Users, ClipboardList, Clock } from "lucide-react";
import Link from "next/link";

export default function PixelonicsDashboard() {
  const { summaries, applications } = useOnboarding();
  const pendingOps = summaries.filter((a) => a.status === "submitted" || a.status === "under_review").length;
  const openCorr = applications.reduce(
    (sum, a) => sum + a.corrections.filter((c) => c.status === "open").length,
    0
  );
  const readyCount = summaries.filter((a) => a.status === "under_review" || a.status === "approved").length;

  const stats = [
    { label: "Total Applications", value: summaries.length, icon: Users },
    { label: "Pending Ops Review", value: pendingOps, icon: Clock },
    { label: "Open Corrections", value: openCorr, icon: ClipboardList },
    { label: "In Compliance Pipeline", value: readyCount, icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pixelonics Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Pixelonics × Pandosoft India Private Limited — Operations Review
          </p>
        </div>
        <Button asChild>
          <Link href="/pixelonics/create-on-behalf">Create Application on Behalf of Customer</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <CardTitle>Applications Requiring Operations Review</CardTitle>
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
                    <Link href={`/pixelonics/applications/${app.id}`}>Review</Link>
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
