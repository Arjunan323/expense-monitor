-- Ensure SUBSCRIPTIONS has BILLING_PERIOD column (entity expects it) to fix ORA-00904 on S1_0.BILLING_PERIOD
DECLARE
  v_col NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO v_col FROM user_tab_cols WHERE table_name='SUBSCRIPTIONS' AND column_name='BILLING_PERIOD';
  IF v_col = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE SUBSCRIPTIONS ADD (BILLING_PERIOD VARCHAR2(16))';
    -- Backfill: infer yearly if end_date - start_date > 60 days; else MONTHLY; FREE subs remain null
    -- In Oracle DATE subtraction returns number of days (NUMBER). 60 ~ two months cutoff.
    -- Use standard string concatenation (avoid q-quote for older Oracle compatibility)
    EXECUTE IMMEDIATE 'UPDATE SUBSCRIPTIONS SET BILLING_PERIOD = CASE ' ||
      'WHEN PLAN_TYPE IS NULL THEN NULL ' ||
      'WHEN END_DATE IS NOT NULL AND START_DATE IS NOT NULL AND (END_DATE - START_DATE) > 60 THEN ''YEARLY'' ' ||
      'ELSE ''MONTHLY'' END ' ||
      'WHERE BILLING_PERIOD IS NULL';
  END IF;
END;
/