-- Companies table migration
-- This is the base table for multi-tenant company support

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    logo_code VARCHAR(10),
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Pakistan',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE companies IS 'Stores company information for multi-tenant support';

-- Insert the 4 companies
INSERT INTO companies (name, display_name, logo_code, email, phone, address, city, country, is_active)
VALUES 
    -- QASIM SEWING MACHINE
    (
        'QASIM SEWING MACHINE',
        'Qasim Sewing Machine',
        'QS',
        'qasimsewing@gmail.com',
        'TEL: 041-2603040, 0302-8603040',
        'P-608 BISMILLAH CENTER, JINNAH COLONY, FAISALABAD',
        'Faisalabad',
        'Pakistan',
        true
    ),
    -- Q.S TRADERS
    (
        'Q.S TRADERS',
        'Q.S Traders',
        'Q.S',
        'gulsherqasim@gmail.com',
        'TEL: 0322-753971, 03116635400',
        'P-608 BISMILLAH CENTER, JINNAH COLONY, FAISALABAD',
        'Faisalabad',
        'Pakistan',
        true
    ),
    -- ARFA TRADING COMPANY
    (
        'ARFA TRADING COMPANY',
        'Arfa Trading Company',
        'ATC',
        'arfatradingcompany22@gmail.com',
        'TEL: 0301-0693162, 0343-8266238',
        'P-608, Plaza 1st Floor, Main-Gate Jinnah Colony, Faisalabad',
        'Faisalabad',
        'Pakistan',
        true
    ),
    -- QASIM & SONS
    (
        'QASIM & SONS',
        'Qasim & Sons',
        'Q&S',
        'arfatradingcompany22@gmail.com',
        'TEL: 0305-7229496, 0315-7329496',
        'P-10, Main Gate Jinnah Colony, Faisalabad',
        'Faisalabad',
        'Pakistan',
        true
    )
ON CONFLICT (name) DO NOTHING;
