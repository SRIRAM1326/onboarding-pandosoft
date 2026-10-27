import type { User } from "@/lib/types";

export const mockUsers: User[] = [
  {
    id: "usr-cust-1",
    name: "Arjun Mehta",
    email: "arjun.mehta@orbitrade.example",
    phone: "+91 98765 43210",
    role: "customer",
    title: "Managing Director",
    organization: "Orbitrade Solutions Pvt. Ltd.",
    initials: "AM",
    createdAt: "2026-10-10T09:15:00.000Z",
  },
  {
    id: "usr-rev-1",
    name: "Neha Kulkarni",
    email: "neha.kulkarni@pixelonics.example",
    phone: "+91 98765 11111",
    role: "compliance_reviewer",
    title: "Compliance Reviewer",
    organization: "Pixelonics",
    initials: "NK",
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "usr-app-1",
    name: "Vikram Sethi",
    email: "vikram.sethi@pixelonics.example",
    phone: "+91 98765 22222",
    role: "compliance_approver",
    title: "Compliance Approver",
    organization: "Pixelonics",
    initials: "VS",
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "usr-adm-1",
    name: "Radhika Menon",
    email: "radhika.menon@pixelonics.example",
    phone: "+91 98765 33333",
    role: "administrator",
    title: "Head of Compliance",
    organization: "Pixelonics",
    initials: "RM",
    createdAt: "2026-09-01T08:00:00.000Z",
  },
];

export const currentMockUser = mockUsers[0];
export const currentMockStaffUser = mockUsers[3];
