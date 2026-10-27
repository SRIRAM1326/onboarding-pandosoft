import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 text-[15px] font-semibold whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 active:scale-[0.97] transition-all duration-200 -webkit-tap-highlight-color-transparent touch-action-manipulation",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,122,255,0.3)] hover:brightness-110 active:brightness-90",
        outline:
          "rounded-full border border-border/60 bg-[rgba(255,255,255,0.7)] text-foreground backdrop-blur-xl backdrop-saturate-180 shadow-[0_1px_1px_rgba(0,0,0,0.02)] hover:bg-[rgba(255,255,255,0.9)] dark:bg-[rgba(28,28,30,0.7)] dark:hover:bg-[rgba(28,28,30,0.9)]",
        secondary:
          "rounded-full bg-secondary text-secondary-foreground hover:bg-[rgba(118,118,128,0.16)] dark:hover:bg-[rgba(118,118,128,0.32)]",
        ghost:
          "rounded-full hover:bg-[rgba(118,118,128,0.12)] active:bg-[rgba(118,118,128,0.18)] dark:hover:bg-[rgba(118,118,128,0.24)] dark:active:bg-[rgba(118,118,128,0.36)]",
        destructive:
          "rounded-full bg-destructive text-destructive-foreground shadow-[0_1px_2px_rgba(255,59,48,0.3)] hover:brightness-110 active:brightness-90",
        link: "rounded-full text-primary underline-offset-4 hover:underline focus-visible:underline",
        // iOS Liquid Glass variants
        liquid:
          "relative overflow-hidden rounded-full border border-white/40 bg-[rgba(255,255,255,0.6)] text-foreground backdrop-blur-2xl backdrop-saturate-200 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.75)] focus-visible:ring-2 focus-visible:ring-primary/50 dark:border-white/10 dark:bg-[rgba(28,28,30,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] dark:hover:bg-[rgba(28,28,30,0.75)]",
        "liquid-primary":
          "relative overflow-hidden rounded-full bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(0,122,255,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(0,122,255,0.5)] hover:brightness-110",
        "liquid-glass":
          "relative overflow-hidden rounded-full border border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.2)_100%)] text-foreground backdrop-blur-2xl backdrop-saturate-200 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.7)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.3)_100%)] dark:border-white/15 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.06)_100%)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] dark:hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.1)_100%)]",
        ios: "rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:opacity-70",
        "ios-plain": "rounded-full text-primary hover:bg-[rgba(0,122,255,0.1)] active:bg-[rgba(0,122,255,0.18)]",
        "ios-gray": "rounded-full bg-[rgba(118,118,128,0.12)] text-foreground hover:bg-[rgba(118,118,128,0.18)] active:bg-[rgba(118,118,128,0.28)] dark:bg-[rgba(118,118,128,0.24)] dark:hover:bg-[rgba(118,118,128,0.36)]",
      },
      size: {
        default:
          "h-10 gap-1.5 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-2.5 text-[13px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-[14px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-[16px] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-10",
        "icon-xs":
          "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9",
        "icon-lg": "size-12",
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
