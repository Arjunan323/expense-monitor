-- Add bankName to RawStatement and Transaction tables
ALTER TABLE raw_statement ADD COLUMN bank_name VARCHAR(100);
ALTER TABLE transaction ADD COLUMN bank_name VARCHAR(100);
