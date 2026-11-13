const path = require('path');
const express = require('express');
const router = express.Router();
const friendController = require(path.join(__dirname, '../controllers/friend.controller'));
const { verifyToken } = require(path.join(__dirname, '../middlewares/auth.middleware'));

router.use(verifyToken);

router.get('/overview', friendController.getFriendOverview);
router.get('/search', friendController.searchUsersByDeptAndName);
router.post('/request', friendController.sendFriendRequest);
router.patch('/request/:id', friendController.respondFriendRequest);
router.get('/:friendId/timetable', friendController.getFriendTimetable);
router.post('/interactions', friendController.createInteraction);
router.patch('/interactions/:id', friendController.respondProposal);

module.exports = router;