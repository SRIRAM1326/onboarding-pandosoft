import Link from "next/link";
import Image from "next/image";
import { cn } from "cn";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  className?: string;
  href?: string;
}

const sizeConfig = {
  sm: {
    width: 90,
    height: 33,
    imgClass: "h-7 sm:h-8",
    textClass: "text-[9px] mt-0.5",
  },
  md: {
    width: 118,
    height: 44,
    imgClass: "h-9 sm:h-10",
    textClass: "text-[10px] mt-1",
  },
  lg: {
    width: 180,
    height: 67,
    imgClass: "h-14 sm:h-16",
    textClass: "text-xs mt-1.5",
  },
};

export function BrandLogo({
  size = "md",
  align = "left",
  className,
  href,
}: BrandLogoProps) {
  const config = sizeConfig[size];

  const content = (
    <div
      className={cn(
        "flex flex-col select-none",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      <Image
        src="/pandosoft-logo.png"
        alt="Pandosoft India Private Limited"
        width={config.width}
        height={config.height}
        priority
        style={{ width: "auto" }}
        className={cn("object-contain shrink-0", config.imgClass)}
      />
      <span
        className={cn(
          "font-medium text-muted-foreground whitespace-nowrap tracking-tight",
          config.textClass
        )}
      >
        Powered by Pixelonics
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

