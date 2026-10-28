"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { toast } from "sonner";

export default function PixelonicsCorrectionsPage() {
  const { applications, resolveCorrection, requestCorrection } = useOnboarding();
  const corrections = applications.flatMap((app) =>
    app.corrections.map((c) => ({ ...c, appRef: app.reference, businessName: app.business.legalName }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Corrections</h1>
          <p className="text-muted-foreground">Track and resolve customer correction requests</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const firstApp = applications[0];
            if (!firstApp) return;
            requestCorrection(firstApp.id, {
              category: "document_quality",
              sections: ["signatory"],
              reason: "Updated Board Resolution Stamp Required",
              instructions: "Please upload the Board Resolution with clear company seal and director signature.",
            });
            toast.success("Raised sample correction request on " + firstApp.reference);
          }}
        >
          + Raise Correction on {applications[0]?.reference}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Correction Requests ({corrections.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {corrections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No correction requests currently open.</p>
          ) : (
            corrections.map((corr) => (
              <div key={corr.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {corr.reason} ({corr.appRef} — {corr.businessName})
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
                          toast.success("Marked correction as resolved");
                        }}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
                {corr.responses.length > 0 && (
                  <div className="rounded bg-muted/50 p-2 text-xs">
                    {corr.responses.map((r) => (
                      <p key={r.id}>
                        <strong>{r.respondedBy.name}:</strong> {r.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
