-- Add storage_key column to raw_statements for OCI original PDF object key reference
ALTER TABLE raw_statements ADD storage_key VARCHAR2(512);

-- Optional index if lookups by storage_key become necessary (can be commented out if not needed)
-- CREATE INDEX idx_raw_statements_storage_key ON raw_statements(storage_key);
