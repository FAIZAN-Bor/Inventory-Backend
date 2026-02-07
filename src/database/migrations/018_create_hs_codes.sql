CREATE TABLE IF NOT EXISTS hs_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) DEFAULT 0,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Separate index creation to avoid errors if index exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'hs_codes'
        AND indexname = 'idx_hs_codes_company'
    ) THEN
        CREATE INDEX idx_hs_codes_company ON hs_codes(company_id);
    END IF;
END $$;
