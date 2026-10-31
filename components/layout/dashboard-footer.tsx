import { cn } from "cn";

interface DashboardFooterProps {
  className?: string;
}

export function DashboardFooter({ className }: DashboardFooterProps) {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-border/40 bg-card/40 backdrop-blur-sm py-4 px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      <div className="mx-auto max-w-7xl text-center text-xs text-muted-foreground/90">
        © 2026 Pandosoft India Private Limited | Technology &amp; Operations Partner: Groen Pixelonics Tech Solutions
      </div>
    </footer>
  );
}
