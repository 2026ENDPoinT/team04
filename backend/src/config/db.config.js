const { Sequelize } = require('sequelize');

// 다수 사용자 수용을 위한 Connection Pool 설정 (PostgreSQL / MySQL 호환, 로컬 테스트 시 SQLite 폴백 지원)
const sequelize = new Sequelize(
  process.env.DB_NAME || 'seoultech_cse_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'postgres', // 배포 환경에 따라 'mysql' 또는 'sqlite' 변경 가능
    logging: false,
    pool: {
      max: 50,     // 최대 동시 연결 수 (다수 학부생 트래픽 수용)
      min: 5,      // 최소 유지 연결 수
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;