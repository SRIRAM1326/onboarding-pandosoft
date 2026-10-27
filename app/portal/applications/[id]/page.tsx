import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { mockApplications } from "@/lib/mock-data/applications";
import { ArrowLeft, Edit } from "lucide-react";

export default async function ApplicationDetailPage({
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
          <h1 className="text-2xl font-semibold tracking-tight">Application {app.reference}</h1>
          <p className="text-muted-foreground">{app.business.legalName}</p>
        </div>
        <div className="flex items-center gap-2">
          <ApplicationStatusBadge status={app.status} />
          <Button variant="outline" asChild>
            <Link href="/portal">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portal
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {[1, 2, 3, 4, 5, 6, 7].map((step) => (
          <Button key={step} variant="outline" className="justify-start" asChild>
            <Link href={`/portal/applications/${app.id}/step/${step}`}>
              <Edit className="mr-2 h-4 w-4" />
              Step {step}
            </Link>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authorized Signatory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{app.signatory.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Designation</span>
              <span>{app.signatory.designation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{app.signatory.email}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Activity</CardTitle>
          <CardDescription>Demo timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {app.auditTrail.map((event) => (
              <div key={event.id} className="flex gap-4 border-l-2 border-primary/30 pl-4">
                <div className="flex-1">
                  <p className="font-medium">{event.label}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.timestamp).toLocaleString()} • {event.actor.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
