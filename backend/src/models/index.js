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
  School
};
