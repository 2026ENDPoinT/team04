const path = require('path');
const { Op } = require('sequelize');
const User = require(path.join(__dirname, '../models/user.model'));
const Friendship = require(path.join(__dirname, '../models/friend.model'));
const CustomActivity = require(path.join(__dirname, '../models/activity.model'));
const UserFeedback = require(path.join(__dirname, '../models/feedback.model'));

const VALID_FEEDBACK_STATUSES = ['제출 완료', '검토 중', '검토 완료'];

const ensureAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: '운영자(ADMIN) 계정만 접근할 수 있는 기능입니다.'
    });
    return false;
  }
  return true;
};

exports.getAllUsersAndFriendships = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const users = await User.findAll({ order: [['id', 'ASC']] });
    const friendships = await Friendship.findAll({ order: [['id', 'ASC']] });
    const activities = await CustomActivity.findAll({ order: [['id', 'ASC']] });
    const feedbacks = await UserFeedback.findAll({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'department', 'studentId', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      users,
      friendships,
      activities,
      feedbacks
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '전체 유저, 친구 및 피드백 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

exports.forceDeleteUser = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { userId } = req.params;
    const target = await User.findByPk(userId);
    if (!target) {
      return res.status(404).json({ success: false, message: '대상 유저를 찾을 수 없습니다.' });
    }
    const name = target.name;
    await target.destroy();
    return res.status(200).json({
      success: true,
      message: `[ADMIN] ${name} 유저 계정을 강제 삭제했습니다.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '유저 강제 삭제 중 오류가 발생했습니다.'
    });
  }
};

exports.forceAddFriendship = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { userAId, userBId } = req.body;
    if (!userAId || !userBId || Number(userAId) === Number(userBId)) {
      return res.status(400).json({
        success: false,
        message: '서로 다른 두 명의 사용자를 선택해 주세요.'
      });
    }

    const existing = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requesterId: userAId, receiverId: userBId },
          { requesterId: userBId, receiverId: userAId }
        ]
      }
    });

    if (existing) {
      existing.status = 'ACCEPTED';
      await existing.save();
      return res.status(200).json({
        success: true,
        message: '[ADMIN] 두 사용자의 친구 관계를 강제 연결(ACCEPTED)했습니다.',
        friendship: existing
      });
    }

    const created = await Friendship.create({
      requesterId: userAId,
      receiverId: userBId,
      status: 'ACCEPTED'
    });

    return res.status(201).json({
      success: true,
      message: '[ADMIN] 두 사용자를 강제로 친구 추가했습니다.',
      friendship: created
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '친구 강제 추가 중 오류가 발생했습니다.'
    });
  }
};

exports.forceRemoveFriendship = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { friendshipId } = req.params;
    const rel = await Friendship.findByPk(friendshipId);
    if (!rel) {
      return res.status(404).json({
        success: false,
        message: '삭제할 친구 관계를 찾을 수 없습니다.'
      });
    }
    await rel.destroy();
    return res.status(200).json({
      success: true,
      message: '[ADMIN] 해당 친구 관계를 강제 해제했습니다.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '친구 강제 삭제 중 오류가 발생했습니다.'
    });
  }
};

// [통합] 피드백 목록 조회 (일반 유저: 본인 피드백 / ADMIN: 전체 피드백)
exports.getFeedbacks = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const whereClause = isAdmin ? {} : { userId: req.user.id };

    const feedbacks = await UserFeedback.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'department', 'studentId', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      feedbacks
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '피드백 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// [통합] 일반 유저 건의 사항 및 개선점 제출
exports.createFeedback = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || String(title).trim() === '') {
      return res.status(400).json({
        success: false,
        message: '건의 사항 제목을 입력해 주세요.'
      });
    }
    if (!content || String(content).trim() === '') {
      return res.status(400).json({
        success: false,
        message: '건의 사항이나 개선점 내용을 입력해 주세요.'
      });
    }

    const created = await UserFeedback.create({
      userId: req.user.id,
      title: String(title).trim(),
      content: String(content).trim(),
      status: '제출 완료',
      adminReply: '',
      repliedAt: null
    });

    return res.status(201).json({
      success: true,
      message: '피드백이 서버에 등록되었습니다. (현재 상태: 제출 완료)',
      feedback: created
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '피드백 제출 중 오류가 발생했습니다.'
    });
  }
};

// [통합] ADMIN 전용 피드백 현황 체크(제출 완료 / 검토 중 / 검토 완료) 및 답변 등록
exports.updateFeedbackByAdmin = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { feedbackId } = req.params;
    const { status, adminReply } = req.body;

    const item = await UserFeedback.findByPk(feedbackId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '해당 피드백을 찾을 수 없습니다.'
      });
    }

    if (status && VALID_FEEDBACK_STATUSES.includes(status)) {
      item.status = status;
    }

    if (adminReply !== undefined) {
      item.adminReply = String(adminReply).trim();
      item.repliedAt = new Date().toLocaleString('ko-KR');
    }

    await item.save();

    return res.status(200).json({
      success: true,
      message: '[ADMIN] 피드백 진행 현황 및 답변이 저장되었습니다.',
      feedback: item
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '피드백 상태 및 답변 업데이트 중 오류가 발생했습니다.'
    });
  }
};