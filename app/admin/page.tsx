import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockApplicationSummaries } from "@/lib/mock-data/applications";
import { Users, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Applications", value: 1, icon: Users },
    { label: "Submitted", value: 0, icon: Clock },
    { label: "Under Review", value: 1, icon: AlertCircle },
    { label: "Action Required", value: 0, icon: AlertCircle },
    { label: "Approved", value: 0, icon: CheckCircle },
    { label: "Rejected", value: 0, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance Dashboard</h1>
        <p className="text-muted-foreground">Overview of all onboarding applications</p>
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
            {mockApplicationSummaries.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{app.reference}</p>
                  <p className="text-sm text-muted-foreground">{app.businessName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Under Review</p>
                  <p className="text-xs text-muted-foreground">Assigned: {app.assignedReviewerName}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
