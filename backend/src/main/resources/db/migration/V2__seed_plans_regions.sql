-- V6: Seed region/currency specific plans (idempotent)
INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
SELECT 'FREE', 'IN', 'INR', 0, 3, 10, 'AI Parsing & Categorization, Basic Dashboard & Analytics, Email Support', 2
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='FREE' AND region='IN');

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
SELECT 'PRO', 'IN', 'INR', 19900, 5, 50, 'AI Parsing & Categorization, Advanced Dashboard & Analytics, Basic Spending Trends, Category Breakdown, Priority Support', 2
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PRO' AND region='IN');

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
SELECT 'PREMIUM', 'IN', 'INR', 49900, 10, 100, 'AI Parsing & Categorization, Full Analytics Suite, Advanced Spending Trends, Budget Tracking, Priority Processing, Top-Priority Support, Early Access to New Features', 5
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PREMIUM' AND region='IN');

-- US
INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
SELECT 'FREE', 'US', 'USD', 0, 3, 10, 'AI Parsing & Categorization, Basic Dashboard & Analytics, Email Support', 2
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='FREE' AND region='US');

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
SELECT 'PRO', 'US', 'USD', 900, 5, 50, 'AI Parsing & Categorization, Advanced Dashboard & Analytics, Basic Spending Trends, Category Breakdown, Priority Support', 3
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PRO' AND region='US');

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
SELECT 'PREMIUM', 'US', 'USD', 1800, 10, 100, 'AI Parsing & Categorization, Full Analytics Suite, Advanced Spending Trends, Budget Tracking, Priority Processing, Top-Priority Support, Early Access to New Features', 5
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PREMIUM' AND region='US');

-- EU
INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
SELECT 'FREE', 'EU', 'EUR', 0, 3, 10, 'AI Parsing & Categorization, Basic Dashboard & Analytics, Email Support', 2
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='FREE' AND region='EU');

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
SELECT 'PRO', 'EU', 'EUR', 4.49, 5, 50, 'AI Parsing & Categorization, Advanced Dashboard & Analytics, Basic Spending Trends, Category Breakdown, Priority Support', 3
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PRO' AND region='EU');

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
SELECT 'PREMIUM', 'EU', 'EUR', 8.99, 10, 100, 'AI Parsing & Categorization, Full Analytics Suite, Advanced Spending Trends, Budget Tracking, Priority Processing, Top-Priority Support, Early Access to New Features', 5
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type='PREMIUM' AND region='EU');
