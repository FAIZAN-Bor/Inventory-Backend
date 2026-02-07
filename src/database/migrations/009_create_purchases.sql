-- Create Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL, -- specific to suppliers table
    
    invoice_number VARCHAR(50) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    term_of_sale VARCHAR(20) DEFAULT 'CASH', -- 'CASH', 'CREDIT'
    
    total_amount DECIMAL(15, 2) DEFAULT 0,
    discount DECIMAL(15, 2) DEFAULT 0,
    net_amount DECIMAL(15, 2) DEFAULT 0,
    
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    balance_due DECIMAL(15, 2) DEFAULT 0, -- Store for convenience, net - paid
    
    status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'pending'
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_company ON purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_invoice ON purchases(invoice_number);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policies (Company Isolation)
CREATE POLICY "Users can view their company purchases" ON purchases
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE email = auth.email()
        )
    ); 
-- Note: The RLS policy above is a simplification. Usually we use a helper or check users table.
-- Given other migrations use specific RLS or none (relying on middleware), I keep it basic or omit if others did.
-- Checking 007_create_quotations.sql for reference policy.
