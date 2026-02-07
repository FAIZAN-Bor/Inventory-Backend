-- Sales table migration
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    invoice_no TEXT NOT NULL,
    customer_type TEXT NOT NULL CHECK (customer_type IN ('party', 'non-party')),
    customer_name TEXT NOT NULL,
    party_id UUID REFERENCES parties(id),
    term_of_sale TEXT DEFAULT 'Cash',
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_amount DECIMAL(15, 2) DEFAULT 0,
    discount DECIMAL(15, 2) DEFAULT 0,
    tcs_charges DECIMAL(15, 2) DEFAULT 0,
    net_total DECIMAL(15, 2) DEFAULT 0,
    cash_received DECIMAL(15, 2) DEFAULT 0,
    remaining_balance DECIMAL(15, 2) DEFAULT 0,
    payment_option TEXT DEFAULT 'cash',
    due_days INTEGER DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_party_id ON sales(party_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_no ON sales(invoice_no);
