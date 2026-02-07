-- Users table migration
-- Stores user accounts linked to companies

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique email per company
    CONSTRAINT unique_email_per_company UNIQUE (company_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE users IS 'Stores user accounts for each company';

-- Insert admin users for each company (matching frontend Login.tsx credentials)
INSERT INTO users (company_id, email, name, role, is_active)
VALUES 
    -- Admin for QASIM SEWING MACHINE
    (
        (SELECT id FROM companies WHERE name = 'QASIM SEWING MACHINE'),
        'admin@qasim.com',
        'Admin',
        'admin',
        true
    ),
    -- Admin for Q.S TRADERS
    (
        (SELECT id FROM companies WHERE name = 'Q.S TRADERS'),
        'admin@qstraders.com',
        'Admin',
        'admin',
        true
    ),
    -- Admin for ARFA TRADING COMPANY
    (
        (SELECT id FROM companies WHERE name = 'ARFA TRADING COMPANY'),
        'admin@arfa.com',
        'Admin',
        'admin',
        true
    ),
    -- Admin for QASIM & SONS
    (
        (SELECT id FROM companies WHERE name = 'QASIM & SONS'),
        'admin@qasimsons.com',
        'Admin',
        'admin',
        true
    )
ON CONFLICT ON CONSTRAINT unique_email_per_company DO NOTHING;
