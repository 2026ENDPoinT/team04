const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require(path.join(__dirname, '../config/db.config'));
const User = require(path.join(__dirname, './user.model'));

const FriendInteraction = sequelize.define('FriendInteraction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('MESSAGE', 'PROPOSAL'),
    allowNull: false,
    defaultValue: 'MESSAGE'
  },
  content: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  day: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  startTime: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  endTime: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('UNREAD', 'PENDING', 'ACCEPTED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'PENDING'
  }
}, {
  tableName: 'friend_interactions',
  timestamps: true
});

module.exports = FriendInteraction;