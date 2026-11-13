const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require(path.join(__dirname, '../config/db.config'));
const User = require(path.join(__dirname, './user.model'));

const GradePrediction = sequelize.define('GradePrediction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  courseName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3
  },
  // <조건 4> 수강 인원 기본값 50명, 사용자 설정 가능
  totalStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50
  },
  // <조건 2> 시험 점수, 출석 점수, 과제 점수 및 반영 비율(%)
  evaluationItems: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
    // 예: [{ category: 'EXAM', label: '중간고사', score: 85, maxScore: 100, weight: 35, mean: 72, stdDev: 12 }, ...]
  },
  // <조건 3> 성적 등급별 비율(%) 사용자 입력 (A+, A, B+, B, C+, C, D+, D, F 누적 또는 개별 비율)
  gradeCutoffs: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      'A+': 15,
      'A': 30,
      'B+': 50,
      'B': 70,
      'C+': 85,
      'C': 95,
      'D+': 98,
      'D': 100
    }
  },
  // 계산 결과 캐시 저장 (<조건 5, 6>)
  calculatedTotalScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  examOnlyTopPercentile: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  estimatedRank: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  predictedGrade: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'A'
  }
}, {
  tableName: 'grade_predictions',
  timestamps: true
});

User.hasMany(GradePrediction, { foreignKey: 'userId', as: 'predictions' });
GradePrediction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = GradePrediction;