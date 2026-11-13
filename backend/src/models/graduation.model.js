const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require(path.join(__dirname, '../config/db.config'));
const User = require(path.join(__dirname, './user.model'));

// 사용자의 입학유형(재학생/편입생) 및 선택한 EPiC folio(이수 완료 / 이수 희망) 활동 저장 모델
const GraduationProfile = sequelize.define('GraduationProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  // 'REGULAR' (신입학 재학생) | 'TRANSFER' (편입생)
  admissionType: {
    type: DataTypes.ENUM('REGULAR', 'TRANSFER'),
    allowNull: false,
    defaultValue: 'REGULAR'
  },
  // 클릭으로 담은 EPiC folio 활동 목록 JSON
  // [{ activityCode, title, reqType: '필수 요건'|'선택 요건', points, scheduleDate, officialUrl, status: 'COMPLETED'|'WISH' }]
  selectedEpicItems: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  }
}, {
  tableName: 'graduation_profiles',
  timestamps: true
});

User.hasOne(GraduationProfile, { foreignKey: 'userId', as: 'graduationProfile' });
GraduationProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = GraduationProfile;