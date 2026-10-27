import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RejectedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rejected Applications</h1>
        <p className="text-muted-foreground">Rejected onboarding applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rejected Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No rejected applications yet</p>
        </CardContent>
      </Card>
    </div>
  );
}
