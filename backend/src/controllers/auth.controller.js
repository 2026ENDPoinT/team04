const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

// 토큰 발급 헬퍼 함수 (자동 로그인 선택 시 30일, 미선택 시 12시간 유지)
const generateToken = (user, autoLogin = false) => {
  return jwt.sign(
    {
      id: user.id,
      studentId: user.studentId,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: autoLogin ? '30d' : '12h' }
  );
};

// 1. 회원가입 (학과/학번/이름)
exports.register = async (req, res) => {
  try {
    const { department, studentId, name, autoLogin } = req.body;

    // 중복 학번 검사
    const existingUser = await User.findOne({ where: { studentId } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `이미 등록된 학번(${studentId})입니다. 로그인 탭을 이용해 주세요.`
      });
    }

    const newUser = await User.create({
      department: department || '컴퓨터공학과',
      studentId,
      name,
      role: studentId.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT'
    });

    const token = generateToken(newUser, autoLogin);

    return res.status(201).json({
      success: true,
      message: `${newUser.department} ${newUser.name} 학우님, 회원가입이 완료되었습니다!`,
      token,
      user: newUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '회원가입 처리 중 서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 2. 로그인 (학과/학번/이름 일치 확인 및 자동 로그인 토큰 발급)
exports.login = async (req, res) => {
  try {
    const { department, studentId, name, autoLogin } = req.body;

    const user = await User.findOne({ where: { studentId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '등록되지 않은 학번입니다. 학번을 확인하거나 회원가입을 진행해 주세요.'
      });
    }

    // 학과 또는 이름이 일치하지 않는 경우 예외 처리
    if (user.department !== department || user.name !== name) {
      return res.status(401).json({
        success: false,
        message: '입력하신 학과 또는 이름이 해당 학번의 정보와 일치하지 않습니다.'
      });
    }

    const token = generateToken(user, autoLogin);

    return res.status(200).json({
      success: true,
      message: `${user.name}님 환영합니다!`,
      token,
      user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '로그인 처리 중 서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 3. 자동 로그인 및 기기 간 동기화된 내 프로필 조회
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '사용자 정보를 불러오는 중 오류가 발생했습니다.'
    });
  }
};

// 4. 사용자 기본 정보(학과 또는 선호 메인 화면) 수정
exports.updateProfile = async (req, res) => {
  try {
    const { department, preferredMainView } = req.body;
    const user = req.user;

    if (department && department.trim() !== '') {
      user.department = department.trim();
    }
    if (preferredMainView && ['TIMETABLE', 'DASHBOARD'].includes(preferredMainView)) {
      user.preferredMainView = preferredMainView;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: '사용자 설정이 서버에 저장되었습니다.',
      user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다.'
    });
  }
};