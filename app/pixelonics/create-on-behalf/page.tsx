"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { toast } from "sonner";

export default function CreateOnBehalfPage() {
  const router = useRouter();
  const { createApplication } = useOnboarding();
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !contact.trim() || !email.trim()) {
      toast.error("Please fill in company name, contact person, and email");
      return;
    }
    const created = createApplication({
      legalName: company.trim(),
      contactName: contact.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    toast.success(`Created application ${created.reference} for ${company} and sent customer invite!`);
    router.push(`/pixelonics/applications/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Application on Behalf of Customer
        </h1>
        <p className="text-muted-foreground">
          Pixelonics Operations staff can initiate corporate onboarding applications and invite customers
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
          <CardDescription>Enter corporate client information to initiate onboarding</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company Legal Name *</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company Legal Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Authorized Contact Person *</Label>
                <Input
                  id="contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Full Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <Button type="submit">Create Application &amp; Send Invite</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
