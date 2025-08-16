-- Adds AWS pipeline progress tracking fields to statement_jobs
ALTER TABLE statement_jobs
    ADD COLUMN IF NOT EXISTS total_pages INT,
    ADD COLUMN IF NOT EXISTS processed_pages INT,
    ADD COLUMN IF NOT EXISTS total_chunks INT,
    ADD COLUMN IF NOT EXISTS processed_chunks INT,
    ADD COLUMN IF NOT EXISTS error_count INT,
    ADD COLUMN IF NOT EXISTS execution_arn VARCHAR(200);

-- Optional: create an index to quickly find in-progress jobs for poller / Step Functions check lambda
CREATE INDEX IF NOT EXISTS idx_statement_jobs_status ON statement_jobs(status);
