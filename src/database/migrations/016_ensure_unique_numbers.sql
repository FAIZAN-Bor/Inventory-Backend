-- Ensure unique invoice numbers per company
-- We use unique indexes to allow for potential future partial indexing if needed, 
-- but simpler UNIQUE constraints are standard.

-- 1. Purchases Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_invoice_number_company_id_key') THEN
        ALTER TABLE purchases ADD CONSTRAINT purchases_invoice_number_company_id_key UNIQUE (company_id, invoice_number);
    END IF;
END $$;

-- 2. Supplier Transactions (Payment Vouchers & Purchase Refs)
-- Note: Postgres allows multiple NULL values in a UNIQUE constraint column.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_transactions_invoice_no_company_id_key') THEN
        ALTER TABLE supplier_transactions ADD CONSTRAINT supplier_transactions_invoice_no_company_id_key UNIQUE (company_id, invoice_no);
    END IF;
END $$;
