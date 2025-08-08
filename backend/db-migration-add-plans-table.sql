-- SQL to seed the plans table with 3-tier plan data
INSERT INTO plans (plan_type, amount, statements_per_month, pages_per_statement, features) VALUES
('FREE', 0, 3, 10, 'AI Parsing,Basic Analytics,Email Support'),
('PRO', 12900, 5, 50, 'AI Parsing,Advanced Analytics,Priority Support,Spending Trends,Category Breakdown'),
('PREMIUM', 29900, 9999, 100, 'AI Parsing,Full Analytics Suite,Priority Processing,Priority Support,Early Access,Unlimited Uploads');
