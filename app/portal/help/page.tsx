import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">Get assistance with your onboarding</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Email: onboarding-support@pixelonics.example</p>
          <p>Phone: +91 22 4567 8900</p>
          <p className="text-sm text-muted-foreground">Support hours: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
        </CardContent>
      </Card>
    </div>
  );
}
