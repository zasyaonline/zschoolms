import User from './User.js';
import RefreshToken from './RefreshToken.js';
import AuditLog from './AuditLog.js';
import Student from './Student.js';
import Sponsor from './Sponsor.js';
import StudentSponsorMapping from './StudentSponsorMapping.js';
import Attendance from './Attendance.js';
import Subject from './Subject.js';
import Marksheet from './Marksheet.js';
import Mark from './Mark.js';
import ReportCard from './ReportCard.js';
import ReportCardAttachment from './ReportCardAttachment.js';
import ReportCardDistributionLog from './ReportCardDistributionLog.js';
import GradingScheme from './GradingScheme.js';
import School from './School.js';
import AcademicYear from './AcademicYear.js';
import AcademicYearEnrollment from './AcademicYearEnrollment.js';
import Teacher from './Teacher.js';
import Class from './Class.js';
import ClassSection from './ClassSection.js';
import ClassSubject from './ClassSubject.js';
import Notification from './Notification.js';
import BatchJob from './BatchJob.js';
import EmailQueue from './EmailQueue.js';
import SponsorPayment from './SponsorPayment.js';

/**
 * Define Model Associations
 * This file sets up all relationships between models
 */

// User <-> RefreshToken (One-to-Many)
User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User <-> AuditLog (One-to-Many)
User.hasMany(AuditLog, {
  foreignKey: 'user_id',
  as: 'auditLogs',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

AuditLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User <-> Student Associations
// A user can be a student
User.hasOne(Student, {
  foreignKey: 'user_id',
  as: 'studentProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Student.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// A user can be a parent to many students
User.hasMany(Student, {
  foreignKey: 'parent_id',
  as: 'children',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

Student.belongsTo(User, {
  foreignKey: 'parent_id',
  as: 'parent',
});

// A user can be a sponsor to many students
User.hasMany(Student, {
  foreignKey: 'sponsor_id',
  as: 'sponsoredStudents',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

Student.belongsTo(User, {
  foreignKey: 'sponsor_id',
  as: 'sponsor',
});

// Sponsor <-> User Associations
// Sponsor created by user
Sponsor.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
  onDelete: 'SET NULL',
});

User.hasMany(Sponsor, {
  foreignKey: 'created_by',
  as: 'createdSponsors',
});

// Student <-> Sponsor <-> StudentSponsorMapping (Many-to-Many)
// A student can have many sponsors through mappings
Student.belongsToMany(Sponsor, {
  through: StudentSponsorMapping,
  foreignKey: 'student_id',
  otherKey: 'sponsor_id',
  as: 'sponsors',
});

Sponsor.belongsToMany(Student, {
  through: StudentSponsorMapping,
  foreignKey: 'sponsor_id',
  otherKey: 'student_id',
  as: 'students',
});

// StudentSponsorMapping associations
StudentSponsorMapping.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student',
  onDelete: 'CASCADE',
});

StudentSponsorMapping.belongsTo(Sponsor, {
  foreignKey: 'sponsor_id',
  as: 'sponsor',
  onDelete: 'CASCADE',
});

StudentSponsorMapping.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
  onDelete: 'SET NULL',
});

Student.hasMany(StudentSponsorMapping, {
  foreignKey: 'student_id',
  as: 'sponsorMappings',
});

Sponsor.hasMany(StudentSponsorMapping, {
  foreignKey: 'sponsor_id',
  as: 'studentMappings',
});

// Attendance <-> Student Associations
Attendance.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student',
  onDelete: 'CASCADE',
});

Student.hasMany(Attendance, {
  foreignKey: 'student_id',
  as: 'attendanceRecords',
});

// Attendance <-> User Associations (marked by)
Attendance.belongsTo(User, {
  foreignKey: 'marked_by',
  as: 'marker',
  onDelete: 'RESTRICT',
});

User.hasMany(Attendance, {
  foreignKey: 'marked_by',
  as: 'markedAttendance',
});

// Subject <-> Mark Associations
Subject.hasMany(Mark, {
  foreignKey: 'subject_id',
  as: 'marks',
  onDelete: 'RESTRICT',
});

Mark.belongsTo(Subject, {
  foreignKey: 'subject_id',
  as: 'subject',
});

