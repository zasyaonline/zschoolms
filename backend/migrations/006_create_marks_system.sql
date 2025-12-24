-- Migration: Create Marks/Grading System Tables
-- Version: 006
-- Description: Creates subjects, marksheets, and marks tables for student grading
-- Dependencies: students table, users table
-- Author: ZSchool Development Team
-- Date: 2025-12-22

-- ============================================================================
-- 1. CREATE ENUM TYPES
-- ============================================================================

-- Term enum for academic periods
CREATE TYPE term_enum AS ENUM ('term1', 'term2', 'final', 'midterm');

-- Marksheet status enum
CREATE TYPE marksheet_status_enum AS ENUM ('draft', 'submitted', 'approved', 'rejected');

COMMENT ON TYPE term_enum IS 'Academic terms/periods for marksheets';
COMMENT ON TYPE marksheet_status_enum IS 'Workflow status for marksheet approval';

-- ============================================================================
-- 2. CREATE SUBJECTS TABLE
-- ============================================================================

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    class VARCHAR(20) NOT NULL,
    max_marks INTEGER NOT NULL CHECK (max_marks > 0),
    passing_marks INTEGER NOT NULL CHECK (passing_marks > 0 AND passing_marks <= max_marks),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for subjects
CREATE INDEX idx_subjects_class ON subjects(class);
CREATE INDEX idx_subjects_code ON subjects(code);
CREATE INDEX idx_subjects_active ON subjects(is_active);
CREATE INDEX idx_subjects_class_active ON subjects(class, is_active);

-- Comments for subjects table
COMMENT ON TABLE subjects IS 'Academic subjects with grading configuration';
COMMENT ON COLUMN subjects.code IS 'Unique subject code (e.g., MATH10, SCI10)';
COMMENT ON COLUMN subjects.class IS 'Class/grade level (e.g., 10, 11, 12)';
COMMENT ON COLUMN subjects.max_marks IS 'Maximum marks for this subject';
COMMENT ON COLUMN subjects.passing_marks IS 'Minimum marks required to pass';

-- ============================================================================
-- 3. CREATE MARKSHEETS TABLE
-- ============================================================================

CREATE TABLE marksheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class VARCHAR(20) NOT NULL,
    section VARCHAR(20),
    term term_enum NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    status marksheet_status_enum DEFAULT 'draft',
    submitted_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    submitted_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one marksheet per student per term per academic year
    CONSTRAINT marksheet_unique_student_term UNIQUE (student_id, term, academic_year)
);

-- Indexes for marksheets
CREATE INDEX idx_marksheets_student_id ON marksheets(student_id);
CREATE INDEX idx_marksheets_status ON marksheets(status);
CREATE INDEX idx_marksheets_term ON marksheets(term);
CREATE INDEX idx_marksheets_academic_year ON marksheets(academic_year);
CREATE INDEX idx_marksheets_class_section ON marksheets(class, section);
CREATE INDEX idx_marksheets_submitted_by ON marksheets(submitted_by);
CREATE INDEX idx_marksheets_reviewed_by ON marksheets(reviewed_by);
CREATE INDEX idx_marksheets_pending ON marksheets(status) WHERE status = 'submitted';
CREATE INDEX idx_marksheets_student_year ON marksheets(student_id, academic_year);

-- Comments for marksheets table
COMMENT ON TABLE marksheets IS 'Student marksheets with approval workflow';
COMMENT ON COLUMN marksheets.term IS 'Academic term (term1, term2, final, midterm)';
COMMENT ON COLUMN marksheets.academic_year IS 'Academic year in format YYYY-YYYY (e.g., 2025-2026)';
COMMENT ON COLUMN marksheets.status IS 'Workflow status: draft -> submitted -> approved/rejected';
COMMENT ON COLUMN marksheets.submitted_by IS 'Teacher who submitted the marksheet';
COMMENT ON COLUMN marksheets.reviewed_by IS 'Principal/Admin who reviewed the marksheet';
COMMENT ON COLUMN marksheets.rejection_reason IS 'Reason for rejection (if rejected)';

-- ============================================================================
-- 4. CREATE MARKS TABLE
-- ============================================================================

CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marksheet_id UUID NOT NULL REFERENCES marksheets(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    marks_obtained DECIMAL(5,2) NOT NULL CHECK (marks_obtained >= 0),
    max_marks INTEGER NOT NULL CHECK (max_marks > 0),
    grade VARCHAR(5),
    percentage DECIMAL(5,2),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one mark entry per subject per marksheet
    CONSTRAINT marks_unique_marksheet_subject UNIQUE (marksheet_id, subject_id),
    
    -- Ensure obtained marks don't exceed max marks
    CONSTRAINT marks_obtained_valid CHECK (marks_obtained <= max_marks)
);

-- Indexes for marks
CREATE INDEX idx_marks_marksheet_id ON marks(marksheet_id);
CREATE INDEX idx_marks_subject_id ON marks(subject_id);
CREATE INDEX idx_marks_grade ON marks(grade);
CREATE INDEX idx_marks_marksheet_subject ON marks(marksheet_id, subject_id);

-- Comments for marks table
COMMENT ON TABLE marks IS 'Individual subject marks for each marksheet';
COMMENT ON COLUMN marks.marks_obtained IS 'Marks obtained by student (can have decimals)';
COMMENT ON COLUMN marks.max_marks IS 'Maximum marks for this subject (copied from subject)';
COMMENT ON COLUMN marks.grade IS 'Calculated grade (A+, A, B, etc.)';
COMMENT ON COLUMN marks.percentage IS 'Calculated percentage for this subject';

-- ============================================================================
-- 5. CREATE GRADING SCHEMES TABLE
-- ============================================================================

CREATE TABLE grading_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    min_percentage DECIMAL(5,2) NOT NULL CHECK (min_percentage >= 0 AND min_percentage <= 100),
    max_percentage DECIMAL(5,2) NOT NULL CHECK (max_percentage >= 0 AND max_percentage <= 100),
    grade VARCHAR(5) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure max is greater than min
    CONSTRAINT grading_scheme_valid_range CHECK (max_percentage > min_percentage)
);

-- Indexes for grading schemes
CREATE INDEX idx_grading_schemes_active ON grading_schemes(is_active);
CREATE INDEX idx_grading_schemes_order ON grading_schemes(display_order);
CREATE INDEX idx_grading_schemes_grade ON grading_schemes(grade);

-- Comments for grading schemes table
COMMENT ON TABLE grading_schemes IS 'Grading scheme configuration (percentage ranges to grades)';
COMMENT ON COLUMN grading_schemes.min_percentage IS 'Minimum percentage for this grade (inclusive)';
COMMENT ON COLUMN grading_schemes.max_percentage IS 'Maximum percentage for this grade (inclusive)';
COMMENT ON COLUMN grading_schemes.grade IS 'Grade label (A+, A, B, C, D, F, etc.)';
COMMENT ON COLUMN grading_schemes.display_order IS 'Sort order for display (0 = highest grade)';

-- ============================================================================
-- 6. INSERT DEFAULT GRADING SCHEME
-- ============================================================================

INSERT INTO grading_schemes (name, min_percentage, max_percentage, grade, description, display_order) VALUES
('Exceptional', 90.00, 100.00, 'A+', 'Outstanding performance', 0),
('Excellent', 80.00, 89.99, 'A', 'Excellent performance', 1),
('Very Good', 70.00, 79.99, 'B', 'Very good performance', 2),
('Good', 60.00, 69.99, 'C', 'Good performance', 3),
('Satisfactory', 50.00, 59.99, 'D', 'Satisfactory performance', 4),
('Pass', 40.00, 49.99, 'E', 'Pass with minimum marks', 5),
('Fail', 0.00, 39.99, 'F', 'Failed to meet minimum requirements', 6);

-- ============================================================================
-- 7. CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Trigger for subjects
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for marksheets
CREATE TRIGGER update_marksheets_updated_at
    BEFORE UPDATE ON marksheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for marks
CREATE TRIGGER update_marks_updated_at
    BEFORE UPDATE ON marks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for grading schemes
CREATE TRIGGER update_grading_schemes_updated_at
    BEFORE UPDATE ON grading_schemes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. CREATE VIEWS FOR REPORTING
-- ============================================================================

