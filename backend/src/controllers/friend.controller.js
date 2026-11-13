const path = require('path');
const { Op } = require('sequelize');
const User = require(path.join(__dirname, '../models/user.model'));
const Course = require(path.join(__dirname, '../models/course.model'));
const Friendship = require(path.join(__dirname, '../models/friend.model'));
const FriendInteraction = require(path.join(__dirname, '../models/interaction.model'));
const CustomActivity = require(path.join(__dirname, '../models/activity.model'));

// <조건 3> 학과와 이름이 같은 동명이인이 존재할 때만 학번의 맨앞 2자리와 맨뒤 3자리 공개
const maskStudentIdForDuplicate = (sid) => {
  const s = String(sid || '').trim();
  if (s.length <= 5) {
    return `${s.slice(0, 2)}*${s.slice(-2)}`;
  }
  const front2 = s.slice(0, 2);
  const back3 = s.slice(-3);
  const middleStars = '*'.repeat(Math.max(1, s.length - 5));
  return `${front2}${middleStars}${back3}`;
};

// 1. 학과와 이름으로 친구 후보 검색 (<조건 2, 3>)
exports.searchUsersByDeptAndName = async (req, res) => {
  try {
    const department = String(req.query.department || '컴퓨터공학과').trim();
    const name = String(req.query.name || '').trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '검색할 친구의 이름을 입력해 주세요.'
      });
    }

    const matchedUsers = await User.findAll({
      where: {
        department,
        name
      },
      attributes: ['id', 'department', 'name', 'studentId', 'statusMessage']
    });

    const isDuplicateNameAndDept = matchedUsers.length >= 2;

    const results = matchedUsers
      .filter((u) => u.id !== req.user.id)
      .map((u) => ({
        id: u.id,
        department: u.department,
        name: u.name,
        statusMessage: u.statusMessage || '',
        hasDuplicateSameName: isDuplicateNameAndDept,
        maskedStudentId: isDuplicateNameAndDept ? maskStudentIdForDuplicate(u.studentId) : null
      }));

    return res.status(200).json({
      success: true,
      hasDuplicateSameName: isDuplicateNameAndDept,
      candidates: results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '사용자 검색 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 2. 친구 신청 보내기 (<조건 1, 2>)
exports.sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { receiverId } = req.body;

    if (!receiverId || Number(receiverId) === Number(requesterId)) {
      return res.status(400).json({
        success: false,
        message: '본인에게는 친구 신청을 보낼 수 없습니다.'
      });
    }

    const targetUser = await User.findByPk(receiverId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '대상 사용자를 찾을 수 없습니다.'
      });
    }

    const existing = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId }
        ]
      }
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.status(409).json({
          success: false,
          message: '이미 친구로 등록된 학우입니다.'
        });
      }
      if (existing.status === 'PENDING') {
        return res.status(409).json({
          success: false,
          message: '이미 친구 신청이 진행 중입니다. 신청 내역을 확인해 주세요.'
        });
      }
      existing.requesterId = requesterId;
      existing.receiverId = receiverId;
      existing.status = 'PENDING';
      await existing.save();

      return res.status(200).json({
        success: true,
        message: `${targetUser.department} ${targetUser.name}님에게 친구 신청을 보냈습니다.`,
        friendship: existing
      });
    }

    const created = await Friendship.create({
      requesterId,
      receiverId,
      status: 'PENDING'
    });

    return res.status(201).json({
      success: true,
      message: `${targetUser.department} ${targetUser.name}님에게 친구 신청을 보냈습니다.`,
      friendship: created
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '친구 신청 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 3. 친구 신청 수락 또는 거절 (<조건 1>)
exports.respondFriendRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'ACCEPT' | 'REJECT'

    const friendship = await Friendship.findByPk(id);
    if (!friendship || Number(friendship.receiverId) !== Number(req.user.id)) {
      return res.status(404).json({
        success: false,
        message: '처리할 친구 신청 내역을 찾을 수 없습니다.'
      });
    }

    if (action === 'ACCEPT') {
      friendship.status = 'ACCEPTED';
      await friendship.save();
      return res.status(200).json({
        success: true,
        message: '친구 신청을 수락했습니다!',
        friendship
      });
    } else {
      friendship.status = 'REJECTED';
      await friendship.save();
      return res.status(200).json({
        success: true,
        message: '친구 신청을 거절했습니다.',
        friendship
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '친구 신청 응답 처리 중 오류가 발생했습니다.'
    });
  }
};

// 4. 친구 전체 현황 조회 (친구 목록, 받은/보낸 친구 신청, 메시지 및 활동 제안 내역)
exports.getFriendOverview = async (req, res) => {
  try {
    const myId = req.user.id;
    const allUsers = await User.findAll({
      attributes: [
        'id',
        'department',
        'name',
        'studentId',
        'statusMessage',
        'currentYear',
        'currentSemester'
      ]
    });

    // 학과+이름 중복 계산 맵
    const dupCountMap = {};
    allUsers.forEach((u) => {
      const key = `${u.department}__${u.name}`;
      dupCountMap[key] = (dupCountMap[key] || 0) + 1;
    });

    const userMap = {};
    allUsers.forEach((u) => {
      const isDup = dupCountMap[`${u.department}__${u.name}`] >= 2;
      userMap[u.id] = {
        id: u.id,
        department: u.department,
        name: u.name,
        statusMessage: u.statusMessage || '',
        currentYear: u.currentYear,
        currentSemester: u.currentSemester,
        hasDuplicateSameName: isDup,
        maskedStudentId: isDup ? maskStudentIdForDuplicate(u.studentId) : null
      };
    });

    const relations = await Friendship.findAll({
      where: {
        [Op.or]: [{ requesterId: myId }, { receiverId: myId }]
      },
      order: [['updatedAt', 'DESC']]
    });

    const friends = [];
    const incomingRequests = [];
    const outgoingRequests = [];

    relations.forEach((rel) => {
      if (rel.status === 'ACCEPTED') {
        const friendId =
          Number(rel.requesterId) === Number(myId) ? rel.receiverId : rel.requesterId;
        if (userMap[friendId]) {
          friends.push({
            friendshipId: rel.id,
            ...userMap[friendId]
          });
        }
      } else if (rel.status === 'PENDING') {
        if (Number(rel.receiverId) === Number(myId) && userMap[rel.requesterId]) {
          incomingRequests.push({
            friendshipId: rel.id,
            requester: userMap[rel.requesterId],
            createdAt: rel.createdAt
          });
        } else if (Number(rel.requesterId) === Number(myId) && userMap[rel.receiverId]) {
          outgoingRequests.push({
            friendshipId: rel.id,
            receiver: userMap[rel.receiverId],
            createdAt: rel.createdAt
          });
        }
      }
    });

    const interactions = await FriendInteraction.findAll({
      where: {
        [Op.or]: [{ senderId: myId }, { receiverId: myId }]
      },
      order: [['createdAt', 'DESC']]
    });

    const formattedInteractions = interactions.map((item) => ({
      id: item.id,
      senderId: item.senderId,
      receiverId: item.receiverId,
      sender: userMap[item.senderId] || null,
      receiver: userMap[item.receiverId] || null,
      type: item.type,
      content: item.content,
      day: item.day,
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status,
      createdAt: item.createdAt
    }));

    return res.status(200).json({
      success: true,
      friends,
      incomingRequests,
      outgoingRequests,
// 5. 친구 시간표 전용 조회 (<조건 5> 성적·학점·GPA 철저히 마스킹 + <기타활동 조건 7> 비공개 활동은 친구에게 숨김, 단 ADMIN은 열람 가능)
exports.getFriendTimetable = async (req, res) => {
  try {
    const myId = req.user.id;
    const isAdminViewer = req.user.role === 'ADMIN';
    const friendId = Number(req.params.friendId);

    if (!isAdminViewer) {
      const isFriend = await Friendship.findOne({
        where: {
          status: 'ACCEPTED',
          [Op.or]: [
            { requesterId: myId, receiverId: friendId },
            { requesterId: friendId, receiverId: myId }
          ]
        }
      });

      if (!isFriend) {
        return res.status(403).json({
          success: false,
          message: '서로 친구로 등록된 경우에만 시간표를 확인할 수 있습니다.'
        });
      }
    }

    const friendUser = await User.findByPk(friendId, {
      attributes: ['id', 'department', 'name', 'statusMessage', 'currentYear', 'currentSemester']
    });

    if (!friendUser) {
      return res.status(404).json({
        success: false,
        message: '친구 계정을 찾을 수 없습니다.'
      });
    }

    const rawCourses = await Course.findAll({
      where: {
        userId: friendId,
        year: friendUser.currentYear,
        semester: friendUser.currentSemester,
        isWithdrawn: false
      },
      attributes: ['id', 'courseName', 'schedules', 'color', 'year', 'semester']
    });

    const activityWhere = isAdminViewer
      ? { userId: friendId }
      : { userId: friendId, isPrivate: false };

    const friendActivities = await CustomActivity.findAll({
      where: activityWhere
    });

    return res.status(200).json({
      success: true,
      friend: friendUser,
      timetableCourses: rawCourses,
      timetableActivities: friendActivities
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '친구의 시간표를 불러오는 중 오류가 발생했습니다.'
    });
  }
};

// 6. 친구에게 메시지 전달 또는 타임테이블 클릭 시간별 활동 제안 (<조건 6>)
exports.createInteraction = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, type, content, day, startTime, endTime } = req.body;

    if (!receiverId || !content || String(content).trim() === '') {
      return res.status(400).json({
        success: false,
        message: '전달할 메시지 또는 활동 내용을 입력해 주세요.'
      });
    }

    const isFriend = await Friendship.findOne({
      where: {
        status: 'ACCEPTED',
        [Op.or]: [
          { requesterId: senderId, receiverId },
          { requesterId: receiverId, receiverId: senderId }
        ]
      }
    });

    if (!isFriend) {
      return res.status(403).json({
        success: false,
        message: '친구에게만 메시지나 활동 제안을 보낼 수 있습니다.'
      });
    }

    const interactionType = type === 'PROPOSAL' ? 'PROPOSAL' : 'MESSAGE';

    const created = await FriendInteraction.create({
      senderId,
      receiverId,
      type: interactionType,
      content: String(content).trim(),
      day: interactionType === 'PROPOSAL' ? day : null,
      startTime: interactionType === 'PROPOSAL' ? startTime : null,
      endTime: interactionType === 'PROPOSAL' ? endTime : null,
      status: interactionType === 'PROPOSAL' ? 'PENDING' : 'UNREAD'
    });

    return res.status(201).json({
      success: true,
      message:
        interactionType === 'PROPOSAL'
          ? `${day}요일 ${startTime}~${endTime} 활동 제안을 보냈습니다!`
          : '친구에게 메시지를 전달했습니다!',
      interaction: created
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '메시지/활동 제안 전송 중 오류가 발생했습니다.'
    });
  }
};

// 7. 친구가 제안한 활동 수락 혹은 거절 (<조건 7>)
exports.respondProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACCEPTED' | 'REJECTED'

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 응답 상태입니다.'
      });
    }

    const proposal = await FriendInteraction.findByPk(id);
    if (!proposal || Number(proposal.receiverId) !== Number(req.user.id)) {
      return res.status(404).json({
        success: false,
        message: '응답할 활동 제안을 찾을 수 없습니다.'
      });
    }

    proposal.status = status;
    await proposal.save();

    return res.status(200).json({
      success: true,
      message:
        status === 'ACCEPTED'
          ? '친구의 활동 제안을 수락했습니다!'
          : '친구의 활동 제안을 거절했습니다.',
      interaction: proposal
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '활동 제안 응답 중 오류가 발생했습니다.'
    });
  }
};