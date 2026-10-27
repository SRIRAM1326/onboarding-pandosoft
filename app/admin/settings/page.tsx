import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Compliance policy configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">UBO Threshold</span>
            <span>25%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Upload Size</span>
            <span>10 MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bank Statement Period</span>
            <span>6 months</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Settings are for demo display only</p>
        </CardContent>
      </Card>
    </div>
  );
}
