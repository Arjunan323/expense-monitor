-- Oracle MERGE-based idempotent inserts for regional plans
-- India
MERGE INTO plans p USING (SELECT 'FREE' plan_type FROM dual) src
ON (p.plan_type='FREE' AND p.region='IN')
WHEN NOT MATCHED THEN INSERT (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
VALUES ('FREE', 'IN', 'INR', 0, 3, 10, 'AI Parsing & Categorization, Basic Dashboard & Analytics, Email Support', 2);

MERGE INTO plans p USING (SELECT 'PRO' plan_type FROM dual) src
ON (p.plan_type='PRO' AND p.region='IN')
WHEN NOT MATCHED THEN INSERT (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
VALUES ('PRO', 'IN', 'INR', 19900, 5, 50, 'AI Parsing & Categorization, Advanced Dashboard & Analytics, Basic Spending Trends, Category Breakdown, Priority Support', 2);

MERGE INTO plans p USING (SELECT 'PREMIUM' plan_type FROM dual) src
ON (p.plan_type='PREMIUM' AND p.region='IN')
WHEN NOT MATCHED THEN INSERT (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
VALUES ('PREMIUM', 'IN', 'INR', 49900, 10, 100, 'AI Parsing & Categorization, Full Analytics Suite, Advanced Spending Trends, Budget Tracking, Priority Processing, Top-Priority Support, Early Access to New Features', 5);

-- United States (amounts assumed integers represent cents; keep as NUMBER) 
MERGE INTO plans p USING (SELECT 'FREE' plan_type FROM dual) src
ON (p.plan_type='FREE' AND p.region='US')
WHEN NOT MATCHED THEN INSERT (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
VALUES ('FREE', 'US', 'USD', 0, 3, 10, 'AI Parsing & Categorization, Basic Dashboard & Analytics, Email Support', 2);

MERGE INTO plans p USING (SELECT 'PRO' plan_type FROM dual) src
ON (p.plan_type='PRO' AND p.region='US')
WHEN NOT MATCHED THEN INSERT (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
VALUES ('PRO', 'US', 'USD', 900, 5, 50, 'AI Parsing & Categorization, Advanced Dashboard & Analytics, Basic Spending Trends, Category Breakdown, Priority Support', 3);

MERGE INTO plans p USING (SELECT 'PREMIUM' plan_type FROM dual) src
ON (p.plan_type='PREMIUM' AND p.region='US')
WHEN NOT MATCHED THEN INSERT (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
VALUES ('PREMIUM', 'US', 'USD', 1800, 10, 100, 'AI Parsing & Categorization, Full Analytics Suite, Advanced Spending Trends, Budget Tracking, Priority Processing, Top-Priority Support, Early Access to New Features', 5);

-- European Union (decimal pricing)
MERGE INTO plans p USING (SELECT 'FREE' plan_type FROM dual) src
ON (p.plan_type='FREE' AND p.region='EU')
WHEN NOT MATCHED THEN INSERT (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
VALUES ('FREE', 'EU', 'EUR', 0, 3, 10, 'AI Parsing & Categorization, Basic Dashboard & Analytics, Email Support', 2);

MERGE INTO plans p USING (SELECT 'PRO' plan_type FROM dual) src
ON (p.plan_type='PRO' AND p.region='EU')
WHEN NOT MATCHED THEN INSERT (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
VALUES ('PRO', 'EU', 'EUR', 4.49, 5, 50, 'AI Parsing & Categorization, Advanced Dashboard & Analytics, Basic Spending Trends, Category Breakdown, Priority Support', 3);

MERGE INTO plans p USING (SELECT 'PREMIUM' plan_type FROM dual) src
ON (p.plan_type='PREMIUM' AND p.region='EU')
WHEN NOT MATCHED THEN INSERT (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank)
VALUES ('PREMIUM', 'EU', 'EUR', 8.99, 10, 100, 'AI Parsing & Categorization, Full Analytics Suite, Advanced Spending Trends, Budget Tracking, Priority Processing, Top-Priority Support, Early Access to New Features', 5);
