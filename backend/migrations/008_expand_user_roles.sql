-- Migration: Expand user roles enum
-- Date: 2025-12-27
-- Description: Add super_admin, principal, sponsor roles to support RBAC requirements

-- PostgreSQL doesn't allow direct ALTER TYPE for enums easily,
-- so we need to add new values to the existing enum

-- Add new role values to the enum (PostgreSQL 9.1+)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'principal';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sponsor';

-- Note: The enum now includes:
-- 'admin', 'teacher', 'student', 'parent', 'staff', 'super_admin', 'principal', 'sponsor'

-- Create a role permissions reference table for documentation
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(role, permission)
);

-- Insert default role permissions
INSERT INTO role_permissions (role, permission, description) VALUES
  -- Super Admin permissions (full access)
  ('super_admin', 'all', 'Full access to all modules and functionalities'),
  ('super_admin', 'bulk_import_teachers', 'Can import teachers in bulk via CSV'),
  
  -- Principal permissions
  ('principal', 'manage_school', 'Access to most modules with some system restrictions'),
  ('principal', 'view_all_reports', 'View all student reports and analytics'),
  ('principal', 'approve_marks', 'Approve submitted marks'),
  
  -- Admin permissions
  ('admin', 'manage_users', 'Create, update, delete users'),
  ('admin', 'manage_students', 'Full student management'),
  ('admin', 'manage_sponsors', 'Full sponsor management'),
  ('admin', 'view_dashboard', 'View admin dashboard metrics'),
  
  -- Teacher permissions
  ('teacher', 'manage_classes', 'Manage assigned classes'),
  ('teacher', 'enter_marks', 'Enter student marks'),
  ('teacher', 'view_students', 'View student profiles in assigned classes'),
  ('teacher', 'mark_attendance', 'Mark student attendance'),
  
  -- Sponsor permissions
  ('sponsor', 'view_sponsored_students', 'View information about sponsored students'),
  ('sponsor', 'view_academic_progress', 'View academic progress of sponsored students'),
  ('sponsor', 'make_payments', 'Make sponsorship payments'),
  
  -- Student permissions
  ('student', 'view_own_profile', 'View own profile'),
  ('student', 'view_own_records', 'View own academic records'),
  ('student', 'view_report_cards', 'View own report cards'),
  
  -- Parent permissions
  ('parent', 'view_children', 'View linked children profiles'),
  ('parent', 'view_children_records', 'View children academic records'),
  
  -- Staff permissions
  ('staff', 'view_dashboard', 'View basic dashboard'),
  ('staff', 'manage_attendance', 'Manage attendance records')
ON CONFLICT (role, permission) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE role_permissions IS 'Reference table defining permissions for each role in the RBAC system';
