"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_STATUS_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

export default function DocumentReviewPage() {
  const { applications, reviewDocument } = useOnboarding();
  const allDocs = applications.flatMap((app) =>
    app.documents.map((d) => ({ ...d, appId: app.id, appRef: app.reference }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Document Review</h1>
        <p className="text-muted-foreground">Review and verify documents across all applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Uploaded Documents ({allDocs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {allDocs.map((doc) => (
            <div
              key={`${doc.appId}-${doc.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">
                  {doc.label} <span className="text-xs text-muted-foreground">({doc.appRef})</span>
                </p>
                <p className="text-xs text-muted-foreground">{doc.fileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    reviewDocument(doc.appId, doc.id, "verified_demo", "Verified by Compliance");
                    toast.success(`Verified ${doc.label}`);
                  }}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    reviewDocument(doc.appId, doc.id, "replacement_required", "Replacement requested");
                    toast.warning(`Requested replacement for ${doc.label}`);
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
