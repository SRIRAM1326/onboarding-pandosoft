import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CorrectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Correction Requests</h1>
        <p className="text-muted-foreground">Manage correction requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No open correction requests</p>
        </CardContent>
      </Card>
    </div>
  );
}
