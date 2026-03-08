-- Initialize Database for Deploy Test
-- Simple schema just to test PostgreSQL integration

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table (stores uploaded invoice metadata)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    extracted_text TEXT,
    processing_time INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table (for testing relational queries)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2),
    description VARCHAR(500),
    transaction_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a test user
INSERT INTO users (username, email) 
VALUES ('testuser', 'test@example.com')
ON CONFLICT (username) DO NOTHING;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON transactions(invoice_id);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO deployuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deployuser;

ANALYZE;
