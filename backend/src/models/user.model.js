const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require(path.join(__dirname, '../config/db.config'));

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: '컴퓨터공학과',
    validate: {
      notEmpty: { msg: '학과를 입력해 주세요.' }
    }
  },
  studentId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: '학번을 입력해 주세요.' }
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: '이름을 입력해 주세요.' }
    }
  },
  role: {
    type: DataTypes.ENUM('STUDENT', 'ADMIN'),
    allowNull: false,
    defaultValue: 'STUDENT'
  },
  currentYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2026
  },
  currentSemester: {
    type: DataTypes.ENUM('1학기', '2학기', '여름계절학기', '겨울계절학기'),
    allowNull: false,
    defaultValue: '1학기'
  },
  currentSemesterCredits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  totalCredits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  gpa: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  preferredMainView: {
    type: DataTypes.ENUM('TIMETABLE', 'DASHBOARD'),
    allowNull: false,
    defaultValue: 'TIMETABLE'
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['studentId'] },
    { fields: ['department', 'name'] }
  ]
});

User.seedAdminAccount = async () => {
  try {
    const [admin, created] = await User.findOrCreate({
      where: { studentId: '26101232' },
      defaults: {
        department: '컴퓨터공학과',
        studentId: '26101232',
        name: '최준우',
        role: 'ADMIN',
        currentYear: 2026,
        currentSemester: '1학기',
        currentSemesterCredits: 0,
        totalCredits: 0,
        gpa: 0.0,
        preferredMainView: 'TIMETABLE'
      }
    });

    if (!created && (admin.name !== '최준우' || admin.role !== 'ADMIN')) {
      admin.name = '최준우';
      admin.department = '컴퓨터공학과';
      admin.role = 'ADMIN';
      await admin.save();
    }

    console.log('✅ 운영자 계정이 설정되었습니다: [학과: 컴퓨터공학과 / 학번: 26101232 / 이름: 최준우]');
  } catch (error) {
    console.error('❌ 운영자 계정 시드 생성 중 오류 발생:', error.message);
  }
};

module.exports = User;