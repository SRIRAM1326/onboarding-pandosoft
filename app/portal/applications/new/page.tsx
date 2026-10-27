import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function NewApplicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Start New Application</h1>
        <p className="text-muted-foreground">Begin the 7-step onboarding process</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Corporate KYC Onboarding</CardTitle>
          <CardDescription>
            You'll need to provide business information, authorized signatory details, beneficial ownership, financial information, crypto wallets, and complete declarations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">What you'll need:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Certificate of Incorporation & PAN Card</li>
              <li>• Authorized signatory ID proof & authorization letter</li>
              <li>• Beneficial ownership details (≥25% ownership per policy)</li>
              <li>• Bank account details & financial documents</li>
              <li>• Crypto wallet information</li>
            </ul>
          </div>
          <Button asChild>
            <Link href="/portal/applications/app-demo-001/step/1">
              Start Application
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
