import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockNotifications } from "@/lib/mock-data/notifications";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Stay updated on your application</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockNotifications.map((notif) => (
              <div key={notif.id} className="flex gap-3 rounded-lg border p-3">
                <Bell className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{notif.title}</p>
                  <p className="text-sm text-muted-foreground">{notif.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
                {!notif.read && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