// Marksheet <-> Mark Associations
Marksheet.hasMany(Mark, {
  foreignKey: 'marksheet_id',
  as: 'marks',
  onDelete: 'CASCADE',
});

Mark.belongsTo(Marksheet, {
  foreignKey: 'marksheet_id',
  as: 'marksheet',
});

// Subject <-> Marksheet Associations
Subject.hasMany(Marksheet, {
  foreignKey: 'subject_id',
  as: 'marksheets',
  onDelete: 'RESTRICT',
});

Marksheet.belongsTo(Subject, {
  foreignKey: 'subject_id',
  as: 'subject',
});

// ReportCard <-> Student Associations
ReportCard.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student',
  onDelete: 'CASCADE',
});

Student.hasMany(ReportCard, {
  foreignKey: 'student_id',
  as: 'reportCards',
});

// ReportCard <-> User Associations (signed by)
ReportCard.belongsTo(User, {
  foreignKey: 'signed_by',
  as: 'signer',
  onDelete: 'SET NULL',
});

User.hasMany(ReportCard, {
  foreignKey: 'signed_by',
  as: 'signedReportCards',
});

// ReportCard <-> ReportCardAttachment Associations
ReportCard.hasMany(ReportCardAttachment, {
  foreignKey: 'report_card_id',
  as: 'attachments',
  onDelete: 'CASCADE',
});

ReportCardAttachment.belongsTo(ReportCard, {
  foreignKey: 'report_card_id',
  as: 'reportCard',
});

// ReportCardAttachment <-> User Associations (uploaded by)
ReportCardAttachment.belongsTo(User, {
  foreignKey: 'uploaded_by',
  as: 'uploader',
  onDelete: 'SET NULL',
});

User.hasMany(ReportCardAttachment, {
  foreignKey: 'uploaded_by',
  as: 'uploadedAttachments',
});

// ReportCard <-> ReportCardDistributionLog Associations
ReportCard.hasMany(ReportCardDistributionLog, {
  foreignKey: 'report_card_id',
  as: 'distributionLogs',
  onDelete: 'CASCADE',
});

ReportCardDistributionLog.belongsTo(ReportCard, {
  foreignKey: 'report_card_id',
  as: 'reportCard',
});

// ReportCardDistributionLog <-> User Associations (distributed by)
ReportCardDistributionLog.belongsTo(User, {
  foreignKey: 'distributed_by',
  as: 'distributor',
  onDelete: 'SET NULL',
});

User.hasMany(ReportCardDistributionLog, {
  foreignKey: 'distributed_by',
  as: 'distributedReports',
});

// AcademicYear associations
AcademicYear.hasMany(AcademicYearEnrollment, {
  foreignKey: 'academic_year_id',
  as: 'enrollments',
});

AcademicYearEnrollment.belongsTo(AcademicYear, {
  foreignKey: 'academic_year_id',
  as: 'academicYear',
});

AcademicYearEnrollment.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student',
});

Student.hasMany(AcademicYearEnrollment, {
  foreignKey: 'student_id',
  as: 'academicEnrollments',
});

AcademicYearEnrollment.belongsTo(School, {
  foreignKey: 'school_id',
  as: 'school',
});

// Teacher associations
Teacher.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
});

User.hasOne(Teacher, {
  foreignKey: 'user_id',
  as: 'teacherProfile',
});

Teacher.belongsTo(School, {
  foreignKey: 'school_id',
  as: 'school',
  onDelete: 'CASCADE',
});

School.hasMany(Teacher, {
  foreignKey: 'school_id',
  as: 'teachers',
});

Teacher.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

Teacher.belongsTo(User, {
  foreignKey: 'modified_by',
  as: 'modifier',
});

// Class associations
Class.hasMany(ClassSection, {
  foreignKey: 'class_id',
  as: 'sections',
  onDelete: 'CASCADE',
});

ClassSection.belongsTo(Class, {
  foreignKey: 'class_id',
  as: 'class',
});

Class.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

Class.belongsTo(User, {
  foreignKey: 'modified_by',
  as: 'modifier',
});

// ClassSection associations
ClassSection.belongsTo(AcademicYear, {
  foreignKey: 'academic_year_id',
  as: 'academicYear',
  onDelete: 'CASCADE',
});

AcademicYear.hasMany(ClassSection, {
  foreignKey: 'academic_year_id',
  as: 'classSections',
});

