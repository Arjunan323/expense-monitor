-- V10: Seed additional Old Regime deduction/exemption categories (idempotent)
-- Adds: 80CCD(1B), 80TTB, STD_DED, HRA, LTA
ALTER SESSION DISABLE PARALLEL DML;

INSERT INTO tax_categories (code, description)
SELECT '80CCD(1B)', 'NPS Additional Contribution - Extra NPS over 80C (limit=50000)'
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='80CCD(1B)');

INSERT INTO tax_categories (code, description)
SELECT '80TTB', 'Senior Citizen Savings Interest - Interest on deposits (limit=50000)'
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='80TTB');

INSERT INTO tax_categories (code, description)
SELECT 'STD_DED', 'Standard Deduction - Salaried taxpayer standard deduction (limit=50000)'
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='STD_DED');

INSERT INTO tax_categories (code, description)
SELECT 'HRA', 'House Rent Allowance - Exempt portion u/s 10(13A) (calc based)' 
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='HRA');

INSERT INTO tax_categories (code, description)
SELECT 'LTA', 'Leave Travel Allowance - Travel fare within India (block rules)' 
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='LTA');
