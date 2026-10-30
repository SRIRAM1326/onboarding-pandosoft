import Link from "next/link";
import { cn } from "cn";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  className?: string;
  href?: string;
}

export function BrandLogo({
  size = "md",
  align = "left",
  className,
  href,
}: BrandLogoProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col select-none",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      <span
        className={cn(
          "font-black tracking-widest text-foreground font-mono leading-none",
          size === "sm" && "text-base tracking-wider",
          size === "md" && "text-lg tracking-widest",
          size === "lg" && "text-2xl sm:text-3xl tracking-[0.2em]"
        )}
      >
        PANDOSOFT
      </span>
      <span
        className={cn(
          "font-bold uppercase tracking-[0.18em] text-muted-foreground",
          size === "sm" && "text-[8px] mt-0.5",
          size === "md" && "text-[9px] mt-1",
          size === "lg" && "text-[11px] mt-1.5"
        )}
      >
        POWERED BY PIXELONICS
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
