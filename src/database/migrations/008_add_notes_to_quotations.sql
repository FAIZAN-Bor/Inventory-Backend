-- Add notes column to quotations table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN quotations.notes IS 'Additional notes or terms for the quotation';
