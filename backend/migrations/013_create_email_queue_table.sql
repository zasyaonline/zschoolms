-- Migration: Create email_queue table for bulk email distribution
-- Date: 2024-12-28
-- Description: Adds email_queue table for tracking and managing bulk email sending

-- Create enum for email status
DO $$ BEGIN
    CREATE TYPE email_queue_status AS ENUM ('pending', 'queued', 'processing', 'sent', 'failed', 'bounced', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create the email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Job reference (optional)
    batch_job_id UUID REFERENCES batch_jobs(id) ON DELETE SET NULL,
    
    -- Recipient info
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    recipient_type VARCHAR(50) DEFAULT 'sponsor', -- sponsor, parent, student
    
    -- Sponsor reference
    sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,
    
    -- Email content
    subject VARCHAR(500) NOT NULL,
    html_body TEXT,
    text_body TEXT,
    
    -- Attachments (JSON array of S3 keys and metadata)
    attachments JSONB DEFAULT '[]',
    
    -- Students covered in this email (for consolidated emails)
    student_ids JSONB DEFAULT '[]',
    report_card_ids JSONB DEFAULT '[]',
    
    -- Scope identifiers
    academic_year_id UUID REFERENCES academic_years(id),
    class_section_id UUID REFERENCES class_sections(id),
    
    -- Status tracking
    status email_queue_status NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_retry_at TIMESTAMP,
    next_retry_at TIMESTAMP,
    
    -- Result tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    error_message TEXT,
    
    -- External tracking
    message_id VARCHAR(255), -- From email provider (e.g., SES message ID)
    provider_response JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    initiated_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_batch_job ON email_queue(batch_job_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_recipient ON email_queue(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_queue_sponsor ON email_queue(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_next_retry ON email_queue(next_retry_at) WHERE status = 'failed' AND retry_count < max_retries;

-- Index for pending/queued emails for processing
CREATE INDEX IF NOT EXISTS idx_email_queue_processing 
ON email_queue(priority, created_at) 
WHERE status IN ('pending', 'queued');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_queue_updated_at ON email_queue;
CREATE TRIGGER trg_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_email_queue_updated_at();

-- Comments
COMMENT ON TABLE email_queue IS 'Queue for bulk email distribution with retry support';
COMMENT ON COLUMN email_queue.attachments IS 'JSON array of attachment metadata with S3 keys';
COMMENT ON COLUMN email_queue.student_ids IS 'Array of student IDs whose report cards are attached';
COMMENT ON COLUMN email_queue.priority IS 'Email priority: 1=highest, 10=lowest';
COMMENT ON COLUMN email_queue.message_id IS 'Message ID returned by email provider for tracking';
