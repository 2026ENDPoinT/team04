const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require(path.join(__dirname, '../config/db.config'));
const User = require(path.join(__dirname, './user.model'));

const Friendship = sequelize.define('Friendship', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requesterId: {
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
  status: {
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'PENDING'
  }
}, {
  tableName: 'friendships',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['requesterId', 'receiverId']
    }
  ]
});

module.exports = Friendship;