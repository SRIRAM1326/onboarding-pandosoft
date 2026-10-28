"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useOnboarding();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your onboarding applications</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            markAllNotificationsRead();
            toast.success("Marked all notifications as read");
          }}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark All as Read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
              >
                <Bell className="mt-0.5 h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{notif.title}</p>
                  <p className="text-sm text-muted-foreground">{notif.body}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    {notif.href && (
                      <Link href={notif.href} className="text-primary hover:underline">
                        Open Application →
                      </Link>
                    )}
                  </div>
                </div>
                {!notif.read && <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
