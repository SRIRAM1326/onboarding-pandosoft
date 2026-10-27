import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSearch, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function PandosoftDashboard() {
  const stats = [
    { label: "Awaiting Pandosoft Review", value: 1, icon: Clock },
    { label: "In Review", value: 0, icon: FileSearch },
    { label: "Approved", value: 0, icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pandosoft Compliance Dashboard</h1>
        <p className="text-muted-foreground">Pandosoft India Private Limited - Compliance Review</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
          <CardTitle>Applications Awaiting Compliance Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">PX-DEMO-001</p>
                <p className="text-sm text-muted-foreground">Orbitrade Solutions Pvt. Ltd. • Marked Ready by Pixelonics Ops</p>
              </div>
              <Button size="sm" asChild>
                <Link href="/pandosoft/applications/app-demo-001">Start Review</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
