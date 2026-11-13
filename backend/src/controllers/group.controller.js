const path = require('path');
const { Op } = require('sequelize');
const User = require(path.join(__dirname, '../models/user.model'));
const { StudyGroup, GroupMember, GroupPost } = require(path.join(__dirname, '../models/group.model'));

// <조건 6> 그룹의 활성 인원(ACTIVE)이 0명일 때 해당 그룹을 자동으로 삭제하는 헬퍼 함수
const checkAndAutoDeleteEmptyGroup = async (groupId) => {
  const activeCount = await GroupMember.count({
    where: { groupId, status: 'ACTIVE' }
  });

  if (activeCount === 0) {
    await GroupPost.destroy({ where: { groupId } });
    await GroupMember.destroy({ where: { groupId } });
    await StudyGroup.destroy({ where: { id: groupId } });
    return true;
  }

  // 만약 기존 최고 관리자(OWNER)가 나갔고 남은 그룹원이 있다면 가장 먼저 가입한 사람에게 최고 관리자 승계
  const group = await StudyGroup.findByPk(groupId);
  if (group) {
    const ownerMember = await GroupMember.findOne({
      where: { groupId, role: 'OWNER', status: 'ACTIVE' }
    });
    if (!ownerMember) {
      const nextOwner = await GroupMember.findOne({
        where: { groupId, status: 'ACTIVE' },
        order: [['createdAt', 'ASC']]
      });
      if (nextOwner) {
        nextOwner.role = 'OWNER';
        nextOwner.canRead = true;
        nextOwner.canWrite = true;
        nextOwner.canManageRoles = true;
        await nextOwner.save();
        group.ownerId = nextOwner.userId;
        await group.save();
      }
    }
  }
  return false;
};

// 1. 전체 그룹 목록 및 내 가입/권한 현황 조회
exports.getGroupsOverview = async (req, res) => {
  try {
    const groups = await StudyGroup.findAll({
      include: [
        {
          model: GroupMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'department', 'studentId', 'name', 'statusMessage']
            }
          ]
        },
        {
          model: GroupPost,
          as: 'posts',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'department', 'studentId', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      groups
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '그룹 목록을 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 2. 그룹 생성 (<조건 1, 2, 3> 생성한 유저가 최고 관리자가 되며 모든 권한 보유)
exports.createGroup = async (req, res) => {
  try {
    const { name, description, isPrivate, boardCategories } = req.body;
    if (!name || String(name).trim() === '') {
      return res.status(400).json({
        success: false,
        message: '그룹 이름을 입력해 주세요.'
      });
    }

    const defaultCats =
      Array.isArray(boardCategories) && boardCategories.length > 0
        ? boardCategories
        : ['공지사항', '자유게시판', '질문/답변', '자료실'];

    const group = await StudyGroup.create({
      name: String(name).trim(),
      description: String(description || '').trim(),
      isPrivate: Boolean(isPrivate),
      ownerId: req.user.id,
      boardCategories: defaultCats
    });

    await GroupMember.create({
      groupId: group.id,
      userId: req.user.id,
      role: 'OWNER',
      status: 'ACTIVE',
      canRead: true,
      canWrite: true,
      canManageRoles: true
    });

    return res.status(201).json({
      success: true,
      message: `'${group.name}' 그룹이 생성되었으며 최고 관리자(OWNER)로 지정되었습니다.`,
      group
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '그룹 생성 중 오류가 발생했습니다.'
    });
  }
};

// 3. 그룹 가입 신청 (<조건 2> 공개 그룹은 즉시 가입, 비공개 그룹은 승인 대기)
exports.joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await StudyGroup.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '존재하지 않는 그룹입니다.'
      });
    }

    const existing = await GroupMember.findOne({
      where: { groupId, userId: req.user.id }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          existing.status === 'ACTIVE'
            ? '이미 가입된 그룹입니다.'
            : '이미 가입 승인을 대기 중입니다.'
      });
    }

    const status = group.isPrivate ? 'PENDING' : 'ACTIVE';
    const member = await GroupMember.create({
      groupId: group.id,
      userId: req.user.id,
      role: 'MEMBER',
      status,
      canRead: true,
      canWrite: true,
      canManageRoles: false
    });

    return res.status(201).json({
      success: true,
      message: group.isPrivate
        ? '비공개 그룹 가입 신청이 접수되었습니다. 그룹 관리자의 승인 후 활동할 수 있습니다.'
        : `'${group.name}' 공개 그룹에 즉시 가입되었습니다!`,
      member
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '그룹 가입 처리 중 오류가 발생했습니다.'
    });
  }
};

