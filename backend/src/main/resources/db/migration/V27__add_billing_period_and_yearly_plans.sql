-- Add billing_period column to plans table if not exists (Postgres / H2 style). Adjust for Oracle separately if needed.
ALTER TABLE plans ADD COLUMN IF NOT EXISTS billing_period VARCHAR(16) DEFAULT 'MONTHLY';

-- Ensure existing rows default to MONTHLY where null
UPDATE plans SET billing_period = 'MONTHLY' WHERE billing_period IS NULL;

-- Add unique constraint including billing_period (drop old if present)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uq_plan_type_region'
          AND table_name = 'plans'
    ) THEN
        ALTER TABLE plans DROP CONSTRAINT uq_plan_type_region;
    END IF;
EXCEPTION WHEN others THEN NULL; END$$;

ALTER TABLE plans ADD CONSTRAINT uq_plan_type_region_period UNIQUE (plan_type, region, billing_period);

-- Seed yearly variants (INR)
INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank, billing_period)
SELECT 'PRO', 'IN', 'INR', 19900 * 10, 5, 50, features, combined_bank, 'YEARLY'
FROM plans p WHERE p.plan_type='PRO' AND p.region='IN' AND p.billing_period='MONTHLY'
AND NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PRO' AND region='IN' AND billing_period='YEARLY');

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank, billing_period)
SELECT 'PREMIUM', 'IN', 'INR', 49900 * 10, 10, 100, features, combined_bank, 'YEARLY'
FROM plans p WHERE p.plan_type='PREMIUM' AND p.region='IN' AND p.billing_period='MONTHLY'
AND NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PREMIUM' AND region='IN' AND billing_period='YEARLY');

-- US yearly (apply discount e.g., 2 months free -> *10)
INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank, billing_period)
SELECT 'PRO', 'US', 'USD', amount * 10, statements_per_month, pages_per_statement, features, combined_bank, 'YEARLY'
FROM plans p WHERE p.plan_type='PRO' AND p.region='US' AND p.billing_period='MONTHLY'
AND NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PRO' AND region='US' AND billing_period='YEARLY');

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank, billing_period)
SELECT 'PREMIUM', 'US', 'USD', amount * 10, statements_per_month, pages_per_statement, features, combined_bank, 'YEARLY'
FROM plans p WHERE p.plan_type='PREMIUM' AND p.region='US' AND p.billing_period='MONTHLY'
AND NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PREMIUM' AND region='US' AND billing_period='YEARLY');

-- EU yearly (similar discount)
INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank, billing_period)
SELECT 'PRO', 'EU', 'EUR', CAST((amount * 10) AS INT), statements_per_month, pages_per_statement, features, combined_bank, 'YEARLY'
FROM plans p WHERE p.plan_type='PRO' AND p.region='EU' AND p.billing_period='MONTHLY'
AND NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PRO' AND region='EU' AND billing_period='YEARLY');

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank, billing_period)
SELECT 'PREMIUM', 'EU', 'EUR', CAST((amount * 10) AS INT), statements_per_month, pages_per_statement, features, combined_bank, 'YEARLY'
FROM plans p WHERE p.plan_type='PREMIUM' AND p.region='EU' AND p.billing_period='MONTHLY'
AND NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PREMIUM' AND region='EU' AND billing_period='YEARLY');
