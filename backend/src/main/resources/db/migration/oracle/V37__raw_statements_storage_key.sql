-- Add storage_key column for OCI original PDF reference (Oracle dialect)
-- Safe additive change; nullable for backwards compatibility.
ALTER TABLE raw_statements ADD storage_key VARCHAR2(512);

-- Optional future index if lookups by storage_key become frequent:
-- CREATE INDEX idx_raw_statements_storage_key ON raw_statements(storage_key);
