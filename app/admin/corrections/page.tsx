"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { toast } from "sonner";

export default function CorrectionsPage() {
  const { applications, resolveCorrection } = useOnboarding();
  const corrections = applications.flatMap((app) =>
    app.corrections.map((c) => ({ ...c, appRef: app.reference, businessName: app.business.legalName }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Correction Requests</h1>
        <p className="text-muted-foreground">Manage compliance correction requests across applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Correction Requests ({corrections.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {corrections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open correction requests</p>
          ) : (
            corrections.map((corr) => (
              <div key={corr.id} className="flex items-start justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">
                    {corr.reason} ({corr.appRef})
                  </p>
                  <p className="text-sm text-muted-foreground">{corr.instructions}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{corr.status.toUpperCase()}</Badge>
                  {corr.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        resolveCorrection(corr.applicationId, corr.id);
                        toast.success("Resolved correction request");
                      }}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
