-- Migration: Create batch_jobs table for tracking long-running operations
-- Date: 2024-12-28
-- Description: Adds batch_jobs table to track progress of batch report card operations

-- Create enum for job types
DO $$ BEGIN
    CREATE TYPE batch_job_type AS ENUM ('report_card_generation', 'report_card_signing', 'marks_export', 'attendance_report');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for job status
DO $$ BEGIN
    CREATE TYPE batch_job_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create the batch_jobs table
CREATE TABLE IF NOT EXISTS batch_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Job identification
    job_type batch_job_type NOT NULL,
    job_name VARCHAR(255) NOT NULL,
    
    -- Scope of the job
    class_section_id UUID REFERENCES class_sections(id),
    academic_year_id UUID REFERENCES academic_years(id),
    
    -- User who initiated the job
    initiated_by UUID NOT NULL REFERENCES users(id),
    
    -- Status tracking
    status batch_job_status NOT NULL DEFAULT 'pending',
    
    -- Progress tracking
    total_items INTEGER NOT NULL DEFAULT 0,
    processed_items INTEGER NOT NULL DEFAULT 0,
    successful_items INTEGER NOT NULL DEFAULT 0,
    failed_items INTEGER NOT NULL DEFAULT 0,
    skipped_items INTEGER NOT NULL DEFAULT 0,
    
    -- Progress percentage (computed but stored for quick access)
    progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    
    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_completion TIMESTAMP,
    
    -- Results and errors
    result_summary JSONB DEFAULT '{}',
    error_log JSONB DEFAULT '[]',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Standard timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_batch_jobs_type ON batch_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_initiated_by ON batch_jobs(initiated_by);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_class_section ON batch_jobs(class_section_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at DESC);

-- Index for active jobs (pending or in_progress)
CREATE INDEX IF NOT EXISTS idx_batch_jobs_active 
ON batch_jobs(status) 
WHERE status IN ('pending', 'in_progress');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_batch_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batch_job_updated_at
    BEFORE UPDATE ON batch_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_job_updated_at();

-- Comments
COMMENT ON TABLE batch_jobs IS 'Tracks long-running batch operations like report card generation and signing';
COMMENT ON COLUMN batch_jobs.job_type IS 'Type of batch operation being performed';
COMMENT ON COLUMN batch_jobs.progress_percent IS 'Cached progress percentage for quick UI updates';
COMMENT ON COLUMN batch_jobs.result_summary IS 'Summary of completed job results (JSON)';
COMMENT ON COLUMN batch_jobs.error_log IS 'Array of error messages encountered during processing (JSON)';
COMMENT ON COLUMN batch_jobs.metadata IS 'Additional job-specific metadata (JSON)';
