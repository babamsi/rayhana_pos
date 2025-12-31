"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { Minus, Plus, Trash2, Banknote, Smartphone } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-context"
import { useToast } from "@/hooks/use-toast"
import { saveOrder, type Order } from "@/lib/db/orders"
import { validateMpesaPhone, formatMpesaPhone, initiateMpesaPayment, savePendingOrder, deletePendingOrder, getPendingOrder } from "@/lib/mpesa"
import io, { Socket } from "socket.io-client"

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PaymentMethod = "cash" | "mpesa"

function generateOrderId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let id = "ORD"
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

function NumberPad({
  onNumberClick,
  onDelete,
}: {
  onNumberClick: (num: string) => void
  onDelete: () => void
}) {
  const buttons = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "00", "⌫"]

  const handleClick = (value: string) => {
    if (navigator.vibrate) navigator.vibrate(10)
    if (value === "⌫") {
      onDelete()
    } else {
      onNumberClick(value)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map((btn) => (
        <button
          key={btn}
          onClick={() => handleClick(btn)}
          className="h-16 rounded-2xl bg-card border-2 border-border font-bold text-xl hover:bg-muted active:scale-95 transition-all"
        >
          {btn}
        </button>
      ))}
    </div>
  )
}

type MpesaStatus = "idle" | "initiated" | "processing" | "completed" | "failed"

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { items, updateQuantity, total, itemCount, clearCart } = useCart()
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [mpesaNumber, setMpesaNumber] = useState("")
  const [cashReceived, setCashReceived] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>("idle")
  const [requestId, setRequestId] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)

  // Set up Socket.IO connection for M-Pesa webhook
  useEffect(() => {
    if (paymentMethod === "mpesa" && mpesaStatus !== "idle") {
      const socketConnection = io("https://webhook-alqurashi.onrender.com")

      socketConnection.on("connect", () => {
        console.log("Connected to M-Pesa WebSocket server")
      })

      socketConnection.on("paymentStatus", (data) => {
        console.log("Received payment status:", data)
        if (data && data.MerchantRequestID === requestId) {
          const { ResultCode, ResultDesc, MerchantRequestID, CallbackMetadata, TransID } = data

          if (ResultCode === 0) {
            setMpesaStatus("completed")
            toast({
              title: "Payment Received! ✓",
              description: "M-Pesa payment completed successfully",
              duration: 4000,
            })
            createOrderAfterMpesaPayment(CallbackMetadata, MerchantRequestID)
          } else {
            setMpesaStatus("failed")
            setIsProcessing(false)
            toast({
              title: "Payment Failed",
              description: ResultDesc || "M-Pesa payment failed",
              variant: "destructive",
              duration: 4000,
            })
          }
        }
      })

      setSocket(socketConnection)

      return () => {
        socketConnection.disconnect()
      }
    }
  }, [paymentMethod, mpesaStatus, requestId, toast])

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setPaymentMethod(null)
      setMpesaNumber("")
      setCashReceived("")
      setMpesaStatus("idle")
      setRequestId(null)
      setPhoneError(null)
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
    }, 300)
  }

  const handleClearCart = () => {
    if (navigator.vibrate) navigator.vibrate([10, 50, 10])
    if (confirm("Clear all items from cart?")) {
      clearCart()
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "") // Remove non-digits
    setMpesaNumber(value)

    if (value.length > 0) {
      const formatted = formatMpesaPhone(value)
      // Only show error if user has entered enough digits to validate (at least 9)
      if (value.length >= 9) {
        if (formatted.length === 12 && formatted.startsWith("254")) {
          // Valid format
          if (validateMpesaPhone(formatted)) {
            setPhoneError(null)
          } else {
            setPhoneError("Invalid phone number format")
          }
        } else if (!formatted.startsWith("254")) {
          setPhoneError("Phone number must start with 254")
        } else if (formatted.length !== 12) {
          setPhoneError("Phone number must be exactly 12 digits long")
        } else {
          setPhoneError("Invalid phone number format")
        }
      } else {
        // Clear error while user is still typing (less than 9 digits)
        setPhoneError(null)
      }
    } else {
      setPhoneError(null)
    }
  }

  const handleMpesaPayment = async () => {
    if (navigator.vibrate) navigator.vibrate(10)
    setIsProcessing(true)
    setMpesaStatus("initiated")

    try {
      const formattedPhone = formatMpesaPhone(mpesaNumber)
      
      if (!validateMpesaPhone(formattedPhone)) {
        throw new Error("Invalid phone number format")
      }

      const orderId = generateOrderId()
      const orderData: Order = {
        id: orderId,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total,
        paymentMethod: "mpesa",
        mpesaNumber: formattedPhone
      }

      // Initiate M-Pesa payment
      const result = await initiateMpesaPayment(total, formattedPhone, orderData)

      if (result.success && result.MerchantRequestID) {
        setMpesaStatus("processing")
        setRequestId(result.MerchantRequestID)
        
        // Save pending order
        await savePendingOrder(result.MerchantRequestID, orderData)

        toast({
          title: "M-Pesa Payment Initiated",
          description: "Please check your phone for the STK push",
          duration: 4000,
        })
      } else {
        throw new Error(result.error || "Failed to initiate M-Pesa payment")
      }
    } catch (error: any) {
      console.error("Error processing M-Pesa payment:", error)
      setMpesaStatus("failed")
      setIsProcessing(false)
      toast({
        title: "Error",
        description: error.message || "Failed to initiate M-Pesa payment. Please try again.",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  const createOrderAfterMpesaPayment = async (callbackMetadata: any, checkoutRequestID: string) => {
    try {
      const amount = callbackMetadata.Item.find((item: any) => item.Name === "Amount")?.Value
      const mpesaReceiptNumber = callbackMetadata.Item.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value
      const transactionDateTime = callbackMetadata.Item.find((item: any) => item.Name === "TransactionDate")?.Value
      const transactionDate = transactionDateTime?.toString() || ""

      // Try to retrieve the pending order, but don't fail if it doesn't exist
      let pendingOrder: Order | null = null
      try {
        pendingOrder = await getPendingOrder(checkoutRequestID)
      } catch (error) {
        console.warn("Could not retrieve pending order, will reconstruct from current state:", error)
      }

      // Create the final order - use pending order if available, otherwise reconstruct from current state
      let finalOrder: Order
      
      if (pendingOrder) {
        // Use data from pending order
        finalOrder = {
          ...pendingOrder,
          paymentMethod: "mpesa",
          mpesaNumber: pendingOrder.mpesaNumber
        }
      } else {
        // Reconstruct order from current cart state (fallback)
        console.warn("Reconstructing order from current cart state")
        const orderId = generateOrderId()
        finalOrder = {
          id: orderId,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          total,
          paymentMethod: "mpesa",
          mpesaNumber: mpesaNumber || "Unknown"
        }
      }

      // Save the order - this is the critical operation
      await saveOrder(finalOrder)

      // Try to delete pending order, but don't fail if it doesn't work
      try {
        await deletePendingOrder(checkoutRequestID)
      } catch (error) {
        console.warn("Could not delete pending order, but order was saved successfully:", error)
        // Order is already saved, so we continue
      }

      if (navigator.vibrate) navigator.vibrate([50, 100, 50])

      clearCart()
      setIsProcessing(false)
      handleClose()

      toast({
        title: `Order ${finalOrder.id} Complete! ✓`,
        description: (
          <div className="mt-2 space-y-1">
            <div className="text-sm font-semibold">
              KES {total.toLocaleString()} • M-Pesa
            </div>
            {mpesaReceiptNumber && (
              <div className="text-xs text-muted-foreground">Receipt: {mpesaReceiptNumber}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </div>
          </div>
        ),
        duration: 4000,
      })
    } catch (error: any) {
      console.error("Failed to create order after M-Pesa payment:", error)
      setIsProcessing(false)
      toast({
        title: "Error",
        description: error.message || "Failed to complete order. Please contact support.",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  const handlePaymentComplete = async () => {
    if (paymentMethod === "mpesa") {
      await handleMpesaPayment()
      return
    }

    // Cash payment flow
    if (navigator.vibrate) navigator.vibrate(10)
    setIsProcessing(true)

    await new Promise((resolve) => setTimeout(resolve, 600))

    const orderId = generateOrderId()
    const cashChange = paymentMethod === "cash" && cashReceived ? Number.parseFloat(cashReceived) - total : 0

    const orderData: Order = {
      id: orderId,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total,
      paymentMethod: "cash",
      cashReceived: Number.parseFloat(cashReceived || "0"),
      change: cashChange
    }

    try {
      await saveOrder(orderData)

      if (navigator.vibrate) navigator.vibrate([50, 100, 50])

      clearCart()
      setIsProcessing(false)
      handleClose()

      toast({
        title: `Order ${orderId} Complete! ✓`,
        description: (
          <div className="mt-2 space-y-1">
            <div className="text-sm font-semibold">KES {total.toLocaleString()} • Cash</div>
            {cashChange > 0 && (
              <div className="text-sm text-accent font-semibold">Change: KES {cashChange.toLocaleString()}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </div>
          </div>
        ),
        duration: 4000,
      })
    } catch (error) {
      console.error("Failed to save order:", error)
      setIsProcessing(false)
      toast({
        title: "Error",
        description: "Failed to save order. Please try again.",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  const handleCashPayment = async () => {
    if (navigator.vibrate) navigator.vibrate(10)
    setPaymentMethod("cash")
    setIsProcessing(true)

    await new Promise((resolve) => setTimeout(resolve, 400))

    const orderId = generateOrderId()

    const orderData = {
      id: orderId,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total,
      paymentMethod: "cash" as PaymentMethod,
      cashReceived: total,
      change: 0
    }

    try {
      await saveOrder(orderData)
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])

      clearCart()
      setIsProcessing(false)
      handleClose()

      toast({
        title: `Order ${orderId} Complete! ✓`,
        description: (
          <div className="mt-2 space-y-1">
            <div className="text-sm font-semibold">KES {total.toLocaleString()} • Cash</div>
            <div className="text-xs text-muted-foreground mt-1">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </div>
          </div>
        ),
        duration: 4000,
      })
    } catch (error) {
      console.error("Failed to save order:", error)
      setIsProcessing(false)
      toast({
        title: "Error",
        description: "Failed to save order. Please try again.",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  const handleNumberClick = (num: string) => {
    setCashReceived((prev) => prev + num)
  }

  const handleDelete = () => {
    setCashReceived((prev) => prev.slice(0, -1))
  }

  const handleQuickAmount = (amount: number) => {
    if (navigator.vibrate) navigator.vibrate(10)
    setCashReceived(amount.toString())
  }

  const cashChange = paymentMethod === "cash" && cashReceived ? Number.parseFloat(cashReceived) - total : 0
  const isValidCash = paymentMethod === "cash" && Number.parseFloat(cashReceived || "0") >= total
  const formattedMpesaPhone = mpesaNumber ? formatMpesaPhone(mpesaNumber) : ""
  // Enable button if phone number is valid (12 digits starting with 254, no errors)
  // Accept numbers starting with 0, 7, or 254 that can be formatted to 254XXXXXXXXX
  const isValidMpesa = 
    paymentMethod === "mpesa" && 
    mpesaNumber.length >= 9 && 
    formattedMpesaPhone.length === 12 && 
    formattedMpesaPhone.startsWith("254") &&
    validateMpesaPhone(formattedMpesaPhone) && 
    !phoneError

  // Debug log (remove in production)
  if (paymentMethod === "mpesa" && process.env.NODE_ENV === "development") {
    console.log("M-Pesa Validation:", {
      mpesaNumber,
      formattedMpesaPhone,
      isValidMpesa,
      phoneError,
      mpesaNumberLength: mpesaNumber.length,
      formattedLength: formattedMpesaPhone.length,
      startsWith254: formattedMpesaPhone.startsWith("254"),
      validates: validateMpesaPhone(formattedMpesaPhone),
    })
  }

  const quickAmounts = [
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
    Math.ceil(total / 1000) * 1000,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v > total)

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[92dvh] max-h-[92dvh] rounded-t-3xl p-0 flex flex-col overflow-hidden">
        {(isProcessing && paymentMethod === "cash") && (
          <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-sm font-bold">Processing Payment...</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card flex-shrink-0">
          <div>
            <h2 className="font-bold text-xl">
              {!paymentMethod && "Checkout"}
              {paymentMethod === "cash" && "Cash Payment"}
              {paymentMethod === "mpesa" && "M-Pesa Payment"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              KES {total.toLocaleString()} • {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          {paymentMethod && (
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10)
                setPaymentMethod(null)
                setCashReceived("")
                setMpesaNumber("")
              }}
              className="text-sm font-bold text-primary hover:underline"
            >
              Change
            </button>
          )}
        </div>

        {!paymentMethod ? (
          <>
            {/* Cart Items */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <span className="text-4xl">🛒</span>
                </div>
                <p className="text-muted-foreground font-medium">Cart is empty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                        <p className="text-sm text-primary font-semibold">KES {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full p-1 bg-background">
                        <button
                          onClick={() => {
                            if (navigator.vibrate) navigator.vibrate(10)
                            updateQuantity(item.id, item.quantity - 1)
                          }}
                          className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-95"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="w-4 h-4 text-destructive" />
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => {
                            if (navigator.vibrate) navigator.vibrate(10)
                            updateQuantity(item.id, item.quantity + 1)
                          }}
                          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-primary-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border p-5 bg-card space-y-3 flex-shrink-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Select Payment</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleCashPayment}
                      disabled={isProcessing}
                      className="h-20 rounded-2xl border-2 border-border bg-background hover:border-primary transition-colors flex flex-col items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <Banknote className="w-6 h-6 text-accent" />
                      <span className="font-bold text-sm">Cash</span>
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(10)
                        setPaymentMethod("mpesa")
                      }}
                      disabled={isProcessing}
                      className="h-20 rounded-2xl border-2 border-border bg-background hover:border-primary transition-colors flex flex-col items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <Smartphone className="w-6 h-6 text-accent" />
                      <span className="font-bold text-sm">M-Pesa</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Payment Views */}
            {paymentMethod === "cash" && (
              <div className="flex-1 flex flex-col p-5 overflow-hidden">
                <div className="mb-4">
                  <div className="bg-card rounded-2xl p-5 border-2 border-border text-center mb-3">
                    <div className="text-xs font-bold text-muted-foreground mb-2">CASH RECEIVED</div>
                    <div className="text-4xl font-bold text-primary">
                      {cashReceived || "0"}
                      <span className="text-lg text-muted-foreground ml-2">KES</span>
                    </div>
                  </div>

                  {cashReceived && Number.parseFloat(cashReceived) >= total && (
                    <div className="bg-accent/10 rounded-xl p-3 border border-accent/30 flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground">CHANGE</span>
                      <span className="text-2xl font-bold text-accent">{cashChange.toLocaleString()} KES</span>
                    </div>
                  )}
                </div>

                {quickAmounts.length > 0 && !cashReceived && (
                  <div className="mb-4">
                    <div className="flex gap-2">
                      {quickAmounts.slice(0, 3).map((amount) => (
                        <button
                          key={amount}
                          onClick={() => handleQuickAmount(amount)}
                          className="flex-1 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 active:scale-95 transition-all"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Number Pad */}
                <div className="flex-1 flex flex-col justify-between">
                  <NumberPad onNumberClick={handleNumberClick} onDelete={handleDelete} />

                  {/* Complete Button */}
                  <Button
                    onClick={handlePaymentComplete}
                    disabled={!isValidCash || isProcessing}
                    className="w-full h-16 rounded-2xl text-lg font-bold mt-4"
                  >
                    Complete Payment
                  </Button>
                </div>
              </div>
            )}

            {paymentMethod === "mpesa" && (
              <div className="flex-1 flex flex-col p-5">
                <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="254XXXXXXXXX or 07XX XXX XXX"
                      value={mpesaNumber}
                      onChange={handlePhoneChange}
                      className={`w-full h-16 px-5 rounded-2xl border-2 bg-card text-xl font-bold focus:outline-none ${
                        phoneError ? "border-destructive" : "border-border focus:border-primary"
                      }`}
                      autoFocus
                      maxLength={12}
                    />
                    {phoneError && (
                      <p className="text-xs text-destructive mt-1">{phoneError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Format: 254XXXXXXXXX (12 digits)
                    </p>
                  </div>

                  <div className="bg-accent/5 rounded-xl p-4 border border-accent/10">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      An STK push will be sent to this number. Enter your M-Pesa PIN on your phone to complete payment.
                    </p>
                  </div>

                  {mpesaStatus === "initiated" && (
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                      <p className="text-xs text-blue-600 font-medium">
                        M-Pesa payment initiated. Please check your phone for the STK push.
                      </p>
                    </div>
                  )}

                  {mpesaStatus === "processing" && (
                    <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-yellow-600 font-medium">
                          Processing M-Pesa payment. Please complete the payment on your phone.
                        </p>
                      </div>
                    </div>
                  )}

                  {mpesaStatus === "failed" && (
                    <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
                      <p className="text-xs text-destructive font-medium">
                        M-Pesa payment failed. Please try again or choose a different payment method.
                      </p>
                    </div>
                  )}
                </div>

                {/* Button Section - Always visible at bottom, outside scrollable area */}
                <div className="flex-shrink-0 pt-4 mt-4 border-t border-border bg-card">
                  <button
                    onClick={handlePaymentComplete}
                    disabled={ isProcessing || mpesaStatus === "processing" || mpesaStatus === "initiated"}
                    className="w-full h-16 rounded-2xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mpesaStatus === "processing" ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Processing Payment...
                      </>
                    ) : mpesaStatus === "initiated" ? (
                      "Payment Initiated"
                    ) : (
                      "Send STK Push"
                    )}
                  </button>
                  {!isValidMpesa && mpesaNumber.length > 0 && mpesaNumber.length < 9 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Enter at least 9 digits (e.g., 0712345678 or 254712345678)
                    </p>
                  )}
                  {!isValidMpesa && mpesaNumber.length >= 9 && phoneError && (
                    <p className="text-xs text-destructive mt-2 text-center">
                      {phoneError}
                    </p>
                  )}
                  {!isValidMpesa && mpesaNumber.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Enter your M-Pesa phone number to continue
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
