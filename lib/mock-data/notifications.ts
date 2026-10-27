import type { PortalNotification } from "@/lib/types";
import { currentMockUser } from "./users";

export const mockNotifications: PortalNotification[] = [
  {
    id: "notif-1",
    userId: currentMockUser.id,
    applicationId: "app-demo-001",
    kind: "status",
    title: "Application Under Review",
    body: "Your application PX-DEMO-001 is currently under review by the compliance team.",
    createdAt: "2026-10-23T09:20:00.000Z",
    read: false,
    href: "/portal/applications/app-demo-001",
  },
  {
    id: "notif-2",
    userId: currentMockUser.id,
    applicationId: "app-demo-001",
    kind: "info",
    title: "Document Review in Progress",
    body: "Several documents are being reviewed. We'll update you as they progress.",
    createdAt: "2026-10-24T11:25:00.000Z",
    read: true,
    href: "/portal/applications/app-demo-001",
  },
];
