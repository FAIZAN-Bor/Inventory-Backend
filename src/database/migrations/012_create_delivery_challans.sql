-- Create delivery_challans table
CREATE TABLE IF NOT EXISTS delivery_challans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    dc_number VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    party_id UUID REFERENCES parties(id),
    party_name VARCHAR(255) NOT NULL,
    party_address TEXT,
    courier_name VARCHAR(255),
    total_qty NUMERIC(15, 2) DEFAULT 0,
    remarks TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, delivered, cancelled
    delivered_date TIMESTAMP WITH TIME ZONE,
    received_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique DC number per company
    UNIQUE(company_id, dc_number)
);

-- Create delivery_challan_items table
CREATE TABLE IF NOT EXISTS delivery_challan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challan_id UUID NOT NULL REFERENCES delivery_challans(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory(id),
    item_name VARCHAR(255) NOT NULL,
    po_number VARCHAR(100),
    demand_number VARCHAR(100),
    quantity NUMERIC(15, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_dc_company_date ON delivery_challans(company_id, date);
CREATE INDEX idx_dc_status ON delivery_challans(status);
CREATE INDEX idx_dc_party ON delivery_challans(party_name);