ClassSection.belongsTo(Teacher, {
  foreignKey: 'class_teacher_id',
  as: 'classTeacher',
  onDelete: 'SET NULL',
});

Teacher.hasMany(ClassSection, {
  foreignKey: 'class_teacher_id',
  as: 'classSections',
});

ClassSection.hasMany(ClassSubject, {
  foreignKey: 'class_section_id',
  as: 'classSubjects',
  onDelete: 'CASCADE',
});

ClassSubject.belongsTo(ClassSection, {
  foreignKey: 'class_section_id',
  as: 'classSection',
});

ClassSection.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

ClassSection.belongsTo(User, {
  foreignKey: 'modified_by',
  as: 'modifier',
});

// ClassSubject associations
ClassSubject.belongsTo(Subject, {
  foreignKey: 'subject_id',
  as: 'subject',
  onDelete: 'CASCADE',
});

Subject.hasMany(ClassSubject, {
  foreignKey: 'subject_id',
  as: 'classSubjects',
});

ClassSubject.belongsTo(School, {
  foreignKey: 'school_id',
  as: 'school',
  onDelete: 'CASCADE',
});

ClassSubject.belongsTo(AcademicYear, {
  foreignKey: 'academic_year_id',
  as: 'academicYear',
  onDelete: 'CASCADE',
});

ClassSubject.belongsTo(Teacher, {
  foreignKey: 'teacher_id',
  as: 'teacher',
  onDelete: 'CASCADE',
});

Teacher.hasMany(ClassSubject, {
  foreignKey: 'teacher_id',
  as: 'classSubjects',
});

ClassSubject.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

ClassSubject.belongsTo(User, {
  foreignKey: 'modified_by',
  as: 'modifier',
});

// Notification associations
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
});

User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications',
});

// BatchJob associations
BatchJob.belongsTo(User, {
  foreignKey: 'initiated_by',
  as: 'initiator',
});

BatchJob.belongsTo(ClassSection, {
  foreignKey: 'class_section_id',
  as: 'classSection',
});

BatchJob.belongsTo(AcademicYear, {
  foreignKey: 'academic_year_id',
  as: 'academicYear',
});

User.hasMany(BatchJob, {
  foreignKey: 'initiated_by',
  as: 'batchJobs',
});

// EmailQueue associations
EmailQueue.belongsTo(BatchJob, {
  foreignKey: 'batch_job_id',
  as: 'batchJob'
});

EmailQueue.belongsTo(Sponsor, {
  foreignKey: 'sponsor_id',
  as: 'sponsor'
});

EmailQueue.belongsTo(User, {
  foreignKey: 'initiated_by',
  as: 'initiator'
});

EmailQueue.belongsTo(AcademicYear, {
  foreignKey: 'academic_year_id',
  as: 'academicYear'
});

EmailQueue.belongsTo(ClassSection, {
  foreignKey: 'class_section_id',
  as: 'classSection'
});

BatchJob.hasMany(EmailQueue, {
  foreignKey: 'batch_job_id',
  as: 'emails'
});

// SponsorPayment associations
SponsorPayment.belongsTo(StudentSponsorMapping, {
  foreignKey: 'sponsorship_id',
  as: 'sponsorship',
});

SponsorPayment.belongsTo(Sponsor, {
  foreignKey: 'sponsor_id',
  as: 'sponsor',
});

SponsorPayment.belongsTo(User, {
  foreignKey: 'verified_by',
  as: 'verifier',
});

SponsorPayment.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

StudentSponsorMapping.hasMany(SponsorPayment, {
  foreignKey: 'sponsorship_id',
  as: 'payments',
});

Sponsor.hasMany(SponsorPayment, {
  foreignKey: 'sponsor_id',
  as: 'payments',
});

export { 
  User, 
  RefreshToken, 
  AuditLog, 
  Student, 
  Sponsor, 
  StudentSponsorMapping, 
  Attendance, 
  Subject, 
  Marksheet, 
  Mark,
  ReportCard,
  ReportCardAttachment,
  ReportCardDistributionLog,
  GradingScheme,
  School,
  AcademicYear,
  AcademicYearEnrollment,
  Teacher,
  Class,
  ClassSection,
  ClassSubject,
  Notification,
  BatchJob,
  EmailQueue,
  SponsorPayment
};
