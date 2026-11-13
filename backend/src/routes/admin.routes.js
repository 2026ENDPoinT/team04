const path = require('path');
const express = require('express');
const router = express.Router();
const adminController = require(path.join(__dirname, '../controllers/admin.controller'));
const { verifyToken } = require(path.join(__dirname, '../middlewares/auth.middleware'));

router.use(verifyToken);

// ADMIN 유저 및 친구 강제 관리 엔드포인트
router.get('/overview', adminController.getAllUsersAndFriendships);
router.delete('/users/:userId', adminController.forceDeleteUser);
router.post('/friendships', adminController.forceAddFriendship);
router.delete('/friendships/:friendshipId', adminController.forceRemoveFriendship);

// 통합 피드백 제출·조회 및 ADMIN 현황 체크/답변 엔드포인트
router.get('/feedbacks', adminController.getFeedbacks);
router.post('/feedbacks', adminController.createFeedback);
router.patch('/feedbacks/:feedbackId', adminController.updateFeedbackByAdmin);
router.patch('/:feedbackId/admin', adminController.updateFeedbackByAdmin);

module.exports = router;