// 4. 비공개 그룹 가입 승인/거절 및 그룹원 추방/탈퇴 (<조건 1, 2, 6>)
exports.manageMemberStatus = async (req, res) => {
  try {
    const { groupId, targetUserId } = req.params;
    const { action } = req.body; // 'APPROVE' | 'REJECT' | 'REMOVE_OR_LEAVE'

    const group = await StudyGroup.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '그룹을 찾을 수 없습니다.'
      });
    }

    const myMember = await GroupMember.findOne({
      where: { groupId, userId: req.user.id, status: 'ACTIVE' }
    });

    const isSelfLeave = Number(targetUserId) === Number(req.user.id);
    const isAdminOrManager =
      req.user.role === 'ADMIN' ||
      (myMember && (myMember.role === 'OWNER' || myMember.canManageRoles));

    if (!isSelfLeave && !isAdminOrManager) {
      return res.status(403).json({
        success: false,
        message: '그룹원 관리 권한이 없습니다.'
      });
    }

    const targetMember = await GroupMember.findOne({
      where: { groupId, userId: targetUserId }
    });

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: '대상 그룹원 정보를 찾을 수 없습니다.'
      });
    }

    if (action === 'APPROVE') {
      targetMember.status = 'ACTIVE';
      await targetMember.save();
      return res.status(200).json({
        success: true,
        message: '그룹 가입을 승인했습니다.',
        member: targetMember
      });
    }

    // 거절, 강제 퇴장, 또는 자진 탈퇴
    await targetMember.destroy();

    // <조건 6> 그룹 인원이 0명이 되었는지 검사하여 0명이면 그룹 자동 삭제
    const wasGroupDeleted = await checkAndAutoDeleteEmptyGroup(groupId);

    return res.status(200).json({
      success: true,
      groupAutoDeleted: wasGroupDeleted,
      message: wasGroupDeleted
        ? '그룹의 남은 인원이 0명이 되어 그룹이 자동으로 삭제되었습니다.'
        : isSelfLeave
        ? '그룹에서 탈퇴했습니다.'
        : '해당 그룹원을 제외 처리했습니다.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '그룹원 상태 변경 중 오류가 발생했습니다.'
    });
  }
};

// 5. 그룹원 세부 권한 임명 (<조건 5> 게시글 쓰기 권한, 보기 권한, 권한 임명 권한 다루기)
exports.updateMemberPermissions = async (req, res) => {
  try {
    const { groupId, targetUserId } = req.params;
    const { role, canRead, canWrite, canManageRoles } = req.body;

    const group = await StudyGroup.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: '그룹을 찾을 수 없습니다.' });
    }

    const myMember = await GroupMember.findOne({
      where: { groupId, userId: req.user.id, status: 'ACTIVE' }
    });

    const hasRolePower =
      req.user.role === 'ADMIN' ||
      (myMember && (myMember.role === 'OWNER' || myMember.canManageRoles));

    if (!hasRolePower) {
      return res.status(403).json({
        success: false,
        message: '권한 임명 권한이 있는 관리자만 그룹원의 권한을 수정할 수 있습니다.'
      });
    }

    const targetMember = await GroupMember.findOne({
      where: { groupId, userId: targetUserId, status: 'ACTIVE' }
    });

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: '대상 그룹원을 찾을 수 없습니다.'
      });
    }

    // 최고 관리자(OWNER)의 권한은 다른 부관리자가 임의로 박탈할 수 없음
    if (targetMember.role === 'OWNER' && myMember?.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '그룹 최고 관리자의 권한은 변경할 수 없습니다.'
      });
    }

    if (role && ['OWNER', 'MANAGER', 'MEMBER'].includes(role)) {
      if (role === 'OWNER' && (myMember?.role === 'OWNER' || req.user.role === 'ADMIN')) {
        // 최고 관리자 위임 시 기존 OWNER는 MANAGER로 전환
        if (myMember && myMember.role === 'OWNER') {
          myMember.role = 'MANAGER';
          await myMember.save();
        }
        group.ownerId = targetMember.userId;
        await group.save();
        targetMember.role = 'OWNER';
        targetMember.canRead = true;
        targetMember.canWrite = true;
        targetMember.canManageRoles = true;
      } else if (role !== 'OWNER') {
        targetMember.role = role;
      }
    }

    if (targetMember.role !== 'OWNER') {
      if (canRead !== undefined) targetMember.canRead = Boolean(canRead);
      if (canWrite !== undefined) targetMember.canWrite = Boolean(canWrite);
      if (canManageRoles !== undefined) targetMember.canManageRoles = Boolean(canManageRoles);
    }

    await targetMember.save();

    return res.status(200).json({
      success: true,
      message: '그룹원의 권한 설정이 저장되었습니다.',
      member: targetMember
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '권한 설정 중 오류가 발생했습니다.'
    });
  }
};

