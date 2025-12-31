import { supabase } from "@/lib/supabase"

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  items: OrderItem[]
  total: number
  paymentMethod: "cash" | "mpesa"
  mpesaNumber?: string
  cashReceived?: number
  change?: number
  timestamp: string
}

interface OrderRow {
  id: number
  order_id: string
  item_name: string
  quantity: number
  price: number
  payment_method: "cash" | "mpesa"
  phone_number: string | null
  total_amount: number
  cash_received: number | null
  change_amount: number | null
  timestamp: string
}

/**
 * Save an order to the database
 * Each item in the order is saved as a separate row
 */
export async function saveOrder(order: Order): Promise<void> {
  const orderRows = order.items.map((item) => ({
    order_id: order.id,
    item_name: item.name,
    quantity: item.quantity,
    price: item.price,
    payment_method: order.paymentMethod,
    phone_number: order.paymentMethod === "mpesa" ? order.mpesaNumber || null : null,
    total_amount: order.total,
    cash_received: order.paymentMethod === "cash" ? order.cashReceived || null : null,
    change_amount: order.paymentMethod === "cash" ? order.change || null : null,
    timestamp: order.timestamp,
  }))

  const { error } = await supabase.from("rayhana").insert(orderRows)

  if (error) {
    console.error("Error saving order:", error)
    throw new Error(`Failed to save order: ${error.message}`)
  }
}

/**
 * Fetch all orders from the database
 * Groups items by order_id and converts to Order format
 */
export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("rayhana")
    .select("*")
    .order("timestamp", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // Group rows by order_id
  const ordersMap = new Map<string, OrderRow[]>()

  for (const row of data as OrderRow[]) {
    const existing = ordersMap.get(row.order_id) || []
    ordersMap.set(row.order_id, [...existing, row])
  }

  // Convert grouped rows to Order format
  const orders: Order[] = []

  for (const [orderId, rows] of ordersMap.entries()) {
    const firstRow = rows[0]

    const order: Order = {
      id: firstRow.order_id,
      items: rows.map((row, index) => ({
        id: row.id.toString(),
        name: row.item_name,
        price: row.price,
        quantity: row.quantity,
      })),
      total: firstRow.total_amount,
      paymentMethod: firstRow.payment_method,
      mpesaNumber: firstRow.phone_number || undefined,
      cashReceived: firstRow.cash_received || undefined,
      change: firstRow.change_amount || undefined,
      timestamp: firstRow.timestamp,
    }

    orders.push(order)
  }

  return orders
}

/**
 * Delete all orders from the database
 */
export async function clearAllOrders(): Promise<void> {
  const { error } = await supabase.from("rayhana").delete().neq("id", 0) // Delete all rows

  if (error) {
    console.error("Error clearing orders:", error)
    throw new Error(`Failed to clear orders: ${error.message}`)
  }
}

/**
 * Delete a specific order by order_id
 */
export async function deleteOrder(orderId: string): Promise<void> {
  const { error } = await supabase.from("rayhana").delete().eq("order_id", orderId)

  if (error) {
    console.error("Error deleting order:", error)
    throw new Error(`Failed to delete order: ${error.message}`)
  }
}

