"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { FileSearch, CheckCircle, Clock, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";

export default function PandosoftDashboard() {
  const { summaries } = useOnboarding();
  const readyForFinalDecision = summaries.filter(
    (a) => a.status === "ready_for_compliance" || Boolean(a.forwardedToPandosoftAt)
  ).length;
  const inPixelonicsVerification = summaries.filter(
    (a) => a.status === "submitted" || a.status === "under_review"
  ).length;
  const approved = summaries.filter((a) => a.status === "approved").length;
  const rejected = summaries.filter((a) => a.status === "rejected").length;

  const stats = [
    { label: "Forwarded for Final Review", value: readyForFinalDecision, icon: ShieldCheck, color: "text-emerald-600" },
    { label: "In Pixelonics Verification", value: inPixelonicsVerification, icon: Clock, color: "text-amber-600" },
    { label: "Approved for Activation", value: approved, icon: CheckCircle, color: "text-emerald-600" },
    { label: "Rejected Applications", value: rejected, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pandosoft Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          Pandosoft India Private Limited — Final Compliance Review, Approvals &amp; Rejections
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <CardTitle>Applications Awaiting Pandosoft Final Decision</CardTitle>
          <CardDescription>
            Initial document and detail verification is performed by Pixelonics. Pandosoft team conducts final review to approve or reject.
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
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{app.reference}</p>
                      <Badge
                        variant="outline"
                        className={
                          isForwarded
                            ? "border-emerald-500 text-emerald-600 bg-emerald-500/5 text-xs"
                            : "border-amber-400 text-amber-600 bg-amber-500/5 text-xs"
                        }
                      >
                        {isForwarded ? "Verified by Pixelonics" : "In Pixelonics Verification"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {app.businessName} • {app.documentProgress.verified}/{app.documentProgress.uploaded} Docs Verified
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApplicationStatusBadge status={app.status} />
                    <Button size="sm" variant={isForwarded ? "default" : "outline"} asChild>
                      <Link href={`/pandosoft/applications/${app.id}`}>
                        {isForwarded ? "Final Review" : "Inspect"}
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
