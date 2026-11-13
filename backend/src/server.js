const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const sequelize = require(path.join(__dirname, './config/db.config'));
const User = require(path.join(__dirname, './models/user.model'));
require(path.join(__dirname, './models/course.model'));
const authRoutes = require(path.join(__dirname, './routes/auth.routes'));
const courseRoutes = require(path.join(__dirname, './routes/course.routes'));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'SEOULTECH CSE Grade & Timetable API' });
});

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    await User.seedAdminAccount();
    app.listen(PORT, () => {
      console.log(`🚀 서울과기대 성적관리 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
  }
};

startServer();