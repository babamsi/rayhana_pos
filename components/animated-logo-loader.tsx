"use client"

import { useEffect, useState } from "react"
import { RayhanaLogo } from "./rayhana-logo"

interface AnimatedLogoLoaderProps {
  onComplete?: () => void
  duration?: number
}

export function AnimatedLogoLoader({ onComplete, duration = 6000 }: AnimatedLogoLoaderProps) {
  const [phase, setPhase] = useState<"pulse" | "spin" | "bounce" | "fade">("pulse")

  useEffect(() => {
    // Phase transitions for cool animation sequence
    const pulseTimer = setTimeout(() => setPhase("spin"), 1500)
    const spinTimer = setTimeout(() => setPhase("bounce"), 3000)
    const bounceTimer = setTimeout(() => setPhase("fade"), 4500)
    const completeTimer = setTimeout(() => {
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(pulseTimer)
      clearTimeout(spinTimer)
      clearTimeout(bounceTimer)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/5 animate-ping"
          style={{ animationDuration: "3s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-accent/5 animate-ping"
          style={{ animationDuration: "2s", animationDelay: "0.5s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] rounded-full bg-secondary/5 animate-ping"
          style={{ animationDuration: "2.5s", animationDelay: "1s" }}
        />
      </div>

      {/* Logo container with animations */}
      <div
        className={`relative transition-all duration-700 ease-out ${
          phase === "pulse"
            ? "animate-pulse scale-100"
            : phase === "spin"
              ? "animate-spin scale-110"
              : phase === "bounce"
                ? "animate-bounce scale-100"
                : "opacity-0 scale-150"
        }`}
        style={{
          animationDuration: phase === "spin" ? "1.5s" : phase === "bounce" ? "0.8s" : undefined,
        }}
      >
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 blur-xl bg-gradient-to-br from-primary via-accent to-secondary opacity-30 scale-150" />

        {/* Main logo */}
        <RayhanaLogo className="h-24 w-auto relative z-10" />
      </div>

      {/* Loading text */}
      <div className={`mt-8 transition-opacity duration-500 ${phase === "fade" ? "opacity-0" : "opacity-100"}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs tracking-[0.3em] text-muted-foreground font-medium">LOADING</span>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
            <span
              className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-secondary rounded-full"
          style={{
            animation: `progress ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}
