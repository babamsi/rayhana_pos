"use client"

import { ArrowRight, ShoppingBag } from "lucide-react"
import { useCart } from "@/components/cart-context"

interface FloatingCartProps {
  onClick: () => void
}

export function FloatingCart({ onClick }: FloatingCartProps) {
  const { itemCount, total } = useCart()

  if (itemCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto px-4 pb-4">
        <button
          onClick={onClick}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 px-5 flex items-center justify-between shadow-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-sm font-bold block">View Cart</span>
              <span className="text-xs opacity-80">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">KES {total.toLocaleString()}</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </button>
      </div>
    </div>
  )
}
