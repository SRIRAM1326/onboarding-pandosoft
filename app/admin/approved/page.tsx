import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApprovedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approved Clients</h1>
        <p className="text-muted-foreground">Approved onboarding applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approved Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No approved applications yet</p>
        </CardContent>
      </Card>
    </div>
  );
}
