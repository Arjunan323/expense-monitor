-- Reworked to be idempotent. Previous version failed with ORA-01408 because
-- an index on (user_id, created_at) already exists (IDX_SA_USER_CREATED from V18).
-- We skip recreating that duplicate and conditionally create the others.
-- This script can be safely re-run.

DECLARE
	v_exists NUMBER;
BEGIN
	-- transactions(user_id, tx_date)
	SELECT COUNT(*) INTO v_exists FROM user_indexes WHERE index_name = 'IDX_TX_USER_DATE';
	IF v_exists = 0 THEN EXECUTE IMMEDIATE 'CREATE INDEX IDX_TX_USER_DATE ON transactions(user_id, tx_date)'; END IF;

	-- transactions(user_id, merchant)
	SELECT COUNT(*) INTO v_exists FROM user_indexes WHERE index_name = 'IDX_TX_USER_MERCHANT';
	IF v_exists = 0 THEN EXECUTE IMMEDIATE 'CREATE INDEX IDX_TX_USER_MERCHANT ON transactions(user_id, merchant)'; END IF;

	-- spending_alerts(user_id, acknowledged, dismissed)
	SELECT COUNT(*) INTO v_exists FROM user_indexes WHERE index_name = 'IDX_ALERTS_USER_ACK_DISM';
	IF v_exists = 0 THEN EXECUTE IMMEDIATE 'CREATE INDEX IDX_ALERTS_USER_ACK_DISM ON spending_alerts(user_id, acknowledged, dismissed)'; END IF;

	-- spending_alerts(user_id, type, created_at) (extends existing (user_id,type))
	SELECT COUNT(*) INTO v_exists FROM user_indexes WHERE index_name = 'IDX_ALERTS_USER_TYPE_CREATED';
	IF v_exists = 0 THEN EXECUTE IMMEDIATE 'CREATE INDEX IDX_ALERTS_USER_TYPE_CREATED ON spending_alerts(user_id, type, created_at)'; END IF;
END;
/

-- NOTE: Duplicate index intentionally omitted:
-- Existing from V18: IDX_SA_USER_CREATED ON spending_alerts(user_id, created_at)