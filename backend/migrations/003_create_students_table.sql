-- Create students table migration
-- Run this migration to create the students table

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_number VARCHAR(50) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  blood_group VARCHAR(10),
  admission_date DATE NOT NULL,
  current_class VARCHAR(20) NOT NULL,
  section VARCHAR(10),
  roll_number VARCHAR(20),
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  emergency_contact VARCHAR(20),
  emergency_contact_name VARCHAR(200),
  medical_info TEXT,
  previous_school VARCHAR(200),
  transfer_certificate VARCHAR(500),
  birth_certificate VARCHAR(500),
  photo VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_sponsor_id ON students(sponsor_id);
CREATE INDEX idx_students_class_section ON students(current_class, section);
CREATE INDEX idx_students_is_active ON students(is_active);
CREATE INDEX idx_students_enrollment ON students(enrollment_number);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_students_updated_at();

-- Comments for documentation
COMMENT ON TABLE students IS 'Student information and relationships';
COMMENT ON COLUMN students.enrollment_number IS 'Unique enrollment/registration number';
COMMENT ON COLUMN students.parent_id IS 'Parent/guardian user ID';
COMMENT ON COLUMN students.sponsor_id IS 'Sponsor user ID (if applicable)';
COMMENT ON COLUMN students.emergency_contact IS 'Emergency contact phone number';
COMMENT ON COLUMN students.medical_info IS 'Medical conditions, allergies, etc.';
COMMENT ON COLUMN students.transfer_certificate IS 'TC document URL';
COMMENT ON COLUMN students.birth_certificate IS 'Birth certificate document URL';
