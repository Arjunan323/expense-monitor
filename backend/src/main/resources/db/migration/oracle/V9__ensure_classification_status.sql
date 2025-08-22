-- Idempotent: Try to add column; swallow error if already exists
DECLARE
  e_col_exists EXCEPTION; PRAGMA EXCEPTION_INIT(e_col_exists, -1430); -- ORA-01430: column being added already exists
BEGIN
  BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE tax_transactions ADD (classification_status VARCHAR2(16) DEFAULT ''CONFIRMED'')';
  EXCEPTION WHEN e_col_exists THEN NULL; END;
  -- Backfill (safe even if column pre-existed)
  EXECUTE IMMEDIATE 'UPDATE tax_transactions SET classification_status = ''CONFIRMED'' WHERE classification_status IS NULL';
END;
/
