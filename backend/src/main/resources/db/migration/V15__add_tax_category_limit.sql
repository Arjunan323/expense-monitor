-- V15: Add annual_limit column to tax_categories and populate initial limits
ALTER TABLE tax_categories ADD COLUMN IF NOT EXISTS annual_limit NUMERIC(19,2);

-- Populate known limits (idempotent updates)
UPDATE tax_categories SET annual_limit = 150000 WHERE code = '80C' AND (annual_limit IS NULL OR annual_limit <> 150000);
UPDATE tax_categories SET annual_limit = 25000  WHERE code = '80D' AND (annual_limit IS NULL OR annual_limit <> 25000);
UPDATE tax_categories SET annual_limit = 200000 WHERE code = '24(b)' AND (annual_limit IS NULL OR annual_limit <> 200000);
UPDATE tax_categories SET annual_limit = 10000  WHERE code = '80TTA' AND (annual_limit IS NULL OR annual_limit <> 10000);
-- No statutory fixed annual amount for 80G (varies) and 80E (no upper limit), leave NULL
