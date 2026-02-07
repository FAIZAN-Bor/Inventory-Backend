-- Ensure unique invoice numbers for sales per company
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoice_no_company_id_key') THEN
        ALTER TABLE sales ADD CONSTRAINT sales_invoice_no_company_id_key UNIQUE (company_id, invoice_no);
    END IF;
END $$;
