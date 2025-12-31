import { supabase } from "@/lib/supabase"
import type { Order } from "@/lib/db/orders"

/**
 * Validate M-Pesa phone number format (254XXXXXXXXX)
 */
export function validateMpesaPhone(phone: string): boolean {
  const phoneRegex = /^254\d{9}$/ // Matches "254" followed by exactly 9 digits
  return phoneRegex.test(phone)
}

/**
 * Format phone number to M-Pesa format (254XXXXXXXXX)
 * Handles inputs like 0712345678, 712345678, etc.
 */
export function formatMpesaPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "")

  // If starts with 0, replace with 254
  if (cleaned.startsWith("0")) {
    return "254" + cleaned.slice(1)
  }

  // If starts with 254, return as is
  if (cleaned.startsWith("254")) {
    return cleaned
  }

  // If starts with 7, add 254 prefix
  if (cleaned.startsWith("7") && cleaned.length === 9) {
    return "254" + cleaned
  }

  // Return cleaned number (assume it's already in correct format)
  return cleaned
}

/**
 * Initiate M-Pesa payment via Supabase function
 */
export async function initiateMpesaPayment(
  amount: number,
  phoneNumber: string,
  orderData: Order
): Promise<{ success: boolean; MerchantRequestID?: string; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URLS!

  try {
    const response = await fetch(`${supabaseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount.toString(),
        phoneNumber: phoneNumber,
        orderData: orderData,
      }),
    })

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        MerchantRequestID: data.MerchantRequestID,
      }
    } else {
      return {
        success: false,
        error: data.error || "Failed to initiate M-Pesa payment",
      }
    }
  } catch (error: any) {
    console.error("Error initiating M-Pesa payment:", error)
    return {
      success: false,
      error: error.message || "An error occurred while processing your payment",
    }
  }
}

/**
 * Save pending order to database
 */
export async function savePendingOrder(
  checkoutRequestId: string,
  orderData: Order
): Promise<void> {
  const { error } = await supabase.from("pending_orders").insert({
    mpesa_checkout_request_id: checkoutRequestId,
    order_data: orderData,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error saving pending order:", error)
    throw new Error(`Failed to save pending order: ${error.message}`)
  }
}

/**
 * Delete pending order after payment completion
 * This is a non-critical operation - failures are logged but not thrown
 */
export async function deletePendingOrder(checkoutRequestId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("pending_orders")
      .delete()
      .eq("mpesa_checkout_request_id", checkoutRequestId)

    if (error) {
      console.warn("Error deleting pending order (non-critical):", error)
      // Don't throw - this is cleanup, order is already saved
    }
  } catch (error) {
    console.warn("Exception deleting pending order (non-critical):", error)
    // Don't throw - this is cleanup, order is already saved
  }
}

/**
 * Get pending order by checkout request ID
 */
export async function getPendingOrder(checkoutRequestId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from("pending_orders")
      .select("order_data")
      .eq("mpesa_checkout_request_id", checkoutRequestId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching pending order:", error)
      return null
    }

    if (!data) {
      console.error("No pending order found for checkout request ID:", checkoutRequestId)
      return null
    }

    // Handle both JSONB and direct object formats
    const orderData = typeof data.order_data === 'string' 
      ? JSON.parse(data.order_data) 
      : data.order_data

    return orderData as Order
  } catch (error: any) {
    console.error("Error parsing pending order:", error)
    return null
  }
}



