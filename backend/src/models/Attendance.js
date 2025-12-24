import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Attendance = sequelize.define(
  'Attendance',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'student_id',
      references: {
        model: 'students',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    class: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    section: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
      allowNull: false,
      defaultValue: 'present',
      validate: {
        isIn: [['present', 'absent', 'late', 'excused']],
      },
    },
    markedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'marked_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    tableName: 'attendance',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['student_id', 'date'],
        name: 'attendance_student_date_unique',
      },
      {
        fields: ['student_id'],
      },
      {
        fields: ['date'],
      },
      {
        fields: ['class'],
      },
      {
        fields: ['section'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['marked_by'],
      },
      {
        fields: ['class', 'date'],
      },
      {
        fields: ['student_id', 'date'],
      },
    ],
  }
);

/**
 * Instance method to check if student was present
 */
Attendance.prototype.isPresent = function() {
  return this.status === 'present';
};

/**
 * Instance method to check if student was absent
 */
Attendance.prototype.isAbsent = function() {
  return this.status === 'absent';
};

/**
 * Class method to get attendance rate for a student
 */
Attendance.getStudentAttendanceRate = async function(studentId, startDate, endDate) {
  const records = await this.findAll({
    where: {
      studentId,
      date: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate],
      },
    },
  });

  if (records.length === 0) return 0;

  const presentCount = records.filter(r => r.status === 'present').length;
  return ((presentCount / records.length) * 100).toFixed(2);
};

/**
 * Class method to get class attendance for a date
 */
Attendance.getClassAttendance = async function(classValue, section, date) {
  const where = {
    class: classValue,
    date,
  };

  if (section) {
    where.section = section;
  }

  return await this.findAll({
    where,
    include: [
      {
        association: 'student',
        include: ['user'],
      },
      {
        association: 'marker',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });
};

export default Attendance;
