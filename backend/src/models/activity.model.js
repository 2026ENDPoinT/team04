const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require(path.join(__dirname, '../config/db.config'));
const User = require(path.join(__dirname, './user.model'));

const CustomActivity = sequelize.define('CustomActivity', {
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
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(60),
    allowNull: false,
    defaultValue: '동아리/스터디'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false,
    defaultValue: ''
  },
  link: {
    type: DataTypes.STRING(300),
    allowNull: false,
    defaultValue: ''
  },
  startDate: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '2026-03-02'
  },
  endDate: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '2026-06-21'
  },
  schedules: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: '#FFE699'
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'custom_activities',
  timestamps: true
});

User.hasMany(CustomActivity, { foreignKey: 'userId', as: 'activities' });
CustomActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = CustomActivity;