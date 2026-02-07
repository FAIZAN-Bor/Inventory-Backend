-- Remove supplier_id from inventory table
-- Migration number: 015

-- Drop the foreign key constraint first (if it exists explicitly named, otherwise standard drop column will handle if CASCADE is implied or we might need to find the constraint name)
-- Postgres usually auto-drops constraints on column drop, but let's be safe.

-- Drop the index first
DROP INDEX IF EXISTS idx_inventory_supplier_id;

-- Drop the column
ALTER TABLE inventory DROP COLUMN IF EXISTS supplier_id;
