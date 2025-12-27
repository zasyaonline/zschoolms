-- Migration: Add fields for marks workflow (rejection comments, submitted_by, approved_by)
-- Date: 2024-12-27
-- Description: Adds fields to support the marks approval/rejection workflow

-- Add rejection_comments field
ALTER TABLE marksheets 
ADD COLUMN IF NOT EXISTS rejection_comments TEXT;

-- Add submitted_by field (who submitted the marksheet)
ALTER TABLE marksheets 
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id);

-- Add submitted_at timestamp
ALTER TABLE marksheets 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;

-- Add approved_by field (who approved/rejected)
ALTER TABLE marksheets 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Add approved_at timestamp
ALTER TABLE marksheets 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Add max_marks field for validation
ALTER TABLE marksheets 
ADD COLUMN IF NOT EXISTS max_marks NUMERIC(5,2) DEFAULT 100.00;

-- Add is_locked field for post-approval lock
ALTER TABLE marksheets 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Add last_auto_save timestamp for auto-save tracking
ALTER TABLE marksheets 
ADD COLUMN IF NOT EXISTS last_auto_save TIMESTAMP;

-- Create index for submitted marksheets by teacher
CREATE INDEX IF NOT EXISTS idx_marksheets_submitted_by ON marksheets(submitted_by) WHERE status = 'submitted';

-- Create index for approved/rejected tracking
CREATE INDEX IF NOT EXISTS idx_marksheets_approved_by ON marksheets(approved_by);

-- Add comments
COMMENT ON COLUMN marksheets.rejection_comments IS 'Comments from principal when rejecting marksheet';
COMMENT ON COLUMN marksheets.submitted_by IS 'User ID of teacher who submitted the marksheet';
COMMENT ON COLUMN marksheets.submitted_at IS 'Timestamp when marksheet was submitted for approval';
COMMENT ON COLUMN marksheets.approved_by IS 'User ID of principal who approved/rejected the marksheet';
COMMENT ON COLUMN marksheets.approved_at IS 'Timestamp when marksheet was approved/rejected';
COMMENT ON COLUMN marksheets.max_marks IS 'Maximum marks for validation (default 100)';
COMMENT ON COLUMN marksheets.is_locked IS 'Whether the marksheet is locked after approval';
COMMENT ON COLUMN marksheets.last_auto_save IS 'Timestamp of last auto-save operation';
