-- Sales items table migration
CREATE TABLE IF NOT EXISTS sales_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    article_code TEXT,
    item_id UUID REFERENCES inventory(id), -- Optional link to inventory
    description TEXT,
    quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
    unit TEXT,
    rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON sales_items(sale_id);
