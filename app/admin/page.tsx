"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { Users, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function AdminDashboard() {
  const { summaries } = useOnboarding();

  const stats = [
    { label: "Total Applications", value: summaries.length, icon: Users },
    { label: "Submitted", value: summaries.filter((a) => a.status === "submitted").length, icon: Clock },
    { label: "Under Review", value: summaries.filter((a) => a.status === "under_review").length, icon: AlertCircle },
    { label: "Action Required", value: summaries.filter((a) => a.status === "action_required").length, icon: AlertCircle },
    { label: "Approved", value: summaries.filter((a) => a.status === "approved").length, icon: CheckCircle },
    { label: "Rejected", value: summaries.filter((a) => a.status === "rejected").length, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance Dashboard</h1>
        <p className="text-muted-foreground">Overview of all corporate onboarding applications</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summaries.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{app.reference}</p>
                  <p className="text-sm text-muted-foreground">
                    {app.businessName} • Assigned: {app.assignedReviewerName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ApplicationStatusBadge status={app.status} />
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/applications/${app.id}`}>Review</Link>
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
