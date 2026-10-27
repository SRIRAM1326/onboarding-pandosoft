import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WalletVerificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wallet Verification</h1>
        <p className="text-muted-foreground">Review crypto wallet verifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">1 wallet pending review (Demo)</p>
        </CardContent>
      </Card>
    </div>
  );
}
