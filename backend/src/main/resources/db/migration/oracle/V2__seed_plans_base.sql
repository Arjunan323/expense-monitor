MERGE INTO plans p USING (SELECT 'FREE' plan_type FROM dual) src
ON (p.plan_type = src.plan_type AND p.region = 'GLOBAL')
WHEN NOT MATCHED THEN INSERT (id, plan_type, region, amount, statements_per_month, pages_per_statement, features, currency, combined_bank)
VALUES ('FREE', 'GLOBAL', 0, 3, 10, 'AI Parsing,Basic Analytics,Email Support', NULL, NULL);

MERGE INTO plans p USING (SELECT 'PRO' plan_type FROM dual) src
ON (p.plan_type = src.plan_type AND p.region = 'GLOBAL')
WHEN NOT MATCHED THEN INSERT (id, plan_type, region, amount, statements_per_month, pages_per_statement, features, currency, combined_bank)
VALUES ('PRO', 'GLOBAL', 12900, 5, 50, 'AI Parsing,Advanced Analytics,Priority Support,Spending Trends,Category Breakdown', NULL, NULL);

MERGE INTO plans p USING (SELECT 'PREMIUM' plan_type FROM dual) src
ON (p.plan_type = src.plan_type AND p.region = 'GLOBAL')
WHEN NOT MATCHED THEN INSERT (id, plan_type, region, amount, statements_per_month, pages_per_statement, features, currency, combined_bank)
VALUES ('PREMIUM', 'GLOBAL', 29900, 10, 100, 'AI Parsing,Full Analytics Suite,Priority Processing,Priority Support,Early Access,10 Uploads', NULL, NULL);
