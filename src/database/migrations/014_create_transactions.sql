-- Transactions/ledger table migration
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    party_id UUID REFERENCES parties(id),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type TEXT NOT NULL, -- 'sale', 'payment', 'return', 'purchase'
    description TEXT,
    invoice_no TEXT,
    amount DECIMAL(15, 2) DEFAULT 0,
    payment_received DECIMAL(15, 2) DEFAULT 0,
    previous_balance DECIMAL(15, 2) DEFAULT 0,
    new_balance DECIMAL(15, 2) DEFAULT 0,
    payment_method TEXT,
    cheque_no TEXT,
    bank_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_party_id ON transactions(party_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
