-- Phase 6: Attendance Management System
-- Migration: 005_create_attendance_table.sql
-- Description: Creates attendance table for tracking student attendance

-- Create attendance status enum
CREATE TYPE attendance_status_enum AS ENUM ('present', 'absent', 'late', 'excused');

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  class VARCHAR(20) NOT NULL,
  section VARCHAR(20),
  status attendance_status_enum NOT NULL DEFAULT 'present',
  marked_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT attendance_student_date_unique UNIQUE (student_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_class ON attendance(class);
CREATE INDEX idx_attendance_section ON attendance(section);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_marked_by ON attendance(marked_by);
CREATE INDEX idx_attendance_class_date ON attendance(class, date);
CREATE INDEX idx_attendance_student_date_range ON attendance(student_id, date);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

-- Add comments for documentation
COMMENT ON TABLE attendance IS 'Daily attendance records for students';
COMMENT ON COLUMN attendance.id IS 'Unique identifier for attendance record';
COMMENT ON COLUMN attendance.student_id IS 'Reference to student';
COMMENT ON COLUMN attendance.date IS 'Date of attendance';
COMMENT ON COLUMN attendance.class IS 'Class/grade of student on attendance date';
COMMENT ON COLUMN attendance.section IS 'Section of class';
COMMENT ON COLUMN attendance.status IS 'Attendance status: present, absent, late, excused';
COMMENT ON COLUMN attendance.marked_by IS 'Teacher who marked the attendance';
COMMENT ON COLUMN attendance.remarks IS 'Optional remarks or notes';
COMMENT ON COLUMN attendance.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN attendance.updated_at IS 'Timestamp when record was last updated';

-- Create view for attendance statistics
CREATE OR REPLACE VIEW attendance_statistics AS
SELECT 
  date,
  class,
  section,
  COUNT(*) as total_students,
  COUNT(*) FILTER (WHERE status = 'present') as present_count,
  COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
  COUNT(*) FILTER (WHERE status = 'late') as late_count,
  COUNT(*) FILTER (WHERE status = 'excused') as excused_count,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'present')::NUMERIC / COUNT(*)) * 100,
    2
  ) as attendance_rate
FROM attendance
GROUP BY date, class, section;

COMMENT ON VIEW attendance_statistics IS 'Daily attendance statistics by class and section';

-- Sample query examples (commented out)
/*
-- Get attendance for a specific date
SELECT * FROM attendance WHERE date = '2025-12-22';

-- Get attendance rate for a class
SELECT * FROM attendance_statistics 
WHERE class = '10' AND section = 'A' 
ORDER BY date DESC;

-- Get student attendance history
SELECT 
  s.id,
  u.first_name,
  u.last_name,
  a.date,
  a.status,
  a.remarks
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE s.id = 'student-uuid'
ORDER BY a.date DESC;

-- Get monthly attendance summary
SELECT 
  s.id,
  u.first_name || ' ' || u.last_name as student_name,
  COUNT(*) as total_days,
  COUNT(*) FILTER (WHERE status = 'present') as present_days,
  COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'present')::NUMERIC / COUNT(*)) * 100,
    2
  ) as attendance_percentage
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY s.id, u.first_name, u.last_name
ORDER BY attendance_percentage DESC;
*/

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON attendance TO zschool_app;
-- GRANT SELECT ON attendance_statistics TO zschool_app;

COMMIT;
