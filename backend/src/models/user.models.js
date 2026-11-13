const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: '컴퓨터공학과', // 조건 2: 기본값 컴퓨터공학과, 수정 가능
    validate: {
      notEmpty: { msg: '학과를 입력해 주세요.' }
    }
  },
  studentId: {
    type: DataTypes.STRING(50), // 조건 3: 8자리 제한 없이 다양한 학번 및 운영자 ID 수용
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

// 조건 3: 서버 기동 시 기본 운영자(ADMIN) 계정 1개 자동 생성
User.seedAdminAccount = async () => {
  try {
    const [admin, created] = await User.findOrCreate({
      where: { studentId: 'ADMIN' },
      defaults: {
        department: '컴퓨터공학과',
        studentId: 'ADMIN',
        name: '운영자',
        role: 'ADMIN',
        currentSemesterCredits: 0,
        totalCredits: 0,
        gpa: 4.5,
        preferredMainView: 'DASHBOARD'
      }
    });
    if (created) {
      console.log('✅ 기본 운영자 계정이 생성되었습니다: [학과: 컴퓨터공학과 / 학번: ADMIN / 이름: 운영자]');
    }
  } catch (error) {
    console.error('❌ 운영자 계정 시드 생성 중 오류 발생:', error.message);
  }
};

module.exports = User;