const path = require('path');
const express = require('express');
const router = express.Router();
const graduationController = require(path.join(__dirname, '../controllers/graduation.controller'));
const { verifyToken } = require(path.join(__dirname, '../middlewares/auth.middleware'));

router.use(verifyToken);

router.get('/', graduationController.getGraduationOverview);
router.post('/', graduationController.saveGraduationProfile);

module.exports = router;