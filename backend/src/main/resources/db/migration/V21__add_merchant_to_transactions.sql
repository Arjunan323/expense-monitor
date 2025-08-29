-- Add merchant column to transactions table (nullable, simple text)
ALTER TABLE transactions ADD COLUMN merchant VARCHAR(255);

-- Optional: backfill merchant from description for existing rows (basic heuristic)
UPDATE transactions SET merchant = description WHERE merchant IS NULL;