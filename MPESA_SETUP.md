# M-Pesa Payment Setup Guide

This project now includes M-Pesa payment integration with Socket.IO webhook listening, similar to the reference implementation.

## Features

- ✅ M-Pesa STK Push payment initiation
- ✅ Socket.IO webhook listening for payment status
- ✅ Phone number validation (254XXXXXXXXX format)
- ✅ Pending orders management
- ✅ Automatic order creation after payment confirmation
- ✅ Real-time payment status updates

## Prerequisites

1. Supabase project with Edge Function for M-Pesa payment
2. Socket.IO server running at `https://webhook-alqurashi.onrender.com`
3. Environment variables configured

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
# or
npm install
```

This will install `socket.io-client` which is required for webhook listening.

### 2. Create Supabase Edge Function

You need to create a Supabase Edge Function called `mpesa-payment` that handles M-Pesa STK Push requests.

The function should:
- Accept POST requests with `amount`, `phoneNumber`, and `orderData`
- Initiate M-Pesa STK Push
- Return `{ success: true, MerchantRequestID: "..." }` on success

Example function structure:
```typescript
// supabase/functions/mpesa-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { amount, phoneNumber, orderData } = await req.json()
  
  // Your M-Pesa API integration here
  // Initiate STK Push
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      MerchantRequestID: "..." 
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

### 3. Create Pending Orders Table

Create a `pending_orders` table in Supabase to store orders waiting for M-Pesa payment:

```sql
CREATE TABLE IF NOT EXISTS pending_orders (
  id SERIAL PRIMARY KEY,
  mpesa_checkout_request_id VARCHAR(255) UNIQUE NOT NULL,
  order_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checkout_request_id ON pending_orders(mpesa_checkout_request_id);
```

### 4. Socket.IO Server

The Socket.IO server should:
- Listen for M-Pesa webhook callbacks
- Emit `paymentStatus` events with payment data
- Include `MerchantRequestID` in the payload to match requests

The server URL is currently set to: `https://webhook-alqurashi.onrender.com`

To change it, update the Socket.IO connection in `components/cart-drawer.tsx`:

```typescript
const socketConnection = io("YOUR_SOCKET_IO_SERVER_URL")
```

### 5. Environment Variables

Make sure your `.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Payment Flow

1. **User selects M-Pesa payment** → Enters phone number
2. **Phone number validation** → Validates 254XXXXXXXXX format
3. **Initiate payment** → Calls Supabase function to start STK Push
4. **Save pending order** → Stores order in `pending_orders` table
5. **Socket.IO connection** → Listens for payment status updates
6. **Payment confirmation** → Receives webhook with payment details
7. **Create final order** → Moves order from `pending_orders` to `rayhana` table
8. **Cleanup** → Deletes pending order entry

## Phone Number Format

The system accepts phone numbers in multiple formats and automatically converts them:
- `0712345678` → `254712345678`
- `712345678` → `254712345678`
- `254712345678` → `254712345678` (already correct)

Final format must be: `254XXXXXXXXX` (12 digits total)

## Payment Status States

- `idle` - No payment in progress
- `initiated` - STK Push sent, waiting for user action
- `processing` - User has entered PIN, payment being processed
- `completed` - Payment successful, order created
- `failed` - Payment failed or cancelled

## Testing

1. Add items to cart
2. Select M-Pesa payment
3. Enter phone number (e.g., `254712345678`)
4. Click "Send STK Push"
5. Check phone for STK Push notification
6. Enter M-Pesa PIN
7. Wait for payment confirmation
8. Order should be automatically created

## Troubleshooting

### Payment not initiating?

1. Check Supabase function is deployed and accessible
2. Verify environment variables are set
3. Check browser console for errors
4. Verify phone number format is correct

### Webhook not receiving updates?

1. Verify Socket.IO server is running
2. Check Socket.IO connection in browser console
3. Verify `MerchantRequestID` matches between request and webhook
4. Check that M-Pesa webhook is configured to send to Socket.IO server

### Order not created after payment?

1. Check `pending_orders` table for the order
2. Verify payment webhook includes all required fields
3. Check browser console for errors
4. Verify `rayhana` table has correct schema

## Security Notes

- Phone numbers are validated before sending to M-Pesa
- Pending orders are stored securely in Supabase
- Orders are only created after payment confirmation
- Failed payments don't create orders



