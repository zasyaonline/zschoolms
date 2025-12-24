-- Migration: Create sponsors and student_sponsor_mapping tables
-- Phase 4: Sponsors Management
-- Created: 2025-12-22

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS student_sponsor_mapping CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;

-- Drop enum types if they exist
DROP TYPE IF EXISTS sponsorship_type_enum CASCADE;
DROP TYPE IF EXISTS sponsor_status_enum CASCADE;
DROP TYPE IF EXISTS mapping_status_enum CASCADE;

-- Create enum types
CREATE TYPE sponsorship_type_enum AS ENUM ('individual', 'organization');
CREATE TYPE sponsor_status_enum AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE mapping_status_enum AS ENUM ('active', 'expired', 'terminated');

-- Create sponsors table
CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    country VARCHAR(100),
    organization VARCHAR(255),
    sponsorship_type sponsorship_type_enum NOT NULL DEFAULT 'individual',
    status sponsor_status_enum NOT NULL DEFAULT 'active',
    total_sponsored_students INTEGER DEFAULT 0,
    notes TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create student_sponsor_mapping table (junction table)
CREATE TABLE student_sponsor_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
    sponsorship_type VARCHAR(20) NOT NULL DEFAULT 'full',
    start_date DATE NOT NULL,
    end_date DATE,
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    status mapping_status_enum NOT NULL DEFAULT 'active',
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_active_mapping UNIQUE (student_id, sponsor_id, status)
);

-- Create indexes for sponsors table
CREATE INDEX idx_sponsors_email ON sponsors(email);
CREATE INDEX idx_sponsors_status ON sponsors(status);
CREATE INDEX idx_sponsors_is_active ON sponsors(is_active);
CREATE INDEX idx_sponsors_country ON sponsors(country);
CREATE INDEX idx_sponsors_created_by ON sponsors(created_by);
CREATE INDEX idx_sponsors_type ON sponsors(sponsorship_type);

-- Create indexes for student_sponsor_mapping table
CREATE INDEX idx_mapping_student_id ON student_sponsor_mapping(student_id);
CREATE INDEX idx_mapping_sponsor_id ON student_sponsor_mapping(sponsor_id);
CREATE INDEX idx_mapping_status ON student_sponsor_mapping(status);
CREATE INDEX idx_mapping_start_date ON student_sponsor_mapping(start_date);
CREATE INDEX idx_mapping_end_date ON student_sponsor_mapping(end_date);
CREATE INDEX idx_mapping_student_sponsor ON student_sponsor_mapping(student_id, sponsor_id);

-- Create trigger function for sponsors updated_at
CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sponsors
CREATE TRIGGER trigger_sponsors_updated_at
    BEFORE UPDATE ON sponsors
    FOR EACH ROW
    EXECUTE FUNCTION update_sponsors_updated_at();

-- Create trigger function for student_sponsor_mapping updated_at
CREATE OR REPLACE FUNCTION update_student_sponsor_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for student_sponsor_mapping
CREATE TRIGGER trigger_student_sponsor_mapping_updated_at
    BEFORE UPDATE ON student_sponsor_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_student_sponsor_mapping_updated_at();

-- Create function to update sponsor student count
CREATE OR REPLACE FUNCTION update_sponsor_student_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the sponsor's total_sponsored_students count
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE sponsors
        SET total_sponsored_students = (
            SELECT COUNT(DISTINCT student_id)
            FROM student_sponsor_mapping
            WHERE sponsor_id = NEW.sponsor_id AND status = 'active'
        )
        WHERE id = NEW.sponsor_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE sponsors
        SET total_sponsored_students = (
            SELECT COUNT(DISTINCT student_id)
            FROM student_sponsor_mapping
            WHERE sponsor_id = OLD.sponsor_id AND status = 'active'
        )
        WHERE id = OLD.sponsor_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update student count
CREATE TRIGGER trigger_update_sponsor_student_count
    AFTER INSERT OR UPDATE OR DELETE ON student_sponsor_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_sponsor_student_count();

-- Add comments for documentation
COMMENT ON TABLE sponsors IS 'Sponsors who provide financial support to students';
COMMENT ON COLUMN sponsors.name IS 'Full name of sponsor or organization name';
COMMENT ON COLUMN sponsors.email IS 'Unique email address for sponsor';
COMMENT ON COLUMN sponsors.sponsorship_type IS 'Type of sponsor: individual or organization';
COMMENT ON COLUMN sponsors.status IS 'Current status: active, inactive, or suspended';
COMMENT ON COLUMN sponsors.total_sponsored_students IS 'Cached count of active sponsored students';
COMMENT ON COLUMN sponsors.notes IS 'Internal notes about sponsor';

COMMENT ON TABLE student_sponsor_mapping IS 'Junction table mapping students to their sponsors';
COMMENT ON COLUMN student_sponsor_mapping.sponsorship_type IS 'Type: full, partial, or one-time';
COMMENT ON COLUMN student_sponsor_mapping.start_date IS 'Date when sponsorship begins';
COMMENT ON COLUMN student_sponsor_mapping.end_date IS 'Date when sponsorship ends (NULL for ongoing)';
COMMENT ON COLUMN student_sponsor_mapping.amount IS 'Monthly or total sponsorship amount';
COMMENT ON COLUMN student_sponsor_mapping.status IS 'Current status: active, expired, or terminated';

-- Insert sample data (optional, for testing)
-- Uncomment to create test sponsors
/*
INSERT INTO sponsors (name, email, phone_number, country, sponsorship_type, status, created_by) 
VALUES 
('John Doe Foundation', 'john.doe@foundation.org', '+1234567890', 'USA', 'organization', 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Jane Smith', 'jane.smith@email.com', '+9876543210', 'UK', 'individual', 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Global Education Trust', 'contact@globaledu.org', '+1122334455', 'Canada', 'organization', 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1));
*/
