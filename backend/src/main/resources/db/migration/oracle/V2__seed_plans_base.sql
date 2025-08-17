-- Disable parallel DML to avoid ORA-12838
ALTER SESSION DISABLE PARALLEL DML;

-- ========================
-- V5: Seed base plans (generic)
-- ========================
INSERT INTO plans (plan_type, amount, statements_per_month, pages_per_statement, features)
SELECT 'FREE', 0, 3, 10, 'AI Parsing,Basic Analytics,Email Support'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='FREE' AND currency IS NULL);

INSERT INTO plans (plan_type, amount, statements_per_month, pages_per_statement, features)
SELECT 'PRO', 12900, 5, 50, 'AI Parsing,Advanced Analytics,Priority Support,Spending Trends,Category Breakdown'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PRO' AND currency IS NULL);

INSERT INTO plans (plan_type, amount, statements_per_month, pages_per_statement, features)
SELECT 'PREMIUM', 29900, 10, 100, 'AI Parsing,Full Analytics Suite,Priority Processing,Priority Support,Early Access,10 Uploads'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PREMIUM' AND currency IS NULL);