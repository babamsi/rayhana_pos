"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { MenuGrid } from "@/components/menu-grid"
import { CartDrawer } from "@/components/cart-drawer"
import { FloatingCart } from "@/components/floating-cart"
import { OrderHistorySheet } from "@/components/order-history-sheet"
import { ReceiptManagementSheet } from "@/components/receipt-management-sheet"
import { CartProvider, useCart } from "@/components/cart-context"
import { RayhanaLogo } from "@/components/rayhana-logo"
import { ShoppingBag, History, FileText } from "lucide-react"

function OrderHeader({
  onCartClick,
  onHistoryClick,
  onReceiptClick,
}: {
  onCartClick: () => void
  onHistoryClick: () => void
  onReceiptClick: () => void
}) {
  const { itemCount } = useCart()

  return (
    <header className="sticky top-0 z-40 bg-background/98 backdrop-blur-md border-b border-border">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link href="/order" className="flex items-center">
          <RayhanaLogo className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={onReceiptClick}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            title="Menu Items"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={onHistoryClick}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            title="Order History"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={onCartClick}
            className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary/80 transition-colors bg-background"
          >
            <ShoppingBag className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

function OrderContent() {
  const [cartOpen, setCartOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">
        <OrderHeader
          onCartClick={() => setCartOpen(true)}
          onHistoryClick={() => setHistoryOpen(true)}
          onReceiptClick={() => setReceiptOpen(true)}
        />

        <main className="flex-1 pb-24">
          <Suspense
            fallback={<div className="px-4 py-8 text-center text-muted-foreground text-sm">Loading menu...</div>}
          >
            <MenuGrid />
          </Suspense>
        </main>

        <footer className="py-6 px-4 border-t bg-background border-background">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.15em] text-muted-foreground font-medium">© 2025 RAYHANA KITCHEN</p>
            <a
              href="https://maamul.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              𐒑 Maamul
            </a>
          </div>
        </footer>

        <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
        <OrderHistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
        <ReceiptManagementSheet open={receiptOpen} onOpenChange={setReceiptOpen} />
        <FloatingCart onClick={() => setCartOpen(true)} />
      </div>
    </div>
  )
}

export default function OrderPage() {
  return (
    <CartProvider>
      <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
        <OrderContent />
      </Suspense>
    </CartProvider>
  )
}
