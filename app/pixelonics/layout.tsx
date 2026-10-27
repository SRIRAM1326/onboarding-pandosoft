import { PixelonicsShell } from "@/components/layout/pixelonics-shell";

export default function PixelonicsLayout({ children }: { children: React.ReactNode }) {
  return <PixelonicsShell>{children}</PixelonicsShell>;
}
