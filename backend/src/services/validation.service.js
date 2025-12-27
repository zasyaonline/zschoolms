import { Op } from 'sequelize';
import { 
  Marksheet, 
  Mark, 
  Student, 
  Attendance, 
  ClassSection, 
  Subject,
  AcademicYear,
  ReportCard,
  Class
} from '../models/index.js';
import sequelize from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Validation Service
 * Validates data completeness before report card generation
 */

/**
 * Validate all data is ready for report card generation for a class
 * @param {string} classSectionId - Class Section UUID
 * @param {string} academicYearId - Academic Year UUID
 * @returns {Promise<Object>} Validation result with details
 */
export const validateClassForReportCards = async (classSectionId, academicYearId) => {
  const validation = {
    isValid: true,
    classSectionId,
    academicYearId,
    students: {
      total: 0,
      validated: 0,
      issues: []
    },
    marks: {
      allSubjectsApproved: true,
      subjects: [],
      issues: []
    },
    attendance: {
      complete: true,
      issues: []
    },
    comments: {
      complete: true,
      issues: []
    },
    summary: []
  };

  try {
    // Get class section info
    const classSection = await ClassSection.findByPk(classSectionId, {
      include: [{ model: Class, as: 'class' }]
    });

    if (!classSection) {
      validation.isValid = false;
      validation.summary.push('Class section not found');
      return validation;
    }

    // Get all enrolled students
    const enrolledStudents = await sequelize.query(
      `SELECT DISTINCT aye.student_id, s.first_name, s.last_name, s.student_id as admission_number
       FROM academic_year_enrollments aye
       JOIN students s ON aye.student_id = s.id
       WHERE aye.class_section_id = :classSectionId 
       AND aye.academic_year_id = :academicYearId`,
      {
        replacements: { classSectionId, academicYearId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    validation.students.total = enrolledStudents.length;

    if (enrolledStudents.length === 0) {
      validation.isValid = false;
      validation.summary.push('No students enrolled in this class for the academic year');
      return validation;
    }

    // Get all subjects for this class
    const classSubjects = await sequelize.query(
      `SELECT cs.subject_id, s.name as subject_name, s.code as subject_code
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id
       WHERE cs.class_section_id = :classSectionId
       AND cs.academic_year_id = :academicYearId`,
      {
        replacements: { classSectionId, academicYearId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (classSubjects.length === 0) {
      validation.isValid = false;
      validation.summary.push('No subjects assigned to this class');
      return validation;
    }

    // Check marksheets for each subject
    for (const subject of classSubjects) {
      const marksheet = await Marksheet.findOne({
        where: {
          classSectionId,
          subjectId: subject.subject_id,
          academicYearId,
          status: 'approved'
        }
      });

      const subjectStatus = {
        subjectId: subject.subject_id,
        name: subject.subject_name,
        code: subject.subject_code,
        approved: !!marksheet,
        marksheetId: marksheet?.id
      };

      validation.marks.subjects.push(subjectStatus);

      if (!marksheet) {
        validation.marks.allSubjectsApproved = false;
        validation.marks.issues.push(`Subject "${subject.subject_name}" does not have an approved marksheet`);
      }
    }

    if (!validation.marks.allSubjectsApproved) {
      validation.isValid = false;
      validation.summary.push(`${validation.marks.issues.length} subject(s) missing approved marksheets`);
    }

    // Check marks for each student
    const studentIds = enrolledStudents.map(s => s.student_id);
    
    for (const student of enrolledStudents) {
      let hasIssue = false;
      const studentIssues = [];

      // Check if student has marks in all approved subjects
      for (const subject of validation.marks.subjects.filter(s => s.approved)) {
        const mark = await Mark.findOne({
          where: {
            marksheetId: subject.marksheetId,
            studentId: student.student_id
          }
        });

        if (!mark) {
          hasIssue = true;
          studentIssues.push(`Missing marks for ${subject.name}`);
        }
      }

      if (hasIssue) {
        validation.students.issues.push({
          studentId: student.student_id,
          name: `${student.first_name} ${student.last_name}`,
          admissionNumber: student.admission_number,
          issues: studentIssues
        });
      } else {
        validation.students.validated++;
      }
    }

    if (validation.students.validated < validation.students.total) {
      validation.isValid = false;
      validation.summary.push(`${validation.students.total - validation.students.validated} student(s) have incomplete marks data`);
    }

    // Check attendance records (optional but logged)
    const attendanceCheck = await Attendance.count({
      where: {
        studentId: { [Op.in]: studentIds },
        academicYearId
      }
    });

    if (attendanceCheck === 0) {
      validation.attendance.complete = false;
      validation.attendance.issues.push('No attendance records found for this class');
      validation.summary.push('Warning: No attendance records available');
      // Attendance is optional, doesn't invalidate
    }

    // Check for existing report cards
    const existingReportCards = await ReportCard.count({
      where: {
        studentId: { [Op.in]: studentIds },
        academicYearId,
        status: { [Op.in]: ['Signed', 'Distributed'] }
      }
    });

    if (existingReportCards > 0) {
      validation.summary.push(`Note: ${existingReportCards} students already have signed/distributed report cards`);
    }

    logger.info(`Validation complete for class ${classSectionId}: ${validation.isValid ? 'PASSED' : 'FAILED'}`);

    return validation;

  } catch (error) {
    logger.error('Error in class validation:', error);
    validation.isValid = false;
    validation.summary.push(`Validation error: ${error.message}`);
    return validation;
  }
};

/**
 * Quick validation check (boolean only)
 * @param {string} classSectionId - Class Section UUID
 * @param {string} academicYearId - Academic Year UUID
 * @returns {Promise<boolean>}
 */
export const isClassReadyForGeneration = async (classSectionId, academicYearId) => {
  const validation = await validateClassForReportCards(classSectionId, academicYearId);
  return validation.isValid;
};

/**
 * Validate a single student's data for report card
 * @param {string} studentId - Student UUID
 * @param {string} academicYearId - Academic Year UUID
 * @returns {Promise<Object>}
 */
export const validateStudentForReportCard = async (studentId, academicYearId) => {
  const validation = {
    isValid: true,
    studentId,
    academicYearId,
    data: {
      personalInfo: false,
      enrolledInClass: false,
      hasApprovedMarks: false,
      hasAttendance: false,
      subjectCount: 0,
      marksCount: 0
    },
    issues: []
  };

  try {
    // Check student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      validation.isValid = false;
      validation.issues.push('Student not found');
      return validation;
    }
    validation.data.personalInfo = true;

    // Check enrollment
    const enrollment = await sequelize.query(
      `SELECT class_section_id FROM academic_year_enrollments 
       WHERE student_id = :studentId AND academic_year_id = :academicYearId`,
      {
        replacements: { studentId, academicYearId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (enrollment.length === 0) {
      validation.isValid = false;
      validation.issues.push('Student not enrolled in any class for this academic year');
      return validation;
    }
    validation.data.enrolledInClass = true;

    // Get approved marksheets for student's class
    const classSectionId = enrollment[0].class_section_id;
    const approvedMarksheets = await Marksheet.findAll({
      where: {
        classSectionId,
        academicYearId,
        status: 'approved'
      },
      attributes: ['id', 'subjectId']
    });

    validation.data.subjectCount = approvedMarksheets.length;

    if (approvedMarksheets.length === 0) {
      validation.isValid = false;
      validation.issues.push('No approved marksheets for this class');
      return validation;
    }

    // Check marks for each approved subject
    let marksCount = 0;
    for (const marksheet of approvedMarksheets) {
      const mark = await Mark.findOne({
        where: { marksheetId: marksheet.id, studentId }
      });
      if (mark) marksCount++;
    }

    validation.data.marksCount = marksCount;
    validation.data.hasApprovedMarks = marksCount > 0;

    if (marksCount < approvedMarksheets.length) {
      validation.isValid = false;
      validation.issues.push(`Missing marks in ${approvedMarksheets.length - marksCount} subjects`);
    }

    // Check attendance
    const attendanceCount = await Attendance.count({
      where: { studentId, academicYearId }
    });
    validation.data.hasAttendance = attendanceCount > 0;

    if (attendanceCount === 0) {
      validation.issues.push('No attendance records (optional)');
    }

    return validation;

  } catch (error) {
    logger.error('Error in student validation:', error);
    validation.isValid = false;
    validation.issues.push(`Validation error: ${error.message}`);
    return validation;
  }
};

export default {
  validateClassForReportCards,
  isClassReadyForGeneration,
  validateStudentForReportCard
};
