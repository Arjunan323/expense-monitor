-- V12: Seed initial deduction classification rules for common patterns (idempotent)
-- Uses DESCRIPTION_REGEX and MERCHANT match types.
-- Only inserts if user_id IS NULL (global templates). Application logic should clone per user if needed.
-- Priority: lower number = evaluated first (assumed by service ordering logic).

-- (Removed prior dummy PL/SQL block to avoid parsing error)

-- Insert patterns if not present
INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'LIC|LIFE\\s+INSURANCE|TERM\\s+PREMIUM', '80C', 10, 1, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='LIC|LIFE\\s+INSURANCE|TERM\\s+PREMIUM');

INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'PPF|PUBLIC\\s+PROVIDENT', '80C', 15, 1, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='PPF|PUBLIC\\s+PROVIDENT');

INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'NPS|NATIONAL\\s+PENSION', '80CCD(1B)', 20, 1, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='NPS|NATIONAL\\s+PENSION');

INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'MEDICLAIM|HEALTH\\s+INSURANCE|POLICY\\s+PREMIUM', '80D', 30, 1, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='MEDICLAIM|HEALTH\\s+INSURANCE|POLICY\\s+PREMIUM');

INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'DONATION|CHARITY|RELIEF FUND', '80G', 40, 0, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='DONATION|CHARITY|RELIEF FUND');

INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'HOME\\s+LOAN\\s+INTEREST|HL INT', '24(b)', 50, 1, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='HOME\\s+LOAN\\s+INTEREST|HL INT');

INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'EDUCATION\\s+LOAN\\s+INT|EDULOAN INT', '80E', 60, 1, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='EDUCATION\\s+LOAN\\s+INT|EDULOAN INT');

-- Savings interest (exclude large FDs maybe manual)
INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'SAVINGS\\s+INT', '80TTA', 70, 0, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='SAVINGS\\s+INT');

-- Senior citizen interest
INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'SENIOR\\s+INT|SCSS', '80TTB', 80, 0, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='SENIOR\\s+INT|SCSS');

-- LTA travel fare indicators (suggested, manual confirm)
INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'LTA\\s+TRAVEL|LEAVE\\s+TRAVEL', 'LTA', 90, 0, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='LTA\\s+TRAVEL|LEAVE\\s+TRAVEL');

-- HRA not auto (needs calculation); pattern for rent payments
INSERT INTO tax_deduction_rules (user_id, match_type, match_value, tax_category_code, priority, auto_mark_deductible, active, created_at)
SELECT NULL, 'DESCRIPTION_REGEX', 'RENT\\s+PAID|HOUSE\\s+RENT', 'HRA', 100, 0, 1, CURRENT_TIMESTAMP FROM dual
WHERE NOT EXISTS (SELECT 1 FROM tax_deduction_rules WHERE user_id IS NULL AND match_type='DESCRIPTION_REGEX' AND match_value='RENT\\s+PAID|HOUSE\\s+RENT');
