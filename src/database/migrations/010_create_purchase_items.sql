-- Create Purchase Items Table
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
    
    quantity DECIMAL(15, 4) NOT NULL DEFAULT 0,
    rate DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Purchase Rate per unit
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0, -- quantity * rate
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_inventory ON purchase_items(inventory_id);

-- Enable RLS
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- Note: Policies usually inherited or managed via app, basic policy below
CREATE POLICY "Users can view their company purchase items" ON purchase_items
    FOR SELECT USING (
        purchase_id IN (
            SELECT id FROM purchases WHERE company_id IN (
                SELECT company_id FROM users WHERE email = auth.email()
            )
        )
    );
