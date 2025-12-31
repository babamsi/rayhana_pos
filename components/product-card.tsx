"use client"

import type React from "react"

import { Plus, Minus } from "lucide-react"
import { useCart } from "@/components/cart-context"
import Image from "next/image"
import { useState, useRef } from "react"

interface Product {
  id: string
  name: string
  price: number
  category: string
  description?: string
  image?: string
}

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem, updateQuantity } = useCart()
  const cartItem = items.find((i) => i.id === product.id)
  const quantity = cartItem?.quantity || 0

  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance

    if (isLeftSwipe) {
      // Swipe left to add to cart
      if (navigator.vibrate) {
        navigator.vibrate(10) // Adding haptic feedback
      }

      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      })
    }
  }

  const handleAddClick = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10) // Haptic feedback on button press
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (navigator.vibrate) {
      navigator.vibrate(10) // Haptic feedback on quantity change
    }
    updateQuantity(product.id, newQuantity)
  }

  return (
    <div
      ref={cardRef}
      className="flex items-center gap-3 py-4 border-b border-border last:border-0 group touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
        {product.image ? (
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 bg-sidebar-border">
            <svg className="w-6 h-6 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-foreground font-bold leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <p className="text-sm text-primary font-semibold mt-1.5">KES {product.price}</p>
      </div>

      {quantity === 0 ? (
        <button
          onClick={handleAddClick}
          className="rounded-full text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0 shadow-sm bg-background w-10 h-10 active:scale-95"
        >
          <Plus className="h-6 w-6 text-primary" />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0 rounded-full p-1 bg-background">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors active:scale-95"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm text-center w-6 font-semibold">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
