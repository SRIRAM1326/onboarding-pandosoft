import { PandosoftShell } from "@/components/layout/pandosoft-shell";

export default function PandosoftLayout({ children }: { children: React.ReactNode }) {
  return <PandosoftShell>{children}</PandosoftShell>;
}
