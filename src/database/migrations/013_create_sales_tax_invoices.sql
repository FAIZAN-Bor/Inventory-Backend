-- Sales Tax Invoices Table
CREATE TABLE IF NOT EXISTS sales_tax_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    voucher_no VARCHAR(50) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Party Details (Snapshot)
    party_code VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    party_address TEXT,
    party_ntn VARCHAR(100),
    party_gst VARCHAR(100),
    
    -- Totals
    total_quantity NUMERIC(15, 2) DEFAULT 0,
    total_weight NUMERIC(15, 2) DEFAULT 0,
    total_amt_excl_tax NUMERIC(15, 2) DEFAULT 0,
    total_sales_tax NUMERIC(15, 2) DEFAULT 0,
    grand_total NUMERIC(15, 2) DEFAULT 0,
    
    -- Meta
    created_by VARCHAR(100), -- Should ideally be User ID, but storing name for now as per frontend
    company_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: voucher_no should be unique per company (soft constraint via index recommended, but here enforcing unique)
    CONSTRAINT uq_sales_tax_voucher_company UNIQUE (company_id, voucher_no)
);

-- Sales Tax Invoice Items Table
CREATE TABLE IF NOT EXISTS sales_tax_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_tax_invoice_id UUID NOT NULL REFERENCES sales_tax_invoices(id) ON DELETE CASCADE,
    
    item_name VARCHAR(255) NOT NULL,
    hs_code VARCHAR(50),
    po_number VARCHAR(100),
    demand_number VARCHAR(100),
    
    weight_kgs NUMERIC(15, 4) DEFAULT 0,
    quantity NUMERIC(15, 2) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'Pieces',
    rate NUMERIC(15, 2) DEFAULT 0,
    
    amt_excl_tax NUMERIC(15, 2) DEFAULT 0,
    st_percent NUMERIC(5, 2) DEFAULT 18.00,
    sales_tax NUMERIC(15, 2) DEFAULT 0,
    val_inc_tax NUMERIC(15, 2) DEFAULT 0
);

-- Index for searching
CREATE INDEX idx_sales_tax_invoices_company ON sales_tax_invoices(company_id);
CREATE INDEX idx_sales_tax_invoices_date ON sales_tax_invoices(date);
