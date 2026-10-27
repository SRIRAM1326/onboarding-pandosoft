import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockApplications } from "@/lib/mock-data/applications";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default async function AdminApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = mockApplications.find((a) => a.id === id) ?? mockApplications[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review Application {app.reference}</h1>
          <p className="text-muted-foreground">{app.business.legalName}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/applications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline">
          <AlertCircle className="mr-2 h-4 w-4" />
          Request Corrections
        </Button>
        <Button variant="outline">Assign Reviewer</Button>
        <Button variant="outline">Record Video KYC Outcome</Button>
        <Button variant="outline">Record Wallet Verification</Button>
        <Button className="bg-success hover:bg-success/90">
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve Application
        </Button>
        <Button variant="destructive">
          <XCircle className="mr-2 h-4 w-4" />
          Reject Application
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="ubo">UBO</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">Under Review</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">{app.submittedAt ? new Date(app.submittedAt).toLocaleString() : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned Reviewer</p>
                <p className="font-medium">Neha Kulkarni</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-medium">{app.reference}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Legal Name</span>
                <span>{app.business.legalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entity Type</span>
                <span>Private Limited</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PAN</span>
                <span>{app.business.pan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GSTIN</span>
                <span>{app.business.gstin}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Review uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">12 documents uploaded - Demo data</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ubo">
          <Card>
            <CardHeader>
              <CardTitle>Beneficial Owners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {app.beneficialOwners.map((ubo) => (
                <div key={ubo.id} className="rounded-lg border p-3">
                  <p className="font-medium">{ubo.fullName}</p>
                  <p className="text-sm text-muted-foreground">{ubo.ownershipPercentage}% ownership • {ubo.role}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {app.auditTrail.map((event) => (
                  <div key={event.id} className="flex gap-4 border-l-2 border-primary/30 pl-4">
                    <div className="flex-1">
                      <p className="font-medium">{event.label}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.timestamp).toLocaleString()} • {event.actor.name} ({event.actor.role})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
