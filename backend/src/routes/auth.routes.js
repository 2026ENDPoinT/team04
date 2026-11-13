const path = require('path');
const express = require('express');
const router = express.Router();
const authController = require(path.join(__dirname, '../controllers/auth.controller'));
const { validateAuthInput, verifyToken } = require(path.join(__dirname, '../middlewares/auth.middleware'));

router.post('/register', validateAuthInput, authController.register);
router.post('/login', validateAuthInput, authController.login);
router.get('/me', verifyToken, authController.getMe);
router.patch('/profile', verifyToken, authController.updateProfile);
router.delete('/account', verifyToken, authController.deleteAccount);

module.exports = router;