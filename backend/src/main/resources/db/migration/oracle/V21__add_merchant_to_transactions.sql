ALTER TABLE transactions ADD (merchant VARCHAR2(255));
UPDATE transactions SET merchant = description WHERE merchant IS NULL;