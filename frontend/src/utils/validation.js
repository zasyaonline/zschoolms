import * as Yup from 'yup';
import DOMPurify from 'dompurify';

// Sanitize input to prevent XSS attacks
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

// Common validation rules
const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// User validation schema
export const userValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: Yup.string()
    .required('Email is required')
    .matches(emailRegex, 'Invalid email format')
    .max(255, 'Email must not exceed 255 characters'),
  mobile: Yup.string()
    .required('Mobile number is required')
    .matches(phoneRegex, 'Invalid phone number format'),
  role: Yup.string()
    .required('Role is required')
    .oneOf(['Admin', 'Teacher', 'Student'], 'Invalid role'),
  status: Yup.boolean(),
});

// Student validation schema
export const studentValidationSchema = Yup.object().shape({
  fullName: Yup.string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  studentId: Yup.string()
    .required('Student ID is required')
    .matches(/^[A-Z0-9]+$/, 'Student ID must contain only uppercase letters and numbers')
    .min(3, 'Student ID must be at least 3 characters')
    .max(20, 'Student ID must not exceed 20 characters'),
  dateOfBirth: Yup.date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Student must be at least 3 years old', function(value) {
      if (!value) return false;
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      return age >= 3 && age <= 25;
    }),
  gradeClass: Yup.string()
    .required('Grade/Class is required')
    .max(50, 'Grade/Class must not exceed 50 characters'),
  guardianName: Yup.string()
    .required('Guardian name is required')
    .min(2, 'Guardian name must be at least 2 characters')
    .max(100, 'Guardian name must not exceed 100 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Guardian name can only contain letters and spaces'),
  address: Yup.string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must not exceed 500 characters'),
  contactDetails: Yup.string()
    .required('Contact details are required')
    .matches(phoneRegex, 'Invalid phone number format'),
  sponsor: Yup.string()
    .max(100, 'Sponsor name must not exceed 100 characters'),
});

// School validation schema
export const schoolValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required('School name is required')
    .min(3, 'School name must be at least 3 characters')
    .max(200, 'School name must not exceed 200 characters'),
  address: Yup.string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must not exceed 500 characters'),
  contactNumber: Yup.string()
    .required('Contact number is required')
    .matches(phoneRegex, 'Invalid phone number format'),
  email: Yup.string()
    .required('Email is required')
    .matches(emailRegex, 'Invalid email format')
    .max(255, 'Email must not exceed 255 characters'),
  principalName: Yup.string()
    .required('Principal name is required')
    .min(2, 'Principal name must be at least 2 characters')
    .max(100, 'Principal name must not exceed 100 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Principal name can only contain letters and spaces'),
  establishedYear: Yup.number()
    .required('Established year is required')
    .min(1800, 'Year must be after 1800')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
});

// Grading scheme validation
export const gradingSchemeValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Grading scheme name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),
  description: Yup.string()
    .max(500, 'Description must not exceed 500 characters'),
  status: Yup.string()
    .required('Status is required')
    .oneOf(['active', 'inactive'], 'Invalid status'),
});

// Grade validation (for individual grades in grading scheme)
export const gradeValidationSchema = Yup.object().shape({
  grade: Yup.string()
    .required('Grade is required')
    .max(5, 'Grade must not exceed 5 characters'),
  minScore: Yup.number()
    .required('Minimum score is required')
    .min(0, 'Minimum score cannot be negative')
    .max(100, 'Minimum score cannot exceed 100'),
  maxScore: Yup.number()
    .required('Maximum score is required')
    .min(0, 'Maximum score cannot be negative')
    .max(100, 'Maximum score cannot exceed 100')
    .test('max-greater-than-min', 'Maximum score must be greater than minimum score', function(value) {
      const { minScore } = this.parent;
      return value > minScore;
    }),
  gpa: Yup.number()
    .required('GPA is required')
    .min(0, 'GPA cannot be negative')
    .max(5, 'GPA cannot exceed 5'),
  description: Yup.string()
    .max(100, 'Description must not exceed 100 characters'),
});

// Marks entry validation
export const marksValidationSchema = Yup.object().shape({
  marks: Yup.number()
    .required('Marks are required')
    .min(0, 'Marks cannot be negative')
    .max(100, 'Marks cannot exceed 100'),
  subject: Yup.string()
    .required('Subject is required'),
  studentId: Yup.string()
    .required('Student ID is required'),
});

// Attendance validation
export const attendanceValidationSchema = Yup.object().shape({
  status: Yup.string()
    .required('Attendance status is required')
    .oneOf(['present', 'absent', 'late', 'excused'], 'Invalid attendance status'),
  date: Yup.date()
    .required('Date is required')
    .max(new Date(), 'Date cannot be in the future'),
  studentId: Yup.string()
    .required('Student ID is required'),
});

// Validate form data and return errors
export const validateForm = async (schema, data) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    const errors = {};
    if (error.inner) {
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
    }
    return { isValid: false, errors };
  }
};

// Validate single field
export const validateField = async (schema, fieldName, value) => {
  try {
    await schema.validateAt(fieldName, { [fieldName]: value });
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

// Sanitize all form data
export const sanitizeFormData = (formData) => {
  const sanitized = {};
  Object.keys(formData).forEach((key) => {
    sanitized[key] = sanitizeInput(formData[key]);
  });
  return sanitized;
};
