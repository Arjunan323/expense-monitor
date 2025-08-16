-- Add txn_hash column and unique partial index for deduplication
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS txn_hash VARCHAR(64);
-- Create a unique index to prevent duplicates for same user+hash (ignore nulls)
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_user_txnhash ON transactions(user_id, txn_hash) WHERE txn_hash IS NOT NULL;
