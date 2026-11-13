const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const sequelize = require(path.join(__dirname, './config/db.config'));
const User = require(path.join(__dirname, './models/user.model'));
require(path.join(__dirname, './models/course.model'));
require(path.join(__dirname, './models/friend.model'));
require(path.join(__dirname, './models/interaction.model'));
require(path.join(__dirname, './models/prediction.model'));
require(path.join(__dirname, './models/activity.model'));
require(path.join(__dirname, './models/feedback.model'));

const authRoutes = require(path.join(__dirname, './routes/auth.routes'));
const courseRoutes = require(path.join(__dirname, './routes/course.routes'));
const friendRoutes = require(path.join(__dirname, './routes/friend.routes'));
const predictionRoutes = require(path.join(__dirname, './routes/prediction.routes'));
const activityRoutes = require(path.join(__dirname, './routes/activity.routes'));
const adminRoutes = require(path.join(__dirname, './routes/admin.routes'));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/admin', adminRoutes);
// 통합된 adminRoutes를 /api/feedbacks 경로에도 함께 연결하여 별도 라우터 파일 없이 동작 보장
app.use('/api/feedbacks', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'SEOULTECH CSE Grade & Timetable API' });
});

const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
}

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