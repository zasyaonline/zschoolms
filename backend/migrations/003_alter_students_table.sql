-- Migration: Update students table to match new Student model
-- This migration adds new columns to the existing students table

-- Add enrollment_number column
ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_number VARCHAR(50) UNIQUE;

-- Add parent_id column
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add gender column
DO $$ BEGIN
  CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE students ADD COLUMN IF NOT EXISTS gender gender_enum;

-- Add blood_group column
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);

-- Add admission_date column
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_date DATE;

-- Add current_class column (rename from grade)
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_class VARCHAR(20);

-- Add city column
ALTER TABLE students ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Add state column
ALTER TABLE students ADD COLUMN IF NOT EXISTS state VARCHAR(100);

-- Add pincode column
ALTER TABLE students ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);

-- Add emergency_contact column (use existing contact_details or add new)
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20);

-- Add emergency_contact_name column
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);

-- Add medical_info column
ALTER TABLE students ADD COLUMN IF NOT EXISTS medical_info TEXT;

-- Add previous_school column
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_school VARCHAR(255);

-- Add transfer_certificate column
ALTER TABLE students ADD COLUMN IF NOT EXISTS transfer_certificate VARCHAR(500);

-- Add birth_certificate column
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_certificate VARCHAR(500);

-- Add photo column
ALTER TABLE students ADD COLUMN IF NOT EXISTS photo VARCHAR(500);

-- Add is_active column
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add remarks column
ALTER TABLE students ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Add updated_at column
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_enrollment_number ON students(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_current_class_section ON students(current_class, section);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_students_updated_at ON students;
CREATE TRIGGER trigger_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_students_updated_at();

-- Add comments for documentation
COMMENT ON TABLE students IS 'Student information including personal, academic, and contact details';
COMMENT ON COLUMN students.enrollment_number IS 'Unique student enrollment/registration number (format: STU-YYYY-XXXXX)';
COMMENT ON COLUMN students.parent_id IS 'Reference to parent user account';
COMMENT ON COLUMN students.sponsor_id IS 'Reference to sponsor user account (existing column)';
COMMENT ON COLUMN students.emergency_contact IS 'Emergency contact phone number';
COMMENT ON COLUMN students.medical_info IS 'Medical history, allergies, special needs';
COMMENT ON COLUMN students.transfer_certificate IS 'Path to transfer certificate document';
COMMENT ON COLUMN students.birth_certificate IS 'Path to birth certificate document';
COMMENT ON COLUMN students.is_active IS 'Indicates if student is currently active';
