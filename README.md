# 🎓 서울과학기술대학교 컴퓨터공학과 성적 · 시간표 · 졸업요건 통합 관리 시스템
> **2026 SEOULTECH CSE Portal (Team 04)**  
> 주간 강의·기타활동 타임테이블, 4.5 만점 기준 GPA 계산기, 정규분포(Z-Score) 기반 성적 예측 시뮬레이터, 친구 시간표 공유 및 활동 제안, 스터디 그룹 게시판, 학번·입학유형별 맞춤형 졸업요건(EPiC folio)을 하나로 통합한 학사 관리 웹 애플리케이션입니다.

---

## 🌐 배포 주소 및 리포지토리
* **Production Web URL (Vercel)**: [https://dist-chi-seven-16.vercel.app](https://dist-chi-seven-16.vercel.app)
* **GitHub Repository**: `https://github.com/2026ENDPoinT/team04`

---

## ✨ 주요 구현 기능 요약

### 1. 🗓️ 한 화면 주간 타임테이블 (`시간표` 탭)
* **스크롤 없는 한 화면 최적화**: `09:00 ~ 21:00` (30분 단위) 주간 시간표가 세로 스크롤 없이 한 화면에 들어오도록 레이아웃 최적화.
* **강의 + 기타 활동 통합 표시**: 정규 수강 과목과 사용자가 등록한 기타 활동(동아리, 스터디, 개인 일정 등)을 동시에 표시하며, 하단 체크박스로 **📚 강의 시간표 보이기** / **✨ 기타 활동 보이기** 및 **활동 기간 기준일 필터**를 즉시 전환 가능.

### 2. 📚 과목 및 성적 관리 & 4.5 만점 GPA 엔진
* **재수강 및 수강포기(W) 자동 처리**: 동일 과목명 재수강 시 최신 성적으로 자동 대체하여 GPA를 산출하며, 수강포기(W) 과목은 학점 및 평점 계산에서 자동 제외.
* **입력 예외 처리**: `09:00 ~ 21:00` 범위 외 시간 차단, 시작/종료 시간 역전 방지, 동일 과목 내 시간 중복 차단.

### 3. ✨ 기타 활동 관리 (비교과 · 개인 일정)
* 강의가 아닌 활동이므로 학점·평점 없이 **세부 설명, 관련 링크(URL), 활동 기간(시작일~종료일)**을 등록하여 해당 기간 동안 타임테이블에 표시.
* **사용자 정의 카테고리 분류** 및 활동명 클릭 시 세부정보 즉시 수정 지원.
* **친구 비공개 설정 (`isPrivate`)**: 체크 시 친구가 내 시간표를 열람할 때는 숨겨지며, 오직 **본인과 운영자(ADMIN)**만 확인 가능.

### 4. 📊 성적 예측 시뮬레이터 (정규분포 백분위 계산)
* 시험 점수, 출석 점수, 과제 점수와 각각의 만점·반영 비율(%) 및 등급별 성적 컷 비율(`A+` ~ `D`)을 자유롭게 설정.
* 수강 인원 기본값 **50명** 제공 (사용자 직접 변경 가능).
* **시험 평균·표준편차 기반 백분위 산출**: 시험(`EXAM`) 항목에 평균($\mu$)과 표준편차($\sigma$)를 입력하면 출석·과제 점수를 배제하고 표준정규분포 누적분포함수($Z = \frac{X - \mu}{\sigma}$, CDF)를 통해 **오직 시험 성적만으로 예상 상위 백분위(%)와 예상 등수**를 정밀 계산 및 영구 저장.

### 5. 🤝 친구 기능 & 시간표 기반 활동 제안
* **학과 + 이름 검색 및 동명이인 학번 마스킹**: 학과와 이름으로 친구를 검색하며, **학과와 이름이 같은 동명이인이 2명 이상 존재할 때만 학번의 맨앞 2자리와 맨뒤 3자리(예: `26***232`)를 공개**하여 프라이버시 보호.
* **상태메시지 작성**: 친구들에게 보여줄 나의 상태메시지 등록.
* **성적 제외 타임테이블 열람 및 활동 제안**: 친구 이름 클릭 시 성적·학점 정보는 API 레벨에서 완전히 제외된 순수 타임테이블만 조회되며, 원하는 시간대를 클릭해 **활동 제안(수락/거절)** 및 **메시지 전달** 가능.

### 6. 👥 스터디 그룹 & 권한별 그룹 게시판
* **공개 그룹(즉시 가입) / 비공개 그룹(관리자 허락 후 가입)** 구분 생성.
* 그룹 생성자는 **그룹 최고 관리자(`OWNER`)**가 되며, 그룹원별로 **👁️ 게시글 보기 권한**, **✍️ 게시글 쓰기 권한**, **🛡️ 권한 임명 권한**을 개별 부여 가능.
* 그룹별 독립 게시판 카테고리 추가, 게시글 키워드 검색, 최고 관리자의 모든 게시글 수정·삭제 권한 부여.
* **그룹 인원 0명 시 자동 삭제**: 탈퇴·추방 등으로 그룹 활성 인원이 0명이 되면 그룹과 하위 데이터가 자동으로 삭제됨.

### 7. 🎓 맞춤형 졸업요건 & 서울과기대 공식 EPiC folio 원클릭 시뮬레이터
* **학번(입학년도) 및 신입학/편입생 자동 판별**: 사용자의 학번 앞 2자리로 입학년도를 인식하여 졸업 기준 이수학점(132~140학점)을 자동 적용하고, **신입학(재학생)** / **편입생(EPiC 기준 점수 50% 감면)** 스위치에 따라 기준 점수를 즉시 조정.
* **평점 확정 학점 계산**: `'현재 이수 중'`이거나 `F`/`수강포기(W)`인 과목을 제외하고 학기가 끝나 평점이 나온 과목들의 총 학점만 합산.
* **서울과기대 공식 EPiC folio 카탈로그 원클릭 추가/삭제**: 활동명 옆에 **`필수 요건`/`선택 요건`**, **`~~점`** 둥근 배지와 **진행 일시**를 표시하며, **`[이수 완료]`** 뿐 아니라 **`[이수 희망]`** 활동을 클릭 한 번으로 담아 희망 활동 이수 시 총 몇 점이 되는지 실시간 시뮬레이션.

### 8. 💬 피드백 (건의 사항) & 🛡️ ADMIN 통합 관리
* **피드백 제출 및 3단계 현황 확인**: 일반 유저가 건의 사항이나 개선점을 제출하면 **`제출 완료` ➡️ `검토 중` ➡️ `검토 완료`** 3단계 진행 상황과 ADMIN의 답변을 확인 가능.
* **ADMIN 전용 기능**: 전체 유저 목록 및 친구 관계 조회·강제 추가/삭제, 비공개 기타 활동 열람, 전체 피드백 상태 변경 및 답변 등록.

---

## 🏗️ 시스템 아키텍처 및 디렉토리 구조

프론트엔드와 백엔드를 분리하고, 백엔드는 역할에 따라 **Routes - Middlewares - Controllers - Services - Models**의 5계층으로 모듈화했습니다.

```text
team04/
├── README.md                          # 프로젝트 공식 문서
├── start_web.bat                      # Windows 원클릭 백엔드+프론트엔드 자동 실행 배치 파일
├── presentation_slides.tex            # 해커톤 발표자료 (LaTeX PDF 소스)
│
├── frontend/                          # React + Vite + Tailwind CSS 프론트엔드
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       └── App.jsx                    # 메인 애플리케이션 (시간표/도구 뷰, 'v' 박스 접기, 프로필 팝업 등)
│
└── backend/                           # Node.js + Express + Sequelize 백엔드
    ├── package.json
    ├── .env                           # DB 연결(DATABASE_URL) 및 JWT_SECRET 환경변수
    └── src/
        ├── server.js                  # Express 엔트리 포인트 및 정적 빌드 서빙
        ├── config/
        │   └── db.config.js           # Supabase PostgreSQL & 로컬 SQLite 자동 폴백 설정
        ├── middlewares/
        │   ├── auth.middleware.js     # JWT 토큰 검증 및 인증 입력값 검증
        │   └── course.validator.js    # 09:00~21:00 시간표 유효성 및 중복 검증
        ├── models/                    # Sequelize ORM 데이터베이스 스키마
        │   ├── user.model.js
        │   ├── course.model.js
        │   ├── activity.model.js
        │   ├── prediction.model.js
        │   ├── friend.model.js
        │   ├── interaction.model.js
        │   ├── group.model.js
        │   ├── graduation.model.js
        │   └── feedback.model.js
        ├── services/                  # 순수 비즈니스 계산 로직 분리
        │   ├── gpa.service.js         # 4.5 만점 GPA, 재수강 대체, 수강포기(W) 제외 연산
        │   └── prediction.service.js  # 정규분포(Z-score CDF) 기반 시험 단독 백분위 연산
        ├── controllers/               # 도메인별 요청/응답 제어
        │   ├── auth.controller.js
        │   ├── course.controller.js
        │   ├── activity.controller.js
        │   ├── prediction.controller.js
        │   ├── friend.controller.js
        │   ├── group.controller.js
        │   ├── graduation.controller.js
        │   └── admin.controller.js    # ADMIN 유저·친구 강제 관리 및 피드백 통합 컨트롤러
        └── routes/                    # REST API 라우터
            ├── auth.routes.js
            ├── course.routes.js
            ├── activity.routes.js
            ├── prediction.routes.js
            ├── friend.routes.js
            ├── group.routes.js
            ├── graduation.routes.js
            └── admin.routes.js        # ADMIN 및 피드백 통합 라우터
```

---

## 🔄 핵심 데이터 흐름 (Data Flow)

$$\text{React Client Action} \xrightarrow{\text{Bearer JWT}} \text{Express Routes \& Middlewares} \xrightarrow{\text{Validated}} \text{Controllers \& Services} \xrightarrow{\text{Sequelize ORM}} \text{PostgreSQL / SQLite}$$

1. **과목 성적 변경 시 연쇄 계산 흐름**:  
   과목 등록/수정 (`course.controller.js`) $\rightarrow$ `gpa.service.js` 호출 $\rightarrow$ 동일 과목명 최신 재수강 성적 채택 & 수강포기(W) 제외 $\rightarrow$ `User` 모델의 `gpa`, `totalCredits`, `currentSemesterCredits` 갱신 $\rightarrow$ 졸업요건 탭의 평점 확정 이수학점 프로그레스 바 즉시 갱신.
2. **성적 예측 백분위 계산 흐름**:  
   평가 항목 및 시험 평균($\mu$)·표준편차($\sigma$) 입력 $\rightarrow$ `prediction.service.js`에서 시험 항목만 추출하여 가중 $Z$-점수 산출 $\rightarrow$ 표준정규분포 누적분포함수($\Phi(Z)$)로 상위 백분위($1 - \Phi(Z)$) 및 수강 인원 대비 예상 등수 산출.
3. **하이브리드 스토리지 동기화**:  
   클라우드 DB(`PostgreSQL`/`SQLite`)와 브라우저 `localStorage`가 동일한 데이터 스키마로 동작하여 네트워크 단절 시에도 데이터 유실 없이 즉시 시연 가능.

---

## 🚀 로컬 실행 방법 (Quick Start)

### 방법 1. Windows 원클릭 실행 (`start_web.bat`)
프로젝트 루트 폴더의 **`start_web.bat`** 파일을 더블클릭하면 백엔드 서버(Port `5000`), 프론트엔드 개발 서버(Port `5173`), 웹 브라우저가 자동으로 실행됩니다.

### 방법 2. 터미널 수동 실행

#### 1) 백엔드 서버 실행
```bash
cd backend
npm install
npm start
```

#### 2) 프론트엔드 서버 실행
```bash
cd frontend
npm install
npm run dev
```
* 브라우저에서 `http://localhost:5173` 접속

---

## ☁️ 배포 및 업데이트 명령어 (Vercel CLI)

코드를 수정한 뒤 프로덕션 웹사이트(`https://dist-chi-seven-16.vercel.app`)에 즉시 반영하려면 아래 명령어를 실행합니다:

```powershell
cd frontend
npm run build
npx vercel deploy ./dist --prod --yes
```