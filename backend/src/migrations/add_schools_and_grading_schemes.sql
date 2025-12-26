-- Migration: Add GradingScheme and School tables
-- Run this migration to create the required tables

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    principal_name VARCHAR(255),
    established_year INTEGER,
    school_type VARCHAR(20) DEFAULT 'private' CHECK (school_type IN ('public', 'private', 'charter', 'religious', 'other')),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for schools
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_is_active ON schools(is_active);

-- Create grading_schemes table
CREATE TABLE IF NOT EXISTS grading_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    min_percentage DECIMAL(5,2) NOT NULL,
    max_percentage DECIMAL(5,2) NOT NULL,
    grade_point DECIMAL(3,2),
    passing_marks INTEGER DEFAULT 40,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for grading_schemes
CREATE INDEX IF NOT EXISTS idx_grading_schemes_grade ON grading_schemes(grade);
CREATE INDEX IF NOT EXISTS idx_grading_schemes_is_active ON grading_schemes(is_active);
CREATE INDEX IF NOT EXISTS idx_grading_schemes_school_id ON grading_schemes(school_id);

-- Insert default grading schemes
INSERT INTO grading_schemes (name, grade, min_percentage, max_percentage, grade_point, passing_marks, description)
VALUES 
    ('Grade A+', 'A+', 90.00, 100.00, 4.00, 40, 'Excellent'),
    ('Grade A', 'A', 80.00, 89.99, 3.70, 40, 'Very Good'),
    ('Grade B+', 'B+', 75.00, 79.99, 3.30, 40, 'Good'),
    ('Grade B', 'B', 70.00, 74.99, 3.00, 40, 'Above Average'),
    ('Grade C+', 'C+', 65.00, 69.99, 2.70, 40, 'Average'),
    ('Grade C', 'C', 60.00, 64.99, 2.30, 40, 'Satisfactory'),
    ('Grade D+', 'D+', 55.00, 59.99, 2.00, 40, 'Below Average'),
    ('Grade D', 'D', 50.00, 54.99, 1.70, 40, 'Pass'),
    ('Grade E', 'E', 40.00, 49.99, 1.00, 40, 'Minimum Pass'),
    ('Grade F', 'F', 0.00, 39.99, 0.00, 40, 'Fail')
ON CONFLICT DO NOTHING;

-- Insert a sample school
INSERT INTO schools (name, code, address, city, state, country, phone, email, school_type)
VALUES 
    ('Vision Academy School', 'VAS001', '3522 West Fork Street', 'Missoula', 'MT', 'USA', '+1 555-123-4567', 'info@visionacademy.edu', 'private')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE schools IS 'Stores school/institution information';
COMMENT ON TABLE grading_schemes IS 'Defines grading criteria for evaluating student performance';
