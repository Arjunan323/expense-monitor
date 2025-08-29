-- V6: Add annual_limit column to tax_categories (Oracle) and populate values
ALTER TABLE tax_categories ADD (annual_limit NUMBER(19,2));

-- Backfill known limits (idempotent style)
UPDATE tax_categories SET annual_limit = 150000 WHERE code = '80C' AND (annual_limit IS NULL OR annual_limit <> 150000);
UPDATE tax_categories SET annual_limit = 25000  WHERE code = '80D' AND (annual_limit IS NULL OR annual_limit <> 25000);
UPDATE tax_categories SET annual_limit = 200000 WHERE code = '24(b)' AND (annual_limit IS NULL OR annual_limit <> 200000);
UPDATE tax_categories SET annual_limit = 10000  WHERE code = '80TTA' AND (annual_limit IS NULL OR annual_limit <> 10000);
-- Leave 80G and 80E as NULL (variable / no cap)
