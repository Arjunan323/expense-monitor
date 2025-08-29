-- V11: Set annual limits for newly added categories (idempotent updates)
-- 80CCD(1B)=50000, 80TTB=50000, STD_DED=50000 (informational), HRA & LTA calculated so leave NULL
UPDATE tax_categories SET annual_limit=50000 WHERE code='80CCD(1B)' AND (annual_limit IS NULL OR annual_limit<>50000);
UPDATE tax_categories SET annual_limit=50000 WHERE code='80TTB' AND (annual_limit IS NULL OR annual_limit<>50000);
UPDATE tax_categories SET annual_limit=50000 WHERE code='STD_DED' AND (annual_limit IS NULL OR annual_limit<>50000);