-- View for marksheet summary with student details
CREATE VIEW marksheet_summary AS
SELECT 
    m.id AS marksheet_id,
    m.student_id,
    s.user_id,
    u.first_name,
    u.last_name,
    m.class,
    m.section,
    m.term,
    m.academic_year,
    m.status,
    COUNT(mk.id) AS total_subjects,
    ROUND(AVG(mk.percentage), 2) AS average_percentage,
    ROUND(SUM(mk.marks_obtained), 2) AS total_marks_obtained,
    SUM(mk.max_marks) AS total_max_marks,
    m.submitted_at,
    m.reviewed_at,
    submitter.first_name || ' ' || submitter.last_name AS submitted_by_name,
    reviewer.first_name || ' ' || reviewer.last_name AS reviewed_by_name
FROM marksheets m
JOIN students s ON m.student_id = s.id
JOIN users u ON s.user_id = u.id
LEFT JOIN marks mk ON m.id = mk.marksheet_id
LEFT JOIN users submitter ON m.submitted_by = submitter.id
LEFT JOIN users reviewer ON m.reviewed_by = reviewer.id
GROUP BY 
    m.id, m.student_id, s.user_id, u.first_name, u.last_name,
    m.class, m.section, m.term, m.academic_year, m.status,
    m.submitted_at, m.reviewed_at, submitter.first_name, submitter.last_name,
    reviewer.first_name, reviewer.last_name;

COMMENT ON VIEW marksheet_summary IS 'Summary view of marksheets with student and marks aggregation';

-- View for subject-wise performance
CREATE VIEW subject_performance AS
SELECT 
    sub.id AS subject_id,
    sub.name AS subject_name,
    sub.code AS subject_code,
    sub.class,
    m.term,
    m.academic_year,
    COUNT(mk.id) AS total_students,
    ROUND(AVG(mk.marks_obtained), 2) AS average_marks,
    ROUND(AVG(mk.percentage), 2) AS average_percentage,
    MAX(mk.marks_obtained) AS highest_marks,
    MIN(mk.marks_obtained) AS lowest_marks,
    COUNT(CASE WHEN mk.marks_obtained >= sub.passing_marks THEN 1 END) AS passed_students,
    COUNT(CASE WHEN mk.marks_obtained < sub.passing_marks THEN 1 END) AS failed_students
FROM subjects sub
LEFT JOIN marks mk ON sub.id = mk.subject_id
LEFT JOIN marksheets m ON mk.marksheet_id = m.id
WHERE m.status = 'approved'
GROUP BY sub.id, sub.name, sub.code, sub.class, m.term, m.academic_year;

COMMENT ON VIEW subject_performance IS 'Subject-wise performance statistics';

-- ============================================================================
-- 9. CREATE FUNCTION FOR GRADE CALCULATION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_grade(percentage_value DECIMAL)
RETURNS VARCHAR(5) AS $$
DECLARE
    calculated_grade VARCHAR(5);
BEGIN
    SELECT grade INTO calculated_grade
    FROM grading_schemes
    WHERE is_active = true
    AND percentage_value >= min_percentage
    AND percentage_value <= max_percentage
    ORDER BY display_order ASC
    LIMIT 1;
    
    -- If no grade found, return 'F'
    IF calculated_grade IS NULL THEN
        calculated_grade := 'F';
    END IF;
    
    RETURN calculated_grade;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_grade IS 'Calculate grade based on percentage using active grading scheme';

-- ============================================================================
-- 10. CREATE TRIGGER TO AUTO-CALCULATE GRADES
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_calculate_grade()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate percentage
    NEW.percentage := ROUND((NEW.marks_obtained / NEW.max_marks) * 100, 2);
    
    -- Calculate grade
    NEW.grade := calculate_grade(NEW.percentage);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_grade_on_insert_or_update
    BEFORE INSERT OR UPDATE OF marks_obtained, max_marks ON marks
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_grade();

COMMENT ON FUNCTION auto_calculate_grade IS 'Automatically calculate percentage and grade when marks are inserted or updated';

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
    AND table_name IN ('subjects', 'marksheets', 'marks', 'grading_schemes');
    
    IF table_count = 4 THEN
        RAISE NOTICE 'Migration 006 completed successfully. Created % tables.', table_count;
    ELSE
        RAISE WARNING 'Migration 006 may be incomplete. Expected 4 tables, found %.', table_count;
    END IF;
END $$;
