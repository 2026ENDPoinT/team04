const path = require('path');
const jwt = require('jsonwebtoken');
const User = require(path.join(__dirname, '../models/user.model'));

const JWT_SECRET = process.env.JWT_SECRET || 'seoultech-cse-secret-key-2026';

exports.validateAuthInput = (req, res, next) => {
  let { department, studentId, name } = req.body;

  if (!department || department.trim() === '') {
    req.body.department = '컴퓨터공학과';
  } else {
    req.body.department = department.trim();
  }

  if (!studentId || String(studentId).trim() === '') {
    return res.status(400).json({
      success: false,
      message: '학번을 입력해 주세요. (필수 입력 항목)'
    });
  }

  if (!name || String(name).trim() === '') {
    return res.status(400).json({
      success: false,
      message: '이름을 입력해 주세요. (필수 입력 항목)'
    });
  }

  req.body.studentId = String(studentId).trim();
  req.body.name = String(name).trim();
  next();
};

exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요하거나 인증 토큰이 만료되었습니다.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '존재하지 않는 사용자 계정입니다.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '유효하지 않거나 만료된 인증 토큰입니다. 다시 로그인해 주세요.'
    });
  }
};

exports.JWT_SECRET = JWT_SECRET;