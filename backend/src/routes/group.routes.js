const path = require('path');
const express = require('express');
const router = express.Router();
const groupController = require(path.join(__dirname, '../controllers/group.controller'));
const { verifyToken } = require(path.join(__dirname, '../middlewares/auth.middleware'));

router.use(verifyToken);

router.get('/', groupController.getGroupsOverview);
router.post('/', groupController.createGroup);
router.post('/:groupId/join', groupController.joinGroup);
router.patch('/:groupId/members/:targetUserId/status', groupController.manageMemberStatus);
router.patch('/:groupId/members/:targetUserId/permissions', groupController.updateMemberPermissions);
router.post('/:groupId/categories', groupController.addBoardCategory);
router.post('/:groupId/posts', groupController.createGroupPost);
router.put('/:groupId/posts/:postId', groupController.updateGroupPost);
router.delete('/:groupId/posts/:postId', groupController.deleteGroupPost);

module.exports = router;