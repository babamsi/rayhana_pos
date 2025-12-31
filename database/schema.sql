-- Orders Table Schema
-- This table stores order items with payment information
-- Each row represents one item in an order

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,                    -- Unique identifier for the order (e.g., "ORD-20250101-001")
    item_name TEXT NOT NULL,                   -- Name of the item
    quantity INTEGER NOT NULL,                  -- Quantity of the item
    price DECIMAL(10, 2) NOT NULL,             -- Price per item
    payment_method TEXT NOT NULL,               -- Payment method: 'cash' or 'mpesa'
    phone_number TEXT,                         -- Phone number (only for M-Pesa payments, NULL for cash)
    total_amount DECIMAL(10, 2) NOT NULL,      -- Total amount for the entire order
    cash_received DECIMAL(10, 2),              -- Cash received (only for cash payments, NULL for mpesa)
    change_amount DECIMAL(10, 2),              -- Change given (only for cash payments, NULL for mpesa)
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- When the order was placed
    
    -- Indexes for better query performance
    INDEX idx_order_id (order_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_payment_method (payment_method)
);

-- Example queries:

-- Get all orders grouped by order_id
-- SELECT 
--     order_id,
--     GROUP_CONCAT(item_name || ' (x' || quantity || ')') as items,
--     SUM(price * quantity) as item_total,
--     payment_method,
--     phone_number,
--     total_amount,
--     timestamp
-- FROM orders
-- GROUP BY order_id, payment_method, phone_number, total_amount, timestamp
-- ORDER BY timestamp DESC;

-- Get all items for a specific order
-- SELECT * FROM orders WHERE order_id = 'ORD-20250101-001';

-- Get all orders with M-Pesa payment
-- SELECT * FROM orders WHERE payment_method = 'mpesa';

-- Get all orders with phone number
-- SELECT * FROM orders WHERE phone_number IS NOT NULL;



