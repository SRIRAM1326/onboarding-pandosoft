import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { mockApplicationSummaries } from "@/lib/mock-data/applications";
import { currentMockUser } from "@/lib/mock-data/users";
import { ArrowRight, FileText, PlusCircle } from "lucide-react";

export default function PortalDashboard() {
  const app = mockApplicationSummaries[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {currentMockUser.name}</h1>
        <p className="text-muted-foreground">Manage your corporate onboarding applications</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Application</CardTitle>
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
              <div className="h-full bg-primary" style={{ width: `${app.progressPercent}%` }} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Documents</p>
              <p className="text-lg font-medium">
                {app.documentProgress.verified}/{app.documentProgress.required} Verified
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Video KYC</p>
              <p className="text-lg font-medium">Not Scheduled</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Wallets</p>
              <p className="text-lg font-medium">Pending Review</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/portal/applications/${app.id}`}>
                Continue Application
                <ArrowRight className="ml-2 h-4 w-4" />
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
              <Link href="/portal/applications/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Application
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/documents">
                <FileText className="mr-2 h-4 w-4" />
                View Documents
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
              <div className="flex justify-between">
                <span>Application submitted</span>
                <span className="text-muted-foreground">Oct 22, 2026</span>
              </div>
              <div className="flex justify-between">
                <span>Reviewer assigned</span>
                <span className="text-muted-foreground">Oct 23, 2026</span>
              </div>
              <div className="flex justify-between">
                <span>Under review</span>
                <span className="text-muted-foreground">Oct 24, 2026</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
