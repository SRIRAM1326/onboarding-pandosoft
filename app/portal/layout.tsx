import { CustomerShell } from "@/components/layout/customer-shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
