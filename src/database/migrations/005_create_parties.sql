-- Parties table migration
-- Refactored: Parties are global, Financials are company-specific

-- Drop existing tables if they exist (clean slate for schema change)
DROP TABLE IF EXISTS party_financials;
DROP TABLE IF EXISTS parties CASCADE;

-- 1. Global Parties Table
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- No company_id, parties are global
    party_number SERIAL, -- Auto-increment global party ID
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    ntn VARCHAR(50),
    strn VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- Global status
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Company Specific Financials/Settings for Parties
CREATE TABLE IF NOT EXISTS party_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    
    total_purchases DECIMAL(15, 2) DEFAULT 0,
    total_payments DECIMAL(15, 2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_party_company UNIQUE (party_id, company_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);
CREATE INDEX IF NOT EXISTS idx_party_financials_company ON party_financials(company_id);
CREATE INDEX IF NOT EXISTS idx_party_financials_party ON party_financials(party_id);

-- Enable RLS
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_financials ENABLE ROW LEVEL SECURITY;

-- Note: RLS Config
-- parties: readable by authenticated users (global list).
-- party_financials: readable/writable only by users of that company.
