-- Migration: Create Report Cards System
-- Version: 007
-- Description: Creates report_cards table for PDF generation, digital signature, and distribution
-- Dependencies: students table, marksheets table, users table, student_sponsor_mapping table
-- Author: ZSchool Development Team
-- Date: 2025-12-22

-- ============================================================================
-- 1. CREATE ENUM TYPES
-- ============================================================================

-- Report card status enum
CREATE TYPE report_card_status_enum AS ENUM ('pending', 'generating', 'generated', 'signed', 'distributed', 'failed');

-- Report type enum
CREATE TYPE report_type_enum AS ENUM ('term1', 'term2', 'final', 'midterm', 'annual');

COMMENT ON TYPE report_card_status_enum IS 'Report card generation and distribution workflow status';
COMMENT ON TYPE report_type_enum IS 'Type/term of report card';

-- ============================================================================
-- 2. CREATE REPORT_CARDS TABLE
-- ============================================================================

CREATE TABLE report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL,
    report_type report_type_enum NOT NULL DEFAULT 'term1',
    status report_card_status_enum DEFAULT 'pending',
    
    -- PDF Storage
    pdf_url TEXT,
    pdf_key VARCHAR(500),
    pdf_size_bytes BIGINT,
    
    -- Generation Details
    generated_at TIMESTAMP,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    generation_error TEXT,
    
    -- Digital Signature
    signed_at TIMESTAMP,
    signed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    signature_certificate_id UUID,
    signature_data TEXT,
    
    -- Distribution
    distributed_at TIMESTAMP,
    distributed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP,
    email_opened BOOLEAN DEFAULT false,
    email_opened_at TIMESTAMP,
    distribution_error TEXT,
    
    -- Recipients
    recipient_emails TEXT[], -- Array of email addresses
    cc_emails TEXT[],
    
    -- Metadata
    total_marks DECIMAL(10,2),
    percentage DECIMAL(5,2),
    grade VARCHAR(5),
    rank INTEGER,
    attendance_percentage DECIMAL(5,2),
    remarks TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one report card per student per term per academic year
    CONSTRAINT report_card_unique_student_term UNIQUE (student_id, academic_year_id, report_type)
);

-- Indexes for report_cards
CREATE INDEX idx_report_cards_student_id ON report_cards(student_id);
CREATE INDEX idx_report_cards_academic_year ON report_cards(academic_year_id);
CREATE INDEX idx_report_cards_status ON report_cards(status);
CREATE INDEX idx_report_cards_report_type ON report_cards(report_type);
CREATE INDEX idx_report_cards_generated_by ON report_cards(generated_by);
CREATE INDEX idx_report_cards_signed_by ON report_cards(signed_by);
CREATE INDEX idx_report_cards_distributed_by ON report_cards(distributed_by);
CREATE INDEX idx_report_cards_pending ON report_cards(status) WHERE status = 'pending';
CREATE INDEX idx_report_cards_generated ON report_cards(status) WHERE status = 'generated';
CREATE INDEX idx_report_cards_email_sent ON report_cards(email_sent) WHERE email_sent = false;
CREATE INDEX idx_report_cards_student_year ON report_cards(student_id, academic_year_id);

-- Comments for report_cards table
COMMENT ON TABLE report_cards IS 'Student report cards with PDF generation, signature, and distribution tracking';
COMMENT ON COLUMN report_cards.student_id IS 'Student for whom report card is generated';
COMMENT ON COLUMN report_cards.academic_year_id IS 'Academic year for this report card';
COMMENT ON COLUMN report_cards.report_type IS 'Type of report (term1, term2, final, etc.)';
COMMENT ON COLUMN report_cards.status IS 'Workflow status of report card generation/distribution';
COMMENT ON COLUMN report_cards.pdf_url IS 'URL to access generated PDF (S3 or local)';
COMMENT ON COLUMN report_cards.pdf_key IS 'Storage key/path for PDF file';
COMMENT ON COLUMN report_cards.signed_at IS 'Timestamp when digitally signed by principal';
COMMENT ON COLUMN report_cards.signature_certificate_id IS 'Certificate used for digital signature';
COMMENT ON COLUMN report_cards.email_sent IS 'Whether email has been sent to sponsors/parents';
COMMENT ON COLUMN report_cards.email_opened IS 'Whether recipient opened the email (tracking)';
COMMENT ON COLUMN report_cards.recipient_emails IS 'Array of email addresses for distribution';

