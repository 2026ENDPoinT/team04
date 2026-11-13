const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require(path.join(__dirname, '../config/db.config'));
const User = require(path.join(__dirname, './user.model'));

const Course = sequelize.define('Course', {
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
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1980,
      max: 2050
    }
  },
  semester: {
    type: DataTypes.ENUM('1학기', '2학기', '여름계절학기', '겨울계절학기'),
    allowNull: false
  },
  courseName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 4
    }
  },
  grade: {
    type: DataTypes.ENUM('현재 이수 중', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'),
    allowNull: false,
    defaultValue: '현재 이수 중'
  },
  gradePoint: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  schedules: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: '#A8FFDB'
  },
  isRetake: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isWithdrawn: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'courses',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'year', 'semester', 'courseName']
    }
  ]
});

User.hasMany(Course, { foreignKey: 'userId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Course;