import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-lg border border-transparent bg-clip-padding bg-primary text-primary-foreground transition-all hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px",
        outline:
          "rounded-lg border border-border bg-background transition-all hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "rounded-lg border border-transparent bg-clip-padding bg-secondary text-secondary-foreground transition-all hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        ghost:
          "rounded-lg border border-transparent transition-all hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-muted/50",
        destructive:
          "rounded-lg border border-transparent bg-clip-padding bg-destructive/10 text-destructive transition-all hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-3 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "rounded-lg text-primary underline-offset-4 hover:underline focus-visible:underline",
        // iOS Liquid Glass variants
        liquid:
          "relative overflow-hidden rounded-full border border-white/20 bg-gradient-to-b from-white/40 via-white/10 to-white/5 text-foreground backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_60%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.16)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.98] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.14)] dark:border-white/10 dark:from-white/10 dark:via-white/5 dark:to-white/2 dark:text-foreground dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] dark:before:via-white/40 dark:after:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_60%)] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.5)]",
        "liquid-primary":
          "relative overflow-hidden rounded-full border border-white/30 bg-gradient-to-b from-accent/90 via-accent/80 to-accent/70 text-accent-foreground backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.1),0_8px_32px_rgba(15,157,138,0.4)] transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.3),transparent_60%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(0,0,0,0.12),0_12px_40px_rgba(15,157,138,0.5)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.98] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.08),0_4px_16px_rgba(15,157,138,0.45)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(15,157,138,0.5)] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.25),0_12px_40px_rgba(15,157,138,0.6)]",
        "liquid-glass":
          "relative overflow-hidden rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-2xl backdrop-saturate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:bg-[linear-gradient(180deg,rgba(255,255,255,0.15)_0%,transparent_50%)] hover:bg-white/15 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_40px_rgba(0,0,0,0.14)] focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.98] active:bg-white/12 dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_32px_rgba(0,0,0,0.5)] dark:hover:bg-white/10 dark:before:via-white/30",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
