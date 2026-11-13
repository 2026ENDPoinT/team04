const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require(path.join(__dirname, '../config/db.config'));
const User = require(path.join(__dirname, './user.model'));

const UserFeedback = sequelize.define('UserFeedback', {
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
    type: DataTypes.STRING(150),
    allowNull: false
  },
  content: {
    type: DataTypes.STRING(1000),
    allowNull: false
  },
  // <조건 3> 제출 완료, 검토 중, 검토 완료 3가지 상태
  status: {
    type: DataTypes.ENUM('제출 완료', '검토 중', '검토 완료'),
    allowNull: false,
    defaultValue: '제출 완료'
  },
  // <조건 4, 5> ADMIN 답변 및 답변 일시
  adminReply: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    defaultValue: ''
  },
  repliedAt: {
    type: DataTypes.STRING(40),
    allowNull: true
  }
}, {
  tableName: 'user_feedbacks',
  timestamps: true
});

User.hasMany(UserFeedback, { foreignKey: 'userId', as: 'feedbacks' });
UserFeedback.belongsTo(User, { foreignKey: 'userId', as: 'author' });

module.exports = UserFeedback;