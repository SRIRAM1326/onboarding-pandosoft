import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, Users, ClipboardList, Clock } from "lucide-react";
import Link from "next/link";

export default function PixelonicsDashboard() {
  const stats = [
    { label: "New Applications", value: 2, icon: Users },
    { label: "Pending Ops Review", value: 1, icon: Clock },
    { label: "Corrections Raised", value: 0, icon: ClipboardList },
    { label: "Awaiting Pandosoft Review", value: 1, icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pixelonics Operations Dashboard</h1>
          <p className="text-muted-foreground">Pixelonics × Pandosoft India Private Limited - Operations Review</p>
        </div>
        <Button asChild>
          <Link href="/pixelonics/create-on-behalf">Create Application on Behalf of Customer</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications Requiring Operations Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">PX-DEMO-001</p>
                <p className="text-sm text-muted-foreground">Orbitrade Solutions Pvt. Ltd.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Pending Ops Review</span>
                <Button size="sm" asChild>
                  <Link href="/pixelonics/applications/app-demo-001">Review</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
