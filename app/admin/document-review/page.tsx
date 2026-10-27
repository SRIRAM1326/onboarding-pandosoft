import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Document Review</h1>
        <p className="text-muted-foreground">Review pending documents across all applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No pending document reviews in demo</p>
        </CardContent>
      </Card>
    </div>
  );
}
