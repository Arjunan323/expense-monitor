-- Safety migration: ensure BILLING_PERIOD column exists and populated
-- Reason: ORA-00904 on BILLING_PERIOD indicates prior migration (V33) may not have executed or silently failed.

DECLARE
  v_col_count NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO v_col_count FROM user_tab_cols
   WHERE table_name = 'PLANS' AND column_name = 'BILLING_PERIOD';
  IF v_col_count = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE PLANS ADD (BILLING_PERIOD VARCHAR2(16) DEFAULT ''MONTHLY'')';
  END IF;
  -- Populate nulls
  EXECUTE IMMEDIATE 'UPDATE PLANS SET BILLING_PERIOD = ''MONTHLY'' WHERE BILLING_PERIOD IS NULL';
EXCEPTION WHEN OTHERS THEN
  -- If anything unexpected happens, re-raise so Flyway marks migration failed instead of hiding issue
  RAISE;
END;
/

-- Recreate composite unique constraint with billing period if missing
DECLARE
  v_cnt NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO v_cnt FROM user_constraints
   WHERE table_name='PLANS' AND constraint_name='UQ_PLAN_TYPE_REGION_PERIOD';
  IF v_cnt = 0 THEN
    BEGIN
      -- Drop old constraint if it still exists
      EXECUTE IMMEDIATE 'ALTER TABLE PLANS DROP CONSTRAINT UQ_PLAN_TYPE_REGION';
    EXCEPTION WHEN OTHERS THEN NULL; END;
    EXECUTE IMMEDIATE 'ALTER TABLE PLANS ADD CONSTRAINT UQ_PLAN_TYPE_REGION_PERIOD UNIQUE (PLAN_TYPE, REGION, BILLING_PERIOD)';
  END IF;
END;
/
