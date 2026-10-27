"use client"

import React, { useState } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "cn"

interface WaveLiquidButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  showIcon?: boolean
}

export default function WaveLiquidButton({
  label = "Start Onboarding",
  showIcon = true,
  className,
  ...props
}: WaveLiquidButtonProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative h-12 w-full overflow-hidden rounded-xl border border-blue-600 font-semibold text-xs shadow-md transition-all",
        className
      )}
      {...props}
    >
      {/* Background container */}
      <div className="absolute inset-0 bg-slate-900" />

      {/* Rising Liquid Container */}
      <div
        className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: hovered ? "translateY(0%)" : "translateY(100%)" }}
      >
        <div className="absolute inset-0 bg-blue-600" />
        {/* Animated wave layers */}
        <div
          className="absolute -top-[120px] left-1/2 h-[240px] w-[240%] -translate-x-1/2 animate-spin rounded-[42%] bg-cyan-400 opacity-80"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute -top-[120px] left-1/2 h-[240px] w-[250%] -translate-x-1/2 animate-spin rounded-[40%] bg-blue-600 opacity-90"
          style={{ animationDuration: "2.5s" }}
        />
      </div>

      <span className="relative z-10 flex items-center justify-center gap-2 font-bold text-white">
        {label}
        {showIcon && (
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        )}
      </span>
    </button>
  )
}

export { WaveLiquidButton }
