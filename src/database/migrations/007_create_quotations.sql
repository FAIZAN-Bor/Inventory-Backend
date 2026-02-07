-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    party_name VARCHAR(255) NOT NULL, -- Snapshot or fallback
    quotation_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, sent, accepted, rejected
    total_amount DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for quotations
CREATE INDEX IF NOT EXISTS idx_quotations_company_id ON quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_party_name ON quotations(party_name);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);

-- Quotation Items table
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL DEFAULT 0,
    unit VARCHAR(50),
    rate DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0, -- quantity * rate
    brand VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for quotation items
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_inventory_id ON quotation_items(inventory_id);

-- Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE quotations IS 'Stores sales quotations for customers';
COMMENT ON TABLE quotation_items IS 'Stores individual items within a quotation';
