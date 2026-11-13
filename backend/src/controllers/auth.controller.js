const path = require('path');
const jwt = require('jsonwebtoken');
const User = require(path.join(__dirname, '../models/user.model'));
const { JWT_SECRET } = require(path.join(__dirname, '../middlewares/auth.middleware'));
const { recalculateUserGpa } = require(path.join(__dirname, '../services/gpa.service'));

const ADMIN_STUDENT_ID = '26101232';

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

exports.register = async (req, res) => {
  try {
    const { department, studentId, name, autoLogin } = req.body;

    const existingUser = await User.findOne({ where: { studentId } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 가입된 학번입니다. 본인의 학번으로 로그인해 주세요.'
      });
    }

    const isAdmin =
      studentId === ADMIN_STUDENT_ID &&
      name === '최준우' &&
      department === '컴퓨터공학과';

    const newUser = await User.create({
      department: department || '컴퓨터공학과',
      studentId,
      name,
      statusMessage: '',
      role: isAdmin ? 'ADMIN' : 'STUDENT',
      currentYear: 2026,
      currentSemester: '1학기'
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

exports.login = async (req, res) => {
  try {
    const { department, studentId, name, autoLogin } = req.body;

    const user = await User.findOne({
      where: {
        studentId,
        department,
        name
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '입력하신 학과, 학번, 이름 정보가 일치하는 계정이 없습니다. 정보를 다시 확인해 주세요.'
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

exports.updateProfile = async (req, res) => {
  try {
    const {
      department,
      studentId,
      name,
      statusMessage,
      preferredMainView,
      currentYear,
      currentSemester
    } = req.body;
    const user = req.user;

    if (studentId && studentId.trim() !== '' && studentId.trim() !== user.studentId) {
      const duplicate = await User.findOne({ where: { studentId: studentId.trim() } });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: '이미 사용 중인 학번입니다. 다른 학번을 입력해 주세요.'
        });
      }
      user.studentId = studentId.trim();
    }

    if (department && department.trim() !== '') {
      user.department = department.trim();
    }

    if (name && name.trim() !== '') {
      user.name = name.trim();
    }

    if (statusMessage !== undefined) {
      user.statusMessage = String(statusMessage).trim().slice(0, 150);
    }

    if (preferredMainView && ['TIMETABLE', 'DASHBOARD'].includes(preferredMainView)) {
      user.preferredMainView = preferredMainView;
    }

    if (currentYear !== undefined) {
      const numYear = Number(currentYear);
      if (numYear >= 1980 && numYear <= 2050) {
        user.currentYear = numYear;
      }
    }

    if (
      currentSemester &&
      ['1학기', '2학기', '여름계절학기', '겨울계절학기'].includes(currentSemester)
    ) {
      user.currentSemester = currentSemester;
    }

    await user.save();
    await recalculateUserGpa(user.id);
    const refreshedUser = await User.findByPk(user.id);

    return res.status(200).json({
      success: true,
      message: '설정이 성공적으로 저장되었습니다.',
      user: refreshedUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '정보 수정 중 오류가 발생했습니다.'
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = req.user;
    await user.destroy();

    return res.status(200).json({
      success: true,
      message: '회원탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '회원탈퇴 처리 중 서버 오류가 발생했습니다.'
    });
  }
};