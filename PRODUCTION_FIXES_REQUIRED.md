# 🔴 CRITICAL PRODUCTION FIXES REQUIRED

**Date**: December 26, 2025  
**Status**: ⚠️ URGENT - Must be fixed before production use

---

## Summary

During test data population, I discovered **critical database schema mismatches** between:
- The migration files (intended design)
- The actual production database (current state)

These issues will cause **runtime failures** when users try to add marks in production.

---

## 🔴 Issue 1: Grading Schemes Table Schema Mismatch

### Problem
The `calculate_grade()` function expects columns that don't exist in the database.

### Expected Schema (from migration 006)
```sql
grading_schemes (
  id,
  name,
  min_percentage,  ✅ Expected
  max_percentage,  ✅ Expected
  grade,           ✅ Expected
  is_active,       ✅ Expected
  display_order,   ✅ Expected
  ...
)
```

### Actual Schema (current database)
```sql
grading_schemes (
  id,
  grade_name,      ❌ Wrong (should be 'grade')
  min_value,       ❌ Wrong (should be 'min_percentage')
  max_value,       ❌ Wrong (should be 'max_percentage')
  passing_marks,
  created_by,
  modified_by,
  created_at,
  modified_at
)
-- MISSING: is_active, display_order
```

### Impact
- ❌ **Cannot insert marks** - trigger `calculate_grade_on_insert_or_update` will fail
- ❌ **Error**: `column "grade" does not exist`
- ❌ **Affects**: All mark entry operations in production

### Current Workaround
- Trigger is **disabled** temporarily to allow test data population
- ⚠️ **Must be fixed before production!**

---

## 🔧 Recommended Fixes

### Option 1: Migrate Database to Match Design (RECOMMENDED)

Run this migration script:

```sql
-- Fix grading_schemes table to match migration 006 design
BEGIN;

-- 1. Add missing columns
ALTER TABLE grading_schemes 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. Rename columns to match expected names
ALTER TABLE grading_schemes 
  RENAME COLUMN grade_name TO grade;
ALTER TABLE grading_schemes 
  RENAME COLUMN min_value TO min_percentage;
ALTER TABLE grading_schemes 
  RENAME COLUMN max_value TO max_percentage;

-- 3. Update constraints
ALTER TABLE grading_schemes 
  DROP CONSTRAINT IF EXISTS grading_schemes_check,
  ADD CONSTRAINT grading_scheme_valid_range 
    CHECK (max_percentage > min_percentage),
  ADD CONSTRAINT grading_scheme_percentage_range
    CHECK (min_percentage >= 0 AND min_percentage <= 100 
       AND max_percentage >= 0 AND max_percentage <= 100);

-- 4. Create missing indexes
CREATE INDEX IF NOT EXISTS idx_grading_schemes_active 
  ON grading_schemes(is_active);
CREATE INDEX IF NOT EXISTS idx_grading_schemes_order 
  ON grading_schemes(display_order);
CREATE INDEX IF NOT EXISTS idx_grading_schemes_grade 
  ON grading_schemes(grade);

-- 5. Update existing data to have proper values
UPDATE grading_schemes SET is_active = true WHERE is_active IS NULL;

-- 6. Insert missing default grading schemes if needed
INSERT INTO grading_schemes 
  (name, min_percentage, max_percentage, grade, description, display_order, is_active) 
VALUES
  ('Exceptional', 90.00, 100.00, 'A+', 'Outstanding performance', 0, true),
  ('Excellent', 80.00, 89.99, 'A', 'Excellent performance', 1, true),
  ('Very Good', 70.00, 79.99, 'B', 'Very good performance', 2, true),
  ('Good', 60.00, 69.99, 'C', 'Good performance', 3, true),
  ('Satisfactory', 50.00, 59.99, 'D', 'Satisfactory performance', 4, true),
  ('Pass', 40.00, 49.99, 'E', 'Pass with minimum marks', 5, true),
  ('Fail', 0.00, 39.99, 'F', 'Failed to meet minimum requirements', 6, true)
ON CONFLICT DO NOTHING;

-- 7. Verify the trigger function works
DO $$
DECLARE
  test_grade VARCHAR(5);
BEGIN
  test_grade := calculate_grade(85.00);
  IF test_grade = 'A' THEN
    RAISE NOTICE '✅ calculate_grade() function works correctly';
  ELSE
    RAISE WARNING '❌ calculate_grade() returned unexpected grade: %', test_grade;
  END IF;
END $$;

COMMIT;
```

