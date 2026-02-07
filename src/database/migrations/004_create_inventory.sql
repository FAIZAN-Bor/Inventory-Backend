-- Inventory table migration
-- Creates the inventory table with all required columns and constraints

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    article_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
    location VARCHAR(100),
    image_url TEXT,
    rate DECIMAL(15, 2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(15, 2),
    min_sale_price DECIMAL(15, 2),
    current_stock DECIMAL(15, 2) NOT NULL DEFAULT 0,
    min_stock DECIMAL(15, 2) NOT NULL DEFAULT 0,
    last_restocked TIMESTAMP WITH TIME ZONE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for article_code within a company
    CONSTRAINT unique_article_code_per_company UNIQUE (company_id, article_code)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category_id ON inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_article_code ON inventory(article_code);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_is_active ON inventory(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(current_stock, min_stock) WHERE is_active = true;

-- Create stock history table for audit trail
CREATE TABLE IF NOT EXISTS stock_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('add', 'subtract', 'set', 'sale', 'purchase', 'return')),
    quantity_before DECIMAL(15, 2) NOT NULL,
    quantity_change DECIMAL(15, 2) NOT NULL,
    quantity_after DECIMAL(15, 2) NOT NULL,
    reason TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for stock history
CREATE INDEX IF NOT EXISTS idx_stock_history_company_id ON stock_history(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_inventory_id ON stock_history(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_history_adjustment_type ON stock_history(adjustment_type);

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory table
DROP TRIGGER IF EXISTS trigger_inventory_updated_at ON inventory;
CREATE TRIGGER trigger_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory
CREATE POLICY inventory_company_isolation ON inventory
    FOR ALL
    USING (company_id = current_setting('app.company_id', true)::UUID)
    WITH CHECK (company_id = current_setting('app.company_id', true)::UUID);

-- Create RLS policies for stock_history
CREATE POLICY stock_history_company_isolation ON stock_history
    FOR ALL
    USING (company_id = current_setting('app.company_id', true)::UUID)
    WITH CHECK (company_id = current_setting('app.company_id', true)::UUID);

-- Comments for documentation
COMMENT ON TABLE inventory IS 'Stores all inventory items for each company';
COMMENT ON TABLE stock_history IS 'Audit trail for all stock adjustments';
COMMENT ON COLUMN inventory.article_code IS 'Unique identifier code for the item within a company';
COMMENT ON COLUMN inventory.rate IS 'Purchase/cost rate of the item';
COMMENT ON COLUMN inventory.sale_price IS 'Standard selling price';
COMMENT ON COLUMN inventory.min_sale_price IS 'Minimum allowed selling price';
COMMENT ON COLUMN inventory.min_stock IS 'Threshold for low stock alerts';
