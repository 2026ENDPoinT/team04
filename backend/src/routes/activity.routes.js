const path = require('path');
const express = require('express');
const router = express.Router();
const activityController = require(path.join(__dirname, '../controllers/activity.controller'));
const { verifyToken } = require(path.join(__dirname, '../middlewares/auth.middleware'));

router.use(verifyToken);

router.get('/', activityController.getMyActivities);
router.post('/', activityController.saveActivity);
router.delete('/:id', activityController.deleteActivity);

module.exports = router;