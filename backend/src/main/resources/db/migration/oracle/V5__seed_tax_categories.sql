-- V5: Seed default tax categories (Oracle) idempotent
ALTER SESSION DISABLE PARALLEL DML;

INSERT INTO tax_categories (code, description)
SELECT '80C', 'Investments/Payments - PPF, LIC, ELSS, Tuition Fees (limit=150000)'
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='80C');

INSERT INTO tax_categories (code, description)
SELECT '80D', 'Medical Insurance - Health insurance premiums (limit=25000)'
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='80D');

INSERT INTO tax_categories (code, description)
SELECT '80G', 'Donations - Charitable donations (subject to qualifying limits)'
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='80G');

INSERT INTO tax_categories (code, description)
SELECT '24(b)', 'Home Loan Interest - Interest on home loan (limit=200000)'
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='24(b)');

INSERT INTO tax_categories (code, description)
SELECT '80E', 'Education Loan - Interest on education loan (no upper limit; 8 year period)'
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='80E');

INSERT INTO tax_categories (code, description)
SELECT '80TTA', 'Savings Interest - Interest from savings account (limit=10000)'
FROM dual WHERE NOT EXISTS (SELECT 1 FROM tax_categories WHERE code='80TTA');
