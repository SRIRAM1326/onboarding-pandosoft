"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function NewApplicationPage() {
  const router = useRouter();
  const { createApplication, currentUser } = useOnboarding();
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || "");

  const handleStartNew = (e: React.FormEvent) => {
    e.preventDefault();
    const created = createApplication({
      legalName: legalName.trim() || "New Corporate Applicant Pvt. Ltd.",
      contactName: currentUser.name,
      email: email.trim(),
      phone: phone.trim(),
    });
    toast.success(`Created application ${created.reference}`);
    router.push(`/portal/applications/${created.id}/step/1`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Start New Application</h1>
        <p className="text-muted-foreground">Begin the 7-step corporate KYC onboarding process</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Corporate KYC Onboarding</CardTitle>
          <CardDescription>
            Provide initial entity details to create a new onboarding draft or continue with the pre-populated Orbitrade application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleStartNew} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Entity Name *</Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Apex Digital Treasury Pvt. Ltd."
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Business Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Business Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="mb-2 font-medium">What you&apos;ll need:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Certificate of Incorporation &amp; Business PAN Card</li>
                <li>• Authorized signatory ID proof &amp; Board Resolution</li>
                <li>• Beneficial ownership details (≥25% ownership per policy)</li>
                <li>• Cancelled cheque, last 6 months bank statements &amp; financial statements</li>
                <li>• Crypto wallet details &amp; dashboard screenshot</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                Create &amp; Start Step 1
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/portal/applications/app-demo-001/step/1")}
              >
                Open Existing Application (PX-DEMO-001)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
