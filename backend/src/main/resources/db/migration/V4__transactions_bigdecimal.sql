-- Migrate transactions.amount and transactions.balance to high precision numeric
ALTER TABLE transactions
    ALTER COLUMN amount TYPE NUMERIC(19,4) USING amount::numeric(19,4);
ALTER TABLE transactions
    ALTER COLUMN balance TYPE NUMERIC(19,4) USING balance::numeric(19,4);
