-- Update feature descriptions to align with new analytics capabilities
-- FREE: Basic 3-month trends, no tax categorization
UPDATE plans SET features = 'AI Parsing,Basic Dashboard,Spending Trends (3mo),Email Support,No Tax Categorization'
WHERE plan_type='FREE' AND billing_period='MONTHLY';

-- PRO: Full 12 month analytics, budget tracking & alerts
UPDATE plans SET features = 'AI Parsing,Advanced Analytics (12mo),Budget Tracking & Alerts,Spending Trends,Category Breakdown,Priority Support'
WHERE plan_type='PRO' AND billing_period='MONTHLY';

-- PREMIUM: Everything + forecasting, goals, tax categorization & exports
UPDATE plans SET features = 'AI Parsing,Full Analytics (12mo),Forecasting,Goals,Budget Tracking & Alerts,Advanced Spending Trends,Tax Categorization & Exports (Excel/PDF),Priority Processing,Top-Priority Support,Early Access'
WHERE plan_type='PREMIUM' AND billing_period='MONTHLY';

-- Seed YEARLY variants for PRO & PREMIUM (10x monthly price = 2 months discount) if not present.
INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank, billing_period)
SELECT p.plan_type, p.region, p.currency, p.amount * 10, p.statements_per_month, p.pages_per_statement, p.features, p.combined_bank, 'YEARLY'
FROM plans p
WHERE p.billing_period='MONTHLY'
  AND p.plan_type IN ('PRO','PREMIUM')
  AND NOT EXISTS (
    SELECT 1 FROM plans y WHERE y.plan_type = p.plan_type AND y.region = p.region AND y.billing_period='YEARLY'
  );

-- Ensure yearly feature strings match monthly definitions (idempotent safety)
UPDATE plans y SET features = (
  CASE y.plan_type
    WHEN 'PRO' THEN 'AI Parsing,Advanced Analytics (12mo),Budget Tracking & Alerts,Spending Trends,Category Breakdown,Priority Support'
    WHEN 'PREMIUM' THEN 'AI Parsing,Full Analytics (12mo),Forecasting,Goals,Budget Tracking & Alerts,Advanced Spending Trends,Tax Categorization & Exports (Excel/PDF),Priority Processing,Top-Priority Support,Early Access'
    ELSE features
  END)
WHERE y.billing_period='YEARLY' AND y.plan_type IN ('PRO','PREMIUM');

-- (Optional) Add FREE yearly variant if you later want to show period toggle uniformly
-- INSERT logic omitted intentionally.
