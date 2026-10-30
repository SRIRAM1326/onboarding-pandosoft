"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { FileCheck, Users, ClipboardList, Clock, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PixelonicsDashboard() {
  const { summaries, applications } = useOnboarding();
  const pendingVerification = summaries.filter(
    (a) => a.status === "submitted" || a.status === "under_review"
  ).length;
  const forwardedToPandosoft = summaries.filter(
    (a) => a.status === "ready_for_compliance" || Boolean(a.forwardedToPandosoftAt)
  ).length;
  const openCorr = applications.reduce(
    (sum, a) => sum + a.corrections.filter((c) => c.status === "open").length,
    0
  );
  const approvedByPandosoft = summaries.filter((a) => a.status === "approved").length;

  const stats = [
    { label: "Pending Pixelonics Verification", value: pendingVerification, icon: Clock, color: "text-amber-600" },
    { label: "Forwarded to Pandosoft", value: forwardedToPandosoft, icon: Send, color: "text-indigo-600" },
    { label: "Open Corrections", value: openCorr, icon: ClipboardList, color: "text-rose-600" },
    { label: "Approved by Pandosoft", value: approvedByPandosoft, icon: ShieldCheck, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pixelonics Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Pixelonics Team — Initial Document &amp; Detail Verification. Verified applications are forwarded to Pandosoft for final approval or rejection.
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
                  <Icon className={`h-5 w-5 ${stat.color || "text-muted-foreground"}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Applications — Initial Verification Queue</CardTitle>
          <CardDescription>
            Verify all customer documents, details, wallets, and Video KYC. Once verification is complete, forward to Pandosoft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summaries.map((app) => {
              const isForwarded =
                app.status === "ready_for_compliance" ||
                Boolean(app.forwardedToPandosoftAt) ||
                app.status === "approved" ||
                app.status === "rejected";

              return (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{app.reference}</p>
                      {isForwarded && (
                        <Badge variant="outline" className="text-indigo-600 border-indigo-300 text-xs">
                          Forwarded to Pandosoft
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {app.businessName} • {app.documentProgress.verified}/{app.documentProgress.uploaded} Docs Verified
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApplicationStatusBadge status={app.status} />
                    <Button size="sm" asChild>
                      <Link href={`/pixelonics/applications/${app.id}`}>
                        {isForwarded ? "View Details" : "Review & Verify"}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