-- ============================================================================
-- 3. CREATE REPORT_CARD_ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE report_card_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_card_id UUID NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_key VARCHAR(500),
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for attachments
CREATE INDEX idx_report_card_attachments_report_card ON report_card_attachments(report_card_id);

COMMENT ON TABLE report_card_attachments IS 'Additional attachments for report cards (certificates, awards, etc.)';

-- ============================================================================
-- 4. CREATE REPORT_CARD_DISTRIBUTION_LOG TABLE
-- ============================================================================

CREATE TABLE report_card_distribution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_card_id UUID NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_status VARCHAR(50) DEFAULT 'sent',
    opened_at TIMESTAMP,
    bounce_reason TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for distribution log
CREATE INDEX idx_distribution_log_report_card ON report_card_distribution_log(report_card_id);
CREATE INDEX idx_distribution_log_email ON report_card_distribution_log(recipient_email);
CREATE INDEX idx_distribution_log_status ON report_card_distribution_log(delivery_status);

COMMENT ON TABLE report_card_distribution_log IS 'Detailed log of report card email distributions';
COMMENT ON COLUMN report_card_distribution_log.delivery_status IS 'Email delivery status: sent, delivered, bounced, failed';

-- ============================================================================
-- 5. CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Trigger for report_cards
CREATE TRIGGER update_report_cards_updated_at
    BEFORE UPDATE ON report_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. CREATE VIEWS FOR REPORTING
-- ============================================================================

-- View for report card summary with student details
CREATE VIEW report_card_summary AS
SELECT 
    rc.id AS report_card_id,
    rc.student_id,
    s.user_id,
    u.first_name,
    u.last_name,
    u.email AS student_email,
    rc.academic_year_id,
    rc.report_type,
    rc.status,
    rc.generated_at,
    rc.signed_at,
    rc.distributed_at,
    rc.email_sent,
    rc.email_opened,
    rc.total_marks,
    rc.percentage,
    rc.grade,
    rc.rank,
    rc.attendance_percentage,
    rc.pdf_url,
    generator.first_name || ' ' || generator.last_name AS generated_by_name,
    signer.first_name || ' ' || signer.last_name AS signed_by_name,
    distributor.first_name || ' ' || distributor.last_name AS distributed_by_name
FROM report_cards rc
JOIN students s ON rc.student_id = s.id
JOIN users u ON s.user_id = u.id
LEFT JOIN users generator ON rc.generated_by = generator.id
LEFT JOIN users signer ON rc.signed_by = signer.id
LEFT JOIN users distributor ON rc.distributed_by = distributor.id;

COMMENT ON VIEW report_card_summary IS 'Comprehensive view of report cards with student and action details';

-- View for pending distributions
CREATE VIEW pending_distributions AS
SELECT 
    rc.id AS report_card_id,
    rc.student_id,
    u.first_name || ' ' || u.last_name AS student_name,
    u.email AS student_email,
    rc.report_type,
    rc.status,
    rc.generated_at,
    rc.signed_at,
    rc.recipient_emails,
    rc.pdf_url
FROM report_cards rc
JOIN students s ON rc.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE rc.status IN ('signed', 'generated')
AND rc.email_sent = false
ORDER BY rc.generated_at ASC;

COMMENT ON VIEW pending_distributions IS 'Report cards ready for email distribution';

-- ============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update report card status
CREATE OR REPLACE FUNCTION update_report_card_status(
    p_report_card_id UUID,
    p_new_status report_card_status_enum,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE report_cards
    SET 
        status = p_new_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_report_card_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_report_card_status IS 'Update report card status with audit tracking';

-- Function to mark email as opened
CREATE OR REPLACE FUNCTION mark_email_opened(p_report_card_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE report_cards
    SET 
        email_opened = true,
        email_opened_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_report_card_id
    AND email_opened = false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_email_opened IS 'Mark report card email as opened (tracking pixel)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('report_cards', 'report_card_attachments', 'report_card_distribution_log');
    
    IF table_count = 3 THEN
        RAISE NOTICE 'Migration 007 completed successfully. Created % tables.', table_count;
    ELSE
        RAISE WARNING 'Migration 007 may be incomplete. Expected 3 tables, found %.', table_count;
    END IF;
END $$;
