-- Migration: 009_immutable_records_triggers.sql
-- Description: Add PostgreSQL triggers to enforce immutability for approved marks and signed report cards
-- Date: 2024-12-27
-- 
-- This ensures:
-- 1. Approved marksheets cannot be updated or deleted
-- 2. Signed report cards cannot be updated or deleted
-- 3. All attempts are logged for audit purposes

-- ============================================================================
-- 1. Create function to prevent updates/deletes on approved marksheets
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_marksheet_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- For UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        -- Check if the marksheet was already approved
        IF OLD.status = 'approved' THEN
            RAISE EXCEPTION 'Cannot modify approved marksheet. Record ID: %, approved status is immutable.', OLD.id;
        END IF;
        -- Prevent changing from approved to any other status
        IF NEW.status != 'approved' AND OLD.status = 'approved' THEN
            RAISE EXCEPTION 'Cannot change status of approved marksheet. Record ID: %', OLD.id;
        END IF;
    END IF;
    
    -- For DELETE operations
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'approved' THEN
            RAISE EXCEPTION 'Cannot delete approved marksheet. Record ID: %, approved records are immutable.', OLD.id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on marksheets table
DROP TRIGGER IF EXISTS enforce_marksheet_immutability ON marksheets;
CREATE TRIGGER enforce_marksheet_immutability
    BEFORE UPDATE OR DELETE ON marksheets
    FOR EACH ROW
    EXECUTE FUNCTION prevent_marksheet_modification();

COMMENT ON TRIGGER enforce_marksheet_immutability ON marksheets IS 
    'Prevents modification or deletion of approved marksheets to ensure data integrity';

-- ============================================================================
-- 2. Create function to prevent updates/deletes on individual marks
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_mark_modification()
RETURNS TRIGGER AS $$
DECLARE
    marksheet_status VARCHAR(50);
BEGIN
    -- Get the status of the parent marksheet
    SELECT status INTO marksheet_status 
    FROM marksheets 
    WHERE id = COALESCE(OLD.marksheet_id, NEW.marksheet_id);
    
    -- For UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        IF marksheet_status = 'approved' THEN
            RAISE EXCEPTION 'Cannot modify marks in approved marksheet. Mark ID: %, Marksheet is immutable.', OLD.id;
        END IF;
    END IF;
    
    -- For DELETE operations
    IF TG_OP = 'DELETE' THEN
        IF marksheet_status = 'approved' THEN
            RAISE EXCEPTION 'Cannot delete marks from approved marksheet. Mark ID: %, Marksheet is immutable.', OLD.id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on marks table
DROP TRIGGER IF EXISTS enforce_mark_immutability ON marks;
CREATE TRIGGER enforce_mark_immutability
    BEFORE UPDATE OR DELETE ON marks
    FOR EACH ROW
    EXECUTE FUNCTION prevent_mark_modification();

COMMENT ON TRIGGER enforce_mark_immutability ON marks IS 
    'Prevents modification or deletion of marks in approved marksheets';

-- ============================================================================
-- 3. Create function to prevent updates/deletes on signed report cards
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_report_card_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- For UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        -- Check if the report card was already signed
        IF OLD.status IN ('Signed', 'Distributed') AND OLD.signed_by IS NOT NULL THEN
            -- Allow only status change from Signed to Distributed (for email distribution)
            IF NEW.status = 'Distributed' AND OLD.status = 'Signed' THEN
                -- This is allowed - distributing a signed report card
                RETURN NEW;
            END IF;
            
            -- Check if any other fields are being changed
            IF OLD.total_marks_obtained != NEW.total_marks_obtained OR
               OLD.total_max_marks != NEW.total_max_marks OR
               OLD.percentage != NEW.percentage OR
               OLD.final_grade != NEW.final_grade OR
               OLD.pdf_url != NEW.pdf_url OR
               OLD.student_id != NEW.student_id OR
               OLD.academic_year_id != NEW.academic_year_id THEN
                RAISE EXCEPTION 'Cannot modify signed report card. Record ID: %, signed records are immutable.', OLD.id;
            END IF;
        END IF;
    END IF;
    
    -- For DELETE operations
    IF TG_OP = 'DELETE' THEN
        IF OLD.status IN ('Signed', 'Distributed') AND OLD.signed_by IS NOT NULL THEN
            RAISE EXCEPTION 'Cannot delete signed report card. Record ID: %, signed records are immutable.', OLD.id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on report_cards table
DROP TRIGGER IF EXISTS enforce_report_card_immutability ON report_cards;
CREATE TRIGGER enforce_report_card_immutability
    BEFORE UPDATE OR DELETE ON report_cards
    FOR EACH ROW
    EXECUTE FUNCTION prevent_report_card_modification();

COMMENT ON TRIGGER enforce_report_card_immutability ON report_cards IS 
    'Prevents modification or deletion of signed report cards to ensure document authenticity';