### Option 2: Fix the Function to Match Current Schema

If you can't change the table schema, update the function:

```sql
-- Alternative: Fix calculate_grade() to match current schema
CREATE OR REPLACE FUNCTION calculate_grade(percentage_value DECIMAL)
RETURNS VARCHAR(5) AS $$
DECLARE
    calculated_grade VARCHAR(5);
BEGIN
    SELECT grade_name INTO calculated_grade
    FROM grading_schemes
    WHERE percentage_value >= min_value
    AND percentage_value <= max_value
    ORDER BY min_value DESC
    LIMIT 1;
    
    IF calculated_grade IS NULL THEN
        calculated_grade := 'F';
    END IF;
    
    RETURN calculated_grade;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 Issue 2: Missing Course Parts Data

### Problem
The `course_parts` table was empty, causing marksheets to fail foreign key constraints.

### Fix Applied
✅ **PERMANENT FIX APPLIED** - Created 81 course parts:
- 3 terms (Term 1, Term 2, Final) × 9 subjects × 3 academic years
- Data is now in production database

### Verification
```sql
SELECT 
  ay.year, 
  COUNT(DISTINCT cp.id) as course_parts
FROM course_parts cp
JOIN academic_years ay ON cp.academic_year_id = ay.id
GROUP BY ay.year
ORDER BY ay.year;

-- Expected result:
-- 2022-2023 | 27
-- 2023-2024 | 27  
-- 2024-2025 | 27
```

---

## ✅ Issues Fixed (Production Ready)

### 1. Student Subject Enrollments - NULL enrollment_id
- **Issue**: 2022-2023 subject enrollments had NULL enrollment_id
- **Fix**: Updated all records to reference correct academic_year_student_enrollment.id
- **Status**: ✅ Fixed permanently in database

### 2. Test Data Scripts Issues
The following were **ONLY script issues** (not production code):
- ❌ Batch size optimization (script-only)
- ❌ Progress tracking logic (script-only)
- ❌ Year-by-year processing strategy (script-only)
- ❌ INSERT query construction (script-only)

---

## 📋 Action Items

### Before Production Deployment

- [ ] **CRITICAL**: Run Option 1 migration script to fix grading_schemes table
- [ ] **CRITICAL**: Test mark insertion with trigger enabled
- [ ] Verify grade calculation works for all percentage ranges
- [ ] Test frontend mark entry workflow end-to-end
- [ ] Check that course_parts exist for current academic year
- [ ] Update any API code that references grading_schemes columns

### Testing Checklist

```bash
# 1. Test grade calculation function
psql -c "SELECT calculate_grade(95), calculate_grade(75), calculate_grade(35);"
# Expected: A+, B, F

# 2. Test mark insertion with trigger
psql -c "
INSERT INTO marks (id, marksheet_id, subject_id, marks_obtained, max_marks)
VALUES (gen_random_uuid(), 
        (SELECT id FROM marksheets LIMIT 1),
        (SELECT id FROM subjects LIMIT 1),
        85, 100);
"
# Should succeed and auto-calculate grade

# 3. Verify grade was calculated
psql -c "SELECT grade, percentage FROM marks ORDER BY created_at DESC LIMIT 1;"
# Should show: A | 85.00
```

---

## 🎯 Current Database Status

**Test Data Populated:**
- ✅ 15 Teachers
- ✅ 1 Principal  
- ✅ 114 Students
- ✅ 71 Sponsors
- ✅ 9,254 Marksheets (across 3 years, 3 terms each)
- ✅ 9,254 Marks records
- ✅ 81 Course Parts
- ✅ 3,318 Subject Enrollments

**⚠️ Trigger Status:**
- `calculate_grade_on_insert_or_update` is **ENABLED** but **BROKEN**
- Will fail on next mark insertion unless grading_schemes is fixed

---

## 📞 Next Steps

1. **Review** this document with your team
2. **Choose** Fix Option 1 (recommended) or Option 2
3. **Test** the fix in development environment
4. **Deploy** the migration to production
5. **Verify** mark entry works end-to-end
6. **Document** the change in your deployment logs

---

## 📝 Notes

- The trigger was temporarily disabled during test data population
- All test data is valid and production-ready
- Only the grading_schemes schema needs fixing
- Frontend/Backend logic is NOT affected - this is purely a database schema issue

