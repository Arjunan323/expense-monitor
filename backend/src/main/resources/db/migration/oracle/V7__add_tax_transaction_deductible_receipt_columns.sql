-- V7: Add deductible / receipt tracking columns to tax_transactions (Oracle)
-- Adds: DEDUCTIBLE (NUMBER(1)), HAS_RECEIPT (NUMBER(1)), RECEIPT_KEY (VARCHAR2(255))
-- Safe to run multiple times (checks data dictionary before altering)

DECLARE
  v_exists NUMBER;
BEGIN
  -- Add DEDUCTIBLE
  SELECT COUNT(*) INTO v_exists FROM user_tab_cols 
    WHERE table_name = 'TAX_TRANSACTIONS' AND column_name = 'DEDUCTIBLE';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE tax_transactions ADD (deductible NUMBER(1))';
  END IF;

  -- Add HAS_RECEIPT
  SELECT COUNT(*) INTO v_exists FROM user_tab_cols 
    WHERE table_name = 'TAX_TRANSACTIONS' AND column_name = 'HAS_RECEIPT';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE tax_transactions ADD (has_receipt NUMBER(1))';
  END IF;

  -- Add RECEIPT_KEY
  SELECT COUNT(*) INTO v_exists FROM user_tab_cols 
    WHERE table_name = 'TAX_TRANSACTIONS' AND column_name = 'RECEIPT_KEY';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE tax_transactions ADD (receipt_key VARCHAR2(255))';
  END IF;
END;
/

-- Disable parallel DML for this session (correct syntax) to avoid ORA-12838 in environments
-- where the table or system has parallel DML enabled.
ALTER SESSION DISABLE PARALLEL DML;

-- Backfill defaults (single statement prevents a second DML triggering ORA-12838)
UPDATE /*+ noparallel(tax_transactions) */ tax_transactions
  SET deductible  = NVL(deductible, 1),
      has_receipt = NVL(has_receipt, 0)
WHERE deductible IS NULL OR has_receipt IS NULL;

-- Optional: create index to speed queries filtering on (user_id, tax_year, deductible)
DECLARE
  v_idx NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_idx FROM user_indexes WHERE index_name = 'IDX_TAX_TX_USER_YEAR_DED';
  IF v_idx = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_tax_tx_user_year_ded ON tax_transactions(user_id, tax_year, deductible)';
  END IF;
END;
/
