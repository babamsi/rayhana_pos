"use client"

import { RayhanaLogo } from "./rayhana-logo"

interface LogoSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
}

export function LogoSpinner({ size = "md", text }: LogoSpinnerProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* Rotating glow ring */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-secondary opacity-20 blur-md animate-spin"
          style={{ animationDuration: "2s" }}
        />

        {/* Pulsing logo */}
        <div className="animate-pulse">
          <RayhanaLogo className={`${sizeClasses[size]} w-auto`} />
        </div>
      </div>

      {text && <span className="text-[10px] tracking-[0.2em] text-muted-foreground">{text}</span>}
    </div>
  )
}
