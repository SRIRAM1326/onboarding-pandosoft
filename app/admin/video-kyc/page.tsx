import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VideoKycPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Video KYC</h1>
        <p className="text-muted-foreground">Manage video KYC sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No sessions scheduled in demo</p>
        </CardContent>
      </Card>
    </div>
  );
}
