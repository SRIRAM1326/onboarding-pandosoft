"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WALLET_STATUS_LABELS, NETWORK_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { toast } from "sonner";

export default function WalletVerificationPage() {
  const { applications, recordWalletVerification } = useOnboarding();
  const wallets = applications.flatMap((app) =>
    app.wallets.map((w) => ({
      ...w,
      appId: app.id,
      appRef: app.reference,
      businessName: app.business.legalName,
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wallet Verification</h1>
        <p className="text-muted-foreground">Review and verify corporate crypto wallets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Wallets ({wallets.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {wallets.map((w) => (
            <div
              key={`${w.appId}-${w.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">
                  {w.label} ({w.network ? NETWORK_LABELS[w.network] : "-"}) — {w.appRef}
                </p>
                <p className="text-xs text-muted-foreground">{w.businessName}</p>
                <p className="mt-1 font-mono text-xs">{w.address}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{WALLET_STATUS_LABELS[w.verificationStatus]}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    recordWalletVerification(w.appId, w.id, "verified_demo", "Verified by Compliance");
                    toast.success(`Verified wallet ${w.label}`);
                  }}
                >
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    recordWalletVerification(w.appId, w.id, "action_required", "Test transaction required");
                    toast.warning(`Requested action on wallet ${w.label}`);
                  }}
                >
                  Request Action
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
