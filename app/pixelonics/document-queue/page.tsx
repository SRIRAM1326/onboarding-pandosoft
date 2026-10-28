"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_STATUS_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

export default function PixelonicsDocumentQueuePage() {
  const { applications, reviewDocument } = useOnboarding();
  const docs = applications.flatMap((app) =>
    app.documents.map((d) => ({ ...d, appId: app.id, appRef: app.reference, businessName: app.business.legalName }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Document Queue</h1>
        <p className="text-muted-foreground">Verify or flag uploaded customer documents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Uploaded Documents ({docs.length})</CardTitle>
          <CardDescription>Pixelonics Operations first-level document screening</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {docs.map((doc) => (
            <div
              key={`${doc.appId}-${doc.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">
                  {doc.label} <span className="text-xs text-muted-foreground">({doc.appRef})</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {doc.businessName} • {doc.fileName} • v{doc.version}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    reviewDocument(doc.appId, doc.id, "verified_demo", "Verified by Pixelonics Ops");
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
                    reviewDocument(doc.appId, doc.id, "replacement_required", "Replacement requested by Ops");
                    toast.warning(`Flagged ${doc.label} for replacement`);
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Replace
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
