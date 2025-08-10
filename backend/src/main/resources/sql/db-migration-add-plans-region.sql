-- Seed plans for India (IN)

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features) VALUES
('FREE', 'IN', 'INR', 0, 3, 10, 'AI Parsing & Categorization, Basic Dashboard & Analytics, Email Support'),
('PRO', 'IN', 'INR', 129, 5, 50, 'AI Parsing & Categorization, Advanced Dashboard & Analytics, Basic Spending Trends, Category Breakdown, Priority Support'),
('PREMIUM', 'IN', 'INR', 299, -1, 100, 'AI Parsing & Categorization, Full Analytics Suite, Advanced Spending Trends, Budget Tracking, Priority Processing, Top-Priority Support, Early Access to New Features');

-- Seed plans for USA (US)

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features) VALUES
('FREE', 'US', 'USD', 0, 3, 10, 'AI Parsing & Categorization, Basic Dashboard & Analytics, Email Support'),
('PRO', 'US', 'USD', 4.99, 5, 50, 'AI Parsing & Categorization, Advanced Dashboard & Analytics, Basic Spending Trends, Category Breakdown, Priority Support'),
('PREMIUM', 'US', 'USD', 9.99, -1, 100, 'AI Parsing & Categorization, Full Analytics Suite, Advanced Spending Trends, Budget Tracking, Priority Processing, Top-Priority Support, Early Access to New Features');

-- Seed plans for Europe (EU)

INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features) VALUES
('FREE', 'EU', 'EUR', 0, 3, 10, 'AI Parsing & Categorization, Basic Dashboard & Analytics, Email Support'),
('PRO', 'EU', 'EUR', 4.49, 5, 50, 'AI Parsing & Categorization, Advanced Dashboard & Analytics, Basic Spending Trends, Category Breakdown, Priority Support'),
('PREMIUM', 'EU', 'EUR', 8.99, -1, 100, 'AI Parsing & Categorization, Full Analytics Suite, Advanced Spending Trends, Budget Tracking, Priority Processing, Top-Priority Support, Early Access to New Features');