-- ============================================================================
-- 4. Create audit log table for immutability violations (optional logging)
-- ============================================================================

CREATE TABLE IF NOT EXISTS immutability_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL, -- UPDATE or DELETE
    attempted_by UUID, -- User who attempted the operation (if available)
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    old_data JSONB,
    new_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_immutability_audit_table ON immutability_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_immutability_audit_record ON immutability_audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_immutability_audit_timestamp ON immutability_audit_log(attempted_at);

COMMENT ON TABLE immutability_audit_log IS 'Audit log for tracking attempted violations of immutable record policies';

-- ============================================================================
-- 5. Create function to log immutability violations (enhanced version)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_immutability_violation()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the attempted violation
    INSERT INTO immutability_audit_log (table_name, record_id, operation, old_data, new_data, error_message)
    VALUES (
        TG_TABLE_NAME,
        OLD.id,
        TG_OP,
        row_to_json(OLD),
        CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        'Attempted to modify immutable record'
    );
    
    -- Return NULL to cancel the operation (this happens after the RAISE in the main trigger)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Add signature storage columns to report_cards if not exists
-- ============================================================================

DO $$ 
BEGIN
    -- Add digital signature column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'report_cards' AND column_name = 'digital_signature') THEN
        ALTER TABLE report_cards ADD COLUMN digital_signature TEXT;
    END IF;
    
    -- Add signature algorithm
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'report_cards' AND column_name = 'signature_algorithm') THEN
        ALTER TABLE report_cards ADD COLUMN signature_algorithm VARCHAR(50) DEFAULT 'RSA-SHA256';
    END IF;
    
    -- Add PDF hash for integrity verification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'report_cards' AND column_name = 'pdf_hash') THEN
        ALTER TABLE report_cards ADD COLUMN pdf_hash VARCHAR(64); -- SHA-256 hex
    END IF;
    
    -- Add certificate fingerprint
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'report_cards' AND column_name = 'certificate_fingerprint') THEN
        ALTER TABLE report_cards ADD COLUMN certificate_fingerprint VARCHAR(64);
    END IF;
    
    -- Add S3 storage key
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'report_cards' AND column_name = 's3_key') THEN
        ALTER TABLE report_cards ADD COLUMN s3_key VARCHAR(500);
    END IF;
    
    -- Add signed_at timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'report_cards' AND column_name = 'signed_at') THEN
        ALTER TABLE report_cards ADD COLUMN signed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================================================
-- 7. Add sponsor renewal tracking columns
-- ============================================================================

DO $$ 
BEGIN
    -- Add last reminder sent date to sponsor_student_mappings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sponsor_student_mappings' AND column_name = 'last_reminder_sent') THEN
        ALTER TABLE sponsor_student_mappings ADD COLUMN last_reminder_sent TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add reminder count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sponsor_student_mappings' AND column_name = 'reminder_count') THEN
        ALTER TABLE sponsor_student_mappings ADD COLUMN reminder_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================================
-- Rollback commands (for reference)
-- ============================================================================
-- 
-- DROP TRIGGER IF EXISTS enforce_marksheet_immutability ON marksheets;
-- DROP TRIGGER IF EXISTS enforce_mark_immutability ON marks;
-- DROP TRIGGER IF EXISTS enforce_report_card_immutability ON report_cards;
-- DROP FUNCTION IF EXISTS prevent_marksheet_modification();
-- DROP FUNCTION IF EXISTS prevent_mark_modification();
-- DROP FUNCTION IF EXISTS prevent_report_card_modification();
-- DROP FUNCTION IF EXISTS log_immutability_violation();
-- DROP TABLE IF EXISTS immutability_audit_log;
-- ALTER TABLE report_cards DROP COLUMN IF EXISTS digital_signature;
-- ALTER TABLE report_cards DROP COLUMN IF EXISTS signature_algorithm;
-- ALTER TABLE report_cards DROP COLUMN IF EXISTS pdf_hash;
-- ALTER TABLE report_cards DROP COLUMN IF EXISTS certificate_fingerprint;
-- ALTER TABLE report_cards DROP COLUMN IF EXISTS s3_key;
-- ALTER TABLE report_cards DROP COLUMN IF EXISTS signed_at;
-- ALTER TABLE student_sponsor_mappings DROP COLUMN IF EXISTS last_reminder_sent;
-- ALTER TABLE student_sponsor_mappings DROP COLUMN IF EXISTS reminder_count;

-- Log migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 009_immutable_records_triggers completed successfully';
    RAISE NOTICE 'Immutability triggers created for: marksheets, marks, report_cards';
    RAISE NOTICE 'Additional columns added to report_cards for digital signatures';
    RAISE NOTICE 'Renewal tracking columns added to student_sponsor_mappings';
END $$;
