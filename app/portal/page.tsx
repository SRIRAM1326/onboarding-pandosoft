"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { VIDEO_KYC_STATUS_LABELS, WALLET_STATUS_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { ArrowRight, FileText, PlusCircle, AlertCircle, Download } from "lucide-react";

export default function PortalDashboard() {
  const { currentUser, summaries, applications, hydrated } = useOnboarding();
  const app = summaries[0];
  const fullApp = applications.find((a) => a.id === app?.id) ?? applications[0];

  if (!hydrated) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-md bg-secondary" />
          <div className="h-4 w-80 rounded-md bg-secondary/70" />
        </div>
        <div className="h-56 w-full rounded-xl border bg-card p-6" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-44 rounded-xl border bg-card p-6" />
          <div className="h-44 rounded-xl border bg-card p-6" />
        </div>
      </div>
    );
  }

  if (!app || !fullApp) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, {currentUser.name}</h1>
          <p className="text-muted-foreground">Manage your corporate onboarding applications</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No Active Application</CardTitle>
            <CardDescription>Start a new corporate KYC application to get onboarded.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/portal/applications/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Start New Application
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {currentUser.name}</h1>
        <p className="text-muted-foreground">Manage your corporate onboarding applications</p>
      </div>

      {app.openCorrections > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-warning/40 bg-warning-soft p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium text-warning">
                {app.openCorrections} Correction Request{app.openCorrections > 1 ? "s" : ""} Open
              </p>
              <p className="text-sm text-muted-foreground">
                Compliance has requested additional clarification or document replacement on {app.reference}.
              </p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href={`/portal/applications/${app.id}`}>Respond Now</Link>
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Application — {app.businessName}</CardTitle>
              <CardDescription>Reference: {app.reference}</CardDescription>
            </div>
            <ApplicationStatusBadge status={app.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{app.progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${app.progressPercent}%` }} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Documents</p>
              <p className="text-lg font-medium">
                {app.documentProgress.verified}/{app.documentProgress.uploaded} Verified ({app.documentProgress.uploaded} Uploaded)
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Video KYC</p>
              <p className="text-lg font-medium">{VIDEO_KYC_STATUS_LABELS[app.videoKycStatus]}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Wallets</p>
              <p className="text-lg font-medium">{WALLET_STATUS_LABELS[app.walletStatus]}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/portal/applications/${app.id}`}>
                View / Continue Application
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/portal/applications/${app.id}/documents-generation`}>
                <Download className="mr-2 h-4 w-4" />
                Generate Onboarding Declarations
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/portal/applications/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Start New Application
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/portal/applications/${app.id}/step/1`}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Open 7-Step Onboarding Wizard
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/portal/applications/${app.id}/documents-generation`}>
                <Download className="mr-2 h-4 w-4" />
                Download & Sign Pre-filled Declarations
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/documents">
                <FileText className="mr-2 h-4 w-4" />
                View All Uploaded Documents ({fullApp.documents.length})
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {fullApp.auditTrail.slice(0, 5).map((ev) => (
                <div key={ev.id} className="flex justify-between gap-2">
                  <span className="truncate">{ev.label}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(ev.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
