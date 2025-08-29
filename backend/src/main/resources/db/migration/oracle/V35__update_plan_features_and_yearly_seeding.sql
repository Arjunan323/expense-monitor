-- Oracle variant: update feature descriptions and seed yearly plans
BEGIN
  UPDATE plans SET features = 'AI Parsing,Basic Dashboard,Spending Trends (3mo),Email Support,No Tax Categorization'
  WHERE plan_type='FREE' AND billing_period='MONTHLY';
  UPDATE plans SET features = 'AI Parsing,Advanced Analytics (12mo),Budget Tracking & Alerts,Spending Trends,Category Breakdown,Priority Support'
  WHERE plan_type='PRO' AND billing_period='MONTHLY';
  UPDATE plans SET features = 'AI Parsing,Full Analytics (12mo),Forecasting,Goals,Budget Tracking & Alerts,Advanced Spending Trends,Tax Categorization & Exports (Excel/PDF),Priority Processing,Top-Priority Support,Early Access'
  WHERE plan_type='PREMIUM' AND billing_period='MONTHLY';
END;
/

DECLARE
  CURSOR c_monthly IS
    SELECT * FROM plans p WHERE p.billing_period='MONTHLY' AND p.plan_type IN ('PRO','PREMIUM');
  v_exists NUMBER;
BEGIN
  FOR r IN c_monthly LOOP
    SELECT COUNT(*) INTO v_exists FROM plans y WHERE y.plan_type = r.plan_type AND y.region = r.region AND y.billing_period='YEARLY';
    IF v_exists = 0 THEN
      INSERT INTO plans (plan_type, region, currency, amount, statements_per_month, pages_per_statement, features, combined_bank, billing_period)
      VALUES (r.plan_type, r.region, r.currency, r.amount * 10, r.statements_per_month, r.pages_per_statement, r.features, r.combined_bank, 'YEARLY');
    END IF;
  END LOOP;
END;
/

-- Sync yearly feature strings to canonical definitions
BEGIN
  UPDATE plans SET features = 'AI Parsing,Advanced Analytics (12mo),Budget Tracking & Alerts,Spending Trends,Category Breakdown,Priority Support'
  WHERE billing_period='YEARLY' AND plan_type='PRO';
  UPDATE plans SET features = 'AI Parsing,Full Analytics (12mo),Forecasting,Goals,Budget Tracking & Alerts,Advanced Spending Trends,Tax Categorization & Exports (Excel/PDF),Priority Processing,Top-Priority Support,Early Access'
  WHERE billing_period='YEARLY' AND plan_type='PREMIUM';
END;
/