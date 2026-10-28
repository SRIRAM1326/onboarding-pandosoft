"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { toast } from "sonner";

export default function SettingsPage() {
  const { policy, updatePolicy } = useOnboarding();
  const [uboThreshold, setUboThreshold] = useState(policy.uboThresholdPercent);
  const [maxUploadMb, setMaxUploadMb] = useState(policy.maxUploadSizeMb);
  const [bankMonths, setBankMonths] = useState(policy.bankStatementMonths);
  const [slaDays, setSlaDays] = useState(policy.reviewSlaDays);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePolicy({
      uboThresholdPercent: Number(uboThreshold) || 25,
      maxUploadSizeMb: Number(maxUploadMb) || 10,
      bankStatementMonths: Number(bankMonths) || 6,
      reviewSlaDays: Number(slaDays) || 3,
    });
    toast.success("Compliance policy settings updated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Compliance policy and threshold configuration</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Compliance Policy</CardTitle>
          <CardDescription>
            Changes take effect immediately across the onboarding wizard and document requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ubo">UBO Ownership Threshold (%)</Label>
                <Input
                  id="ubo"
                  type="number"
                  min={1}
                  max={100}
                  value={uboThreshold}
                  onChange={(e) => setUboThreshold(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMb">Max Document Upload Size (MB)</Label>
                <Input
                  id="maxMb"
                  type="number"
                  min={1}
                  max={50}
                  value={maxUploadMb}
                  onChange={(e) => setMaxUploadMb(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankMonths">Bank Statement Period (Months)</Label>
                <Input
                  id="bankMonths"
                  type="number"
                  min={1}
                  max={24}
                  value={bankMonths}
                  onChange={(e) => setBankMonths(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sla">Review SLA (Business Days)</Label>
                <Input
                  id="sla"
                  type="number"
                  min={1}
                  max={30}
                  value={slaDays}
                  onChange={(e) => setSlaDays(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Require Test Transaction for All Wallets</p>
                <p className="text-xs text-muted-foreground">
                  Makes micro-deposit test transaction evidence mandatory for every registered wallet
                </p>
              </div>
              <Switch
                checked={policy.requireTestTransaction}
                onCheckedChange={(checked) => updatePolicy({ requireTestTransaction: checked })}
              />
            </div>

            <Button type="submit">Save Compliance Policy</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
