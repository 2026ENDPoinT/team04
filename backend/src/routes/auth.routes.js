const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateAuthInput, verifyToken } = require('../middlewares/auth.middleware');

// POST /api/auth/register - 학과/학번/이름 회원가입
router.post('/register', validateAuthInput, authController.register);

// POST /api/auth/login - 학과/학번/이름 로그인 (자동 로그인 옵션 포함)
router.post('/login', validateAuthInput, authController.login);

// GET /api/auth/me - 자동 로그인 검증 및 서버 저장 프로필 불러오기
router.get('/me', verifyToken, authController.getMe);

// PATCH /api/auth/profile - 학과 변경 및 메인 화면(시간표/기능성 화면) 선호도 저장
router.patch('/profile', verifyToken, authController.updateProfile);

module.exports = router;