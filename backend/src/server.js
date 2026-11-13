const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db.config');
const User = require('./models/user.model');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Step 1: 인증 라우터 연결
app.use('/api/auth', authRoutes);

// 헬스 체크 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'SEOULTECH CSE Grade & Timetable API' });
});

// DB 동기화 및 기본 운영자 계정 시드 생성 후 서버 시작
const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    await User.seedAdminAccount(); // 운영자 계정(ADMIN) 1개 자동 보장
    app.listen(PORT, () => {
      console.log(`🚀 서울과기대 성적관리 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
  }
};

startServer();