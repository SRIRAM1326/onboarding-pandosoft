import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockApplications } from "@/lib/mock-data/applications";

export default function AuditTrailPage() {
  const events = mockApplications[0].auditTrail;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Trail</h1>
        <p className="text-muted-foreground">System activity and compliance audit log</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Events (Demo)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{event.label}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground">{event.actor.name} • {event.actor.role}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