// 6. 그룹 게시판 카테고리 추가 (<조건 3>)
exports.addBoardCategory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { category } = req.body;

    const group = await StudyGroup.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: '그룹을 찾을 수 없습니다.' });
    }

    const trimmed = String(category || '').trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: '카테고리명을 입력해 주세요.' });
    }

    const list = Array.isArray(group.boardCategories) ? [...group.boardCategories] : [];
    if (!list.includes(trimmed)) {
      list.push(trimmed);
      group.boardCategories = list;
      await group.save();
    }

    return res.status(200).json({
      success: true,
      message: `'${trimmed}' 게시판 카테고리가 추가되었습니다.`,
      boardCategories: group.boardCategories
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '게시판 카테고리 추가 중 오류가 발생했습니다.'
    });
  }
};

// 7. 그룹 게시글 작성 (<조건 3, 5> 쓰기 권한 검증)
exports.createGroupPost = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { category, title, content } = req.body;

    const member = await GroupMember.findOne({
      where: { groupId, userId: req.user.id, status: 'ACTIVE' }
    });

    if (!member && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '그룹에 소속된 멤버만 게시글을 작성할 수 있습니다.'
      });
    }

    if (member && !member.canWrite && member.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '현재 그룹 내 게시글 쓰기 권한이 제한되어 있습니다.'
      });
    }

    if (!title || String(title).trim() === '' || !content || String(content).trim() === '') {
      return res.status(400).json({
        success: false,
        message: '게시글 제목과 내용을 모두 입력해 주세요.'
      });
    }

    const post = await GroupPost.create({
      groupId: Number(groupId),
      authorId: req.user.id,
      category: String(category || '자유게시판').trim(),
      title: String(title).trim(),
      content: String(content).trim()
    });

    return res.status(201).json({
      success: true,
      message: '그룹 게시글이 등록되었습니다.',
      post
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '게시글 작성 중 오류가 발생했습니다.'
    });
  }
};

// 8. 그룹 게시글 수정 및 삭제 (<조건 4> 그룹 최고 관리자(OWNER)는 모든 게시글 수정 및 삭제 가능)
exports.updateGroupPost = async (req, res) => {
  try {
    const { groupId, postId } = req.params;
    const { category, title, content } = req.body;

    const post = await GroupPost.findOne({ where: { id: postId, groupId } });
    if (!post) {
      return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
    }

    const member = await GroupMember.findOne({
      where: { groupId, userId: req.user.id, status: 'ACTIVE' }
    });

    const isGroupOwner = member && member.role === 'OWNER';
    const isAuthor = Number(post.authorId) === Number(req.user.id);
    const isSystemAdmin = req.user.role === 'ADMIN';

    if (!isGroupOwner && !isAuthor && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: '게시글 작성자 또는 그룹 최고 관리자만 수정할 수 있습니다.'
      });
    }

    if (category) post.category = String(category).trim();
    if (title) post.title = String(title).trim();
    if (content) post.content = String(content).trim();
    await post.save();

    return res.status(200).json({
      success: true,
      message: '게시글이 수정되었습니다.',
      post
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '게시글 수정 중 오류가 발생했습니다.'
    });
  }
};

exports.deleteGroupPost = async (req, res) => {
  try {
    const { groupId, postId } = req.params;

    const post = await GroupPost.findOne({ where: { id: postId, groupId } });
    if (!post) {
      return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
    }

    const member = await GroupMember.findOne({
      where: { groupId, userId: req.user.id, status: 'ACTIVE' }
    });

    const isGroupOwner = member && member.role === 'OWNER';
    const isAuthor = Number(post.authorId) === Number(req.user.id);
    const isSystemAdmin = req.user.role === 'ADMIN';

    if (!isGroupOwner && !isAuthor && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: '게시글 작성자 또는 그룹 최고 관리자만 삭제할 수 있습니다.'
      });
    }

    await post.destroy();

    return res.status(200).json({
      success: true,
      message: '게시글이 삭제되었습니다.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '게시글 삭제 중 오류가 발생했습니다.'
    });
  }
};