import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateOnBehalfPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Application on Behalf of Customer</h1>
        <p className="text-muted-foreground">Pixelonics staff can create applications for customers as per process</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
          <CardDescription>Enter basic customer information to initiate onboarding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" placeholder="Company Legal Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Person</Label>
              <Input id="contact" placeholder="Full Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="contact@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <Input id="phone" placeholder="+91 XXXXXXXX" />
            </div>
          </div>
          <Button>Create Application & Send Invite (Demo)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
