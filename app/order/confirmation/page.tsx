"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { RayhanaLogo } from "@/components/rayhana-logo"
import { Check, MapPin, Phone, User, Clock, Car, Home } from "lucide-react"
import { Suspense } from "react"

function ConfirmationContent() {
  const searchParams = useSearchParams()

  const orderId = searchParams.get("id") || "ORD000000"
  const type = searchParams.get("type") || "drive-thru"
  const name = searchParams.get("name") || ""
  const phone = searchParams.get("phone") || ""
  const address = searchParams.get("address") || ""
  const total = searchParams.get("total") || "0"
  const items = searchParams.get("items") || ""

  const isDelivery = type === "home-delivery"

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <RayhanaLogo className="h-8 w-auto" />
            </Link>
            <Link
              href="/order"
              className="text-[10px] tracking-[0.15em] text-foreground hover:text-muted-foreground transition-colors"
            >
              ORDER MORE
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center bg-accent">
              <Check className="text-success w-10 h-10" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-medium mb-2">Order Confirmed</h1>
            <p className="text-muted-foreground text-sm">
              {isDelivery
                ? "Your order is being prepared and will be delivered soon."
                : "Your order is being prepared. Please come to our location for pickup."}
            </p>
          </div>

          {/* Order Reference Card */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/40">
              <span className="text-xs text-muted-foreground tracking-wide">ORDER REFERENCE</span>
              <span className="font-mono font-semibold tracking-wider text-primary">{orderId}</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${isDelivery ? "bg-secondary/80" : "bg-primary/20"}`}
              >
                {isDelivery ? (
                  <Home className="w-4 h-4 text-secondary-foreground" />
                ) : (
                  <Car className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{isDelivery ? "Home Delivery" : "Drive Thru"}</p>
                <p className="text-xs text-muted-foreground">{isDelivery ? "M-Pesa Payment" : "Cash on Pickup"}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{decodeURIComponent(name)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{decodeURIComponent(phone)}</span>
              </div>
              {isDelivery && address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>{decodeURIComponent(address)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          {items && (
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <h3 className="font-medium mb-3 text-xs tracking-wide text-muted-foreground">ORDER ITEMS</h3>
              <div className="space-y-2 text-sm">
                {decodeURIComponent(items)
                  .split("|")
                  .map((item, i) => (
                    <div key={i} className="text-foreground">
                      {item}
                    </div>
                  ))}
              </div>
              <div className="flex justify-between font-medium pt-3 mt-3 border-t border-border/40">
                <span>Total</span>
                <span className="text-primary">KES {Number(total).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Estimated Time */}
          <div className="bg-primary/10 rounded-xl border border-primary/20 p-4 mb-6 flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Estimated Time</p>
              <p className="text-xs text-muted-foreground">{isDelivery ? "30-45 minutes" : "15-20 minutes"}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/order"
              className="block w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              Order More
            </Link>
            <Link
              href="/"
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Back to Home
            </Link>
          </div>
        </main>

        <footer className="py-6 px-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.15em] text-muted-foreground">© 2025 RAYHANA KITCHEN</p>
            <a
              href="https://maamul.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
            >
              ⵙ Maamul
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}
