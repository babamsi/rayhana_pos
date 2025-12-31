-- Orders Table Schema (MySQL version)
-- This table stores order items with payment information
-- Each row represents one item in an order

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,            -- Unique identifier for the order (e.g., "ORD-20250101-001")
    item_name VARCHAR(255) NOT NULL,           -- Name of the item
    quantity INT NOT NULL,                      -- Quantity of the item
    price DECIMAL(10, 2) NOT NULL,              -- Price per item
    payment_method ENUM('cash', 'mpesa') NOT NULL,  -- Payment method: 'cash' or 'mpesa'
    phone_number VARCHAR(20),                   -- Phone number (only for M-Pesa payments, NULL for cash)
    total_amount DECIMAL(10, 2) NOT NULL,       -- Total amount for the entire order
    cash_received DECIMAL(10, 2),               -- Cash received (only for cash payments, NULL for mpesa)
    change_amount DECIMAL(10, 2),               -- Change given (only for cash payments, NULL for mpesa)
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- When the order was placed
    
    -- Indexes for better query performance
    INDEX idx_order_id (order_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_payment_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example queries:

-- Get all orders grouped by order_id
-- SELECT 
--     order_id,
--     GROUP_CONCAT(CONCAT(item_name, ' (x', quantity, ')') SEPARATOR ', ') as items,
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




