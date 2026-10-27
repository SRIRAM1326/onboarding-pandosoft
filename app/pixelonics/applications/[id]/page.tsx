import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default async function PixelonicsApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations Review - PX-DEMO-001</h1>
          <p className="text-muted-foreground">Orbitrade Solutions Pvt. Ltd.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/pixelonics/applications">
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
        <Button>
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark Ready for Pandosoft Compliance Review
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operations Review Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between border-b pb-2">
            <span>Application completeness</span>
            <span className="text-sm text-muted-foreground">To Verify</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span>All required documents uploaded</span>
            <span className="text-sm text-muted-foreground">To Verify</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span>Generated documents signed & stamped</span>
            <span className="text-sm text-muted-foreground">To Verify</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Ready to forward to Pandosoft Compliance</span>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
