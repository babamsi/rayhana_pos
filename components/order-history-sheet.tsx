"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { X, Calendar, Banknote, Smartphone, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchOrders, clearAllOrders, type Order } from "@/lib/db/orders"

interface OrderHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

export function OrderHistorySheet({ open, onOpenChange }: OrderHistorySheetProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadOrders()
    }
  }, [open])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const fetchedOrders = await fetchOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      // Fallback to localStorage for backward compatibility
      const storedOrders = JSON.parse(localStorage.getItem("orders") || "[]")
      setOrders(storedOrders)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear all order history?")) {
      try {
        await clearAllOrders()
        setOrders([])
        // Also clear localStorage for backward compatibility
        localStorage.setItem("orders", "[]")
      } catch (error) {
        console.error("Failed to clear orders:", error)
        alert("Failed to clear order history. Please try again.")
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90dvh] max-h-[90dvh] rounded-t-3xl p-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-card flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">Order History</h2>
            <p className="text-xs text-muted-foreground">{orders.length} orders</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-background"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No orders yet</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full p-4 text-left flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{order.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{order.items.length} items</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{formatDate(order.timestamp)}</p>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">KES {order.total.toLocaleString()}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {order.paymentMethod === "cash" ? (
                            <>
                              <Banknote className="w-3 h-3" />
                              <span>Cash</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-3 h-3" />
                              <span>M-Pesa</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {expandedOrder === order.id && (
                    <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground">ITEMS</p>
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-semibold">KES {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border pt-3 space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                          <span>Total</span>
                          <span className="text-primary">KES {order.total.toLocaleString()}</span>
                        </div>
                        {order.paymentMethod === "cash" && order.cashReceived && (
                          <>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Cash Received</span>
                              <span>KES {order.cashReceived.toLocaleString()}</span>
                            </div>
                            {order.change !== undefined && order.change > 0 && (
                              <div className="flex justify-between text-sm text-accent font-semibold">
                                <span>Change</span>
                                <span>KES {order.change.toLocaleString()}</span>
                              </div>
                            )}
                          </>
                        )}
                        {order.paymentMethod === "mpesa" && order.mpesaNumber && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>M-Pesa Number</span>
                            <span>{order.mpesaNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {orders.length > 0 && (
              <div className="border-t border-border p-4 bg-card flex-shrink-0">
                <Button
                  onClick={handleClearHistory}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                >
                  Clear History
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
