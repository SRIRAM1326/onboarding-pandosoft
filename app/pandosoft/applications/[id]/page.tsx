import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default async function PandosoftApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pandosoft Compliance Review - PX-DEMO-001</h1>
          <p className="text-muted-foreground">Orbitrade Solutions Pvt. Ltd.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/pandosoft/applications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Review Queue
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Review - KYC Evidence, Declarations, SOF & Wallets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium">Review Comments</p>
            <Textarea placeholder="Add compliance review comments..." />
          </div>
          <div className="flex gap-2">
            <Button className="bg-success hover:bg-success/90">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve for Activation
            </Button>
            <Button variant="destructive">
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
