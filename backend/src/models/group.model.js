const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require(path.join(__dirname, '../config/db.config'));
const User = require(path.join(__dirname, './user.model'));

// 1. 그룹(StudyGroup) 모델 (<조건 1, 2, 3, 6>)
const StudyGroup = sequelize.define('StudyGroup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false,
    defaultValue: ''
  },
  // <조건 2> 가입 시 허락을 맡아야 하는 비공개 그룹(true)과 허락이 필요없는 공개 그룹(false)
  isPrivate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // <조건 3> 그룹 게시판 카테고리 목록
  boardCategories: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['공지사항', '자유게시판', '질문/답변', '자료실']
  }
}, {
  tableName: 'study_groups',
  timestamps: true
});

// 2. 그룹원 및 세분화 권한(GroupMember) 모델 (<조건 1, 2, 5, 7>)
const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StudyGroup,
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  // OWNER: 그룹 최고 관리자 / MANAGER: 부관리자 / MEMBER: 일반 그룹원
  role: {
    type: DataTypes.ENUM('OWNER', 'MANAGER', 'MEMBER'),
    allowNull: false,
    defaultValue: 'MEMBER'
  },
  // ACTIVE: 정식 그룹원 / PENDING: 비공개 그룹 가입 승인 대기
  status: {
    type: DataTypes.ENUM('ACTIVE', 'PENDING'),
    allowNull: false,
    defaultValue: 'ACTIVE'
  },
  // <조건 5> 게시글 보기 권한, 게시글 쓰기 권한, 권한 임명 권한
  canRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  canWrite: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  canManageRoles: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'group_members',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['groupId', 'userId']
    }
  ]
});

// 3. 그룹 게시판 게시글(GroupPost) 모델 (<조건 3, 4>)
const GroupPost = sequelize.define('GroupPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StudyGroup,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  category: {
    type: DataTypes.STRING(60),
    allowNull: false,
    defaultValue: '자유게시판'
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  content: {
    type: DataTypes.STRING(2000),
    allowNull: false
  }
}, {
  tableName: 'group_posts',
  timestamps: true
});

StudyGroup.hasMany(GroupMember, { foreignKey: 'groupId', as: 'members' });
GroupMember.belongsTo(StudyGroup, { foreignKey: 'groupId', as: 'group' });
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

StudyGroup.hasMany(GroupPost, { foreignKey: 'groupId', as: 'posts' });
GroupPost.belongsTo(StudyGroup, { foreignKey: 'groupId', as: 'group' });
GroupPost.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

module.exports = {
  StudyGroup,
  GroupMember,
  GroupPost
};