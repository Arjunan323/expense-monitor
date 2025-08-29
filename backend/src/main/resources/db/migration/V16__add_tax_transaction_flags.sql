-- V16: Add deductible / receipt columns to tax_transactions (idempotent)
ALTER TABLE tax_transactions ADD COLUMN IF NOT EXISTS deductible BOOLEAN;
ALTER TABLE tax_transactions ADD COLUMN IF NOT EXISTS has_receipt BOOLEAN;
ALTER TABLE tax_transactions ADD COLUMN IF NOT EXISTS receipt_key VARCHAR(255);

-- Initialize nulls to defaults
UPDATE tax_transactions SET deductible = TRUE WHERE deductible IS NULL;
UPDATE tax_transactions SET has_receipt = FALSE WHERE has_receipt IS NULL;
