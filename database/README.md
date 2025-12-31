# Database Schema for Orders

This directory contains SQL schema files for storing orders in a database.

## Table Structure

The `orders` table stores order items with the following structure:
- **id**: Auto-incrementing primary key
- **order_id**: Unique identifier for each order (e.g., "ORD-20250101-001")
- **item_name**: Name of the item
- **quantity**: Quantity of the item
- **price**: Price per item
- **payment_method**: Either 'cash' or 'mpesa'
- **phone_number**: Phone number (only populated when payment_method is 'mpesa', NULL for cash)
- **total_amount**: Total amount for the entire order
- **cash_received**: Cash received (only for cash payments, NULL for mpesa)
- **change_amount**: Change given (only for cash payments, NULL for mpesa)
- **timestamp**: When the order was placed

## Database Compatibility

Three schema files are provided:
1. **schema.sql** - SQLite version (recommended for local development)
2. **schema-postgres.sql** - PostgreSQL version
3. **schema-mysql.sql** - MySQL/MariaDB version

## Design Decision

Since orders can contain multiple items, each row in the table represents **one item** in an order. This means:
- If an order has 3 items, there will be 3 rows with the same `order_id`
- Payment information (payment_method, phone_number, total_amount) is duplicated across all rows for the same order
- This design allows for easy querying and filtering by item

## Usage with Order History Dialog

The schema is designed to be compatible with your existing `OrderHistorySheet` component. When querying the database:

1. **Get all orders**: Group by `order_id` to reconstruct the order structure
2. **Get order items**: Filter by `order_id` to get all items for a specific order
3. **Payment info**: The `payment_method` and `phone_number` fields match your existing interface

## Example: Converting Database Rows to Order Interface

```typescript
// Query result grouped by order_id
const dbRows = [
  { order_id: 'ORD-001', item_name: 'Shawarma', quantity: 2, price: 400, payment_method: 'mpesa', phone_number: '254712345678', total_amount: 800, timestamp: '...' },
  { order_id: 'ORD-001', item_name: 'Kahawa', quantity: 1, price: 50, payment_method: 'mpesa', phone_number: '254712345678', total_amount: 800, timestamp: '...' }
]

// Convert to Order interface
const order: Order = {
  id: dbRows[0].order_id,
  items: dbRows.map(row => ({
    id: row.id.toString(),
    name: row.item_name,
    price: row.price,
    quantity: row.quantity
  })),
  total: dbRows[0].total_amount,
  paymentMethod: dbRows[0].payment_method,
  mpesaNumber: dbRows[0].phone_number || undefined,
  timestamp: dbRows[0].timestamp
}
```

## Next Steps

1. Choose your database (SQLite for local, PostgreSQL/MySQL for production)
2. Run the appropriate schema file to create the table
3. Update your `cart-drawer.tsx` to save orders to the database instead of localStorage
4. Update your `order-history-sheet.tsx` to fetch orders from the database





