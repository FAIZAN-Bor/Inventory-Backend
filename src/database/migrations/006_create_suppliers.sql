-- Suppliers table migration
-- Refactored: Suppliers are global, Financials are company-specific
-- Added: Supplier Transactions table (since Parties/Suppliers are distinct)

-- Drop existing tables
DROP TABLE IF EXISTS supplier_transactions;
DROP TABLE IF EXISTS supplier_financials;
DROP TABLE IF EXISTS suppliers CASCADE;

-- 1. Global Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_number SERIAL, -- Auto-increment global supplier ID
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    ntn VARCHAR(50),
    strn VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Company Specific Financials
CREATE TABLE IF NOT EXISTS supplier_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    
    total_purchases DECIMAL(15, 2) DEFAULT 0,
    total_payments DECIMAL(15, 2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_supplier_company UNIQUE (supplier_id, company_id)
);

-- 3. Supplier Transactions (Ledger)
CREATE TABLE IF NOT EXISTS supplier_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    
    type VARCHAR(20) NOT NULL, -- 'purchase', 'payment', 'return'
    invoice_no VARCHAR(50),
    
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    previous_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    new_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    
    payment_method VARCHAR(20), -- 'cash', 'bank', 'cheque'
    cheque_no VARCHAR(50),
    bank_name VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_supplier_financials_company ON supplier_financials(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_company ON supplier_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_supplier ON supplier_transactions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_date ON supplier_transactions(date);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_transactions ENABLE ROW LEVEL SECURITY;
