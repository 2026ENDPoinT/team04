import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  LayoutGrid,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Clock,
  GraduationCap,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Settings,
  RotateCcw,
  Ban,
  Database,
  Server,
  X,
  UserX,
  Users,
  UserPlus,
  MessageSquare,
  Send,
  CalendarPlus,
  Check,
  XCircle,
  Search,
  Calculator,
  TrendingUp,
  Save,
  Award,
  Briefcase,
  Link2,
  Lock,
  Unlock,
  Eye,
  FolderPlus,
  MessageCircleQuestion
} from 'lucide-react';

const GRADE_POINTS = {
  'A+': 4.5,
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D+': 1.5,
  'D': 1.0,
  'F': 0.0
};

const GRADE_OPTIONS = ['현재 이수 중', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
const SEMESTER_OPTIONS = ['1학기', '2학기', '여름계절학기', '겨울계절학기'];
const DAYS = ['월', '화', '수', '목', '금'];
const PASTEL_COLORS = ['#A8FFDB', '#D4B2FF', '#FFB2D0', '#99E6FF', '#FFE699', '#B8FF99'];

const TIME_OPTIONS = [];
for (let h = 9; h <= 21; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_OPTIONS.push(`${hh}:00`);
  if (h !== 21) {
    TIME_OPTIONS.push(`${hh}:30`);
  }
}

const timeToMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const SEMESTER_ORDER = {
  '1학기': 1,
  '여름계절학기': 2,
  '2학기': 3,
  '겨울계절학기': 4
};

// 표준정규분포 누적분포함수(CDF) - <조건 5> 시험 평균·표준편차 기반 시험 단독 백분위 계산용
const standardNormalCDF = (z) => {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (z >= 0.0) {
    const t = 1.0 / (1.0 + p * z);
    return (
      1.0 -
      c *
        Math.exp((-z * z) / 2.0) *
        t *
        (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    );
  } else {
    const t = 1.0 / (1.0 - p * z);
    return (
      c *
      Math.exp((-z * z) / 2.0) *
      t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    );
  }
};

const DEFAULT_GRADE_CUTOFFS = {
  'A+': 15,
  'A': 30,
  'B+': 50,
  'B': 70,
  'C+': 85,
  'C': 95,
  'D+': 98,
  'D': 100
};

const DEFAULT_EVALUATION_ITEMS = [
  {
    id: 'midterm',
    category: 'EXAM',
    label: '중간고사 (시험)',
    score: 88,
    maxScore: 100,
    weight: 35,
    mean: '74',
    stdDev: '11'
  },
  {
    id: 'final',
    category: 'EXAM',
    label: '기말고사 (시험)',
    score: 92,
    maxScore: 100,
    weight: 35,
    mean: '76',
    stdDev: '12'
  },
  {
    id: 'assignment',
    category: 'ASSIGNMENT',
    label: '과제 / 프로젝트',
    score: 95,
    maxScore: 100,
    weight: 20,
    mean: '',
    stdDev: ''
  },
  {
    id: 'attendance',
    category: 'ATTENDANCE',
    label: '출석 점수',
    score: 100,
    maxScore: 100,
    weight: 10,
    mean: '',
    stdDev: ''
  }
];

// <조건 3> 학과와 이름이 같은 사람이 존재할 때만 학번의 맨앞 2자리와 맨뒤 3자리 공개 (예: 26101232 -> 26***232)
const maskStudentIdFront2Back3 = (sid) => {
  const s = String(sid || '').trim();
  if (s.length <= 5) return `${s.slice(0, 2)}*${s.slice(-2)}`;
  const front2 = s.slice(0, 2);
  const back3 = s.slice(-3);
  const stars = '*'.repeat(Math.max(1, s.length - 5));
  return `${front2}${stars}${back3}`;
};

const SEED_ACCOUNTS = [
  {
    id: 1,
    department: '컴퓨터공학과',
    studentId: '26101232',
    name: '최준우',
    statusMessage: '서울과기대 컴공 26학번! 같이 공강에 밥 먹어요 🍚',
    role: 'ADMIN',
    preferredMainView: 'TIMETABLE',
    currentYear: 2026,
    currentSemester: '1학기'
  },
  {
    id: 2,
    department: '컴퓨터공학과',
    studentId: '261',
    name: '김민수',
    statusMessage: '알고리즘 스터디 구합니다 💻',
    role: 'STUDENT',
    preferredMainView: 'TIMETABLE',
    currentYear: 2026,
    currentSemester: '1학기'
  },
  {
    id: 3,
    department: '컴퓨터공학과',
    studentId: '262',
    name: '박진',
    statusMessage: '졸업작품 준비 중... 화이팅!',
    role: 'STUDENT',
    preferredMainView: 'TIMETABLE',
    currentYear: 2026,
    currentSemester: '1학기'
  },
  {
    id: 4,
    department: '컴퓨터공학과',
    studentId: '263',
    name: '이서연',
    statusMessage: '수요일 오후 공강이에요 ☕',
    role: 'STUDENT',
    preferredMainView: 'TIMETABLE',
    currentYear: 2026,
    currentSemester: '1학기'
  }
];

const SEED_COURSES_BY_STUDENT = {
  '26101232': [
    {
      id: 101,
      year: 2026,
      semester: '1학기',
      courseName: '자료구조',
      credits: 3,
      grade: 'A+',
      color: '#A8FFDB',
      isRetake: false,
      isWithdrawn: false,
      schedules: [
        { day: '월', startTime: '10:30', endTime: '12:00' },
        { day: '수', startTime: '10:30', endTime: '12:00' }
      ]
    },
    {
      id: 102,
      year: 2026,
      semester: '1학기',
      courseName: '운영체제',
      credits: 3,
      grade: '현재 이수 중',
      color: '#D4B2FF',
      isRetake: false,
      isWithdrawn: false,
      schedules: [
        { day: '화', startTime: '13:00', endTime: '14:30' },
        { day: '목', startTime: '13:00', endTime: '14:30' }
      ]
    }
  ],
  '261': [
    {
      id: 201,
      year: 2026,
      semester: '1학기',
      courseName: '컴퓨터구조',
      credits: 3,
      grade: 'A',
      color: '#99E6FF',
      isRetake: false,
      isWithdrawn: false,
      schedules: [
        { day: '월', startTime: '09:30', endTime: '11:00' },
        { day: '수', startTime: '09:30', endTime: '11:00' }
      ]
    },
    {
      id: 202,
      year: 2026,
      semester: '1학기',
      courseName: '이산수학',
      credits: 3,
      grade: 'B+',
      color: '#FFB2D0',
      isRetake: false,
      isWithdrawn: false,
      schedules: [
        { day: '화', startTime: '15:00', endTime: '16:30' },
        { day: '목', startTime: '15:00', endTime: '16:30' }
      ]
    }
  ],
  '262': [
    {
      id: 301,
      year: 2026,
      semester: '1학기',
      courseName: '인공지능개론',
      credits: 3,
      grade: 'A+',
      color: '#FFE699',
      isRetake: false,
      isWithdrawn: false,
      schedules: [
        { day: '금', startTime: '10:00', endTime: '13:00' }
      ]
    }
  ],
  '263': [
    {
      id: 401,
      year: 2026,
      semester: '1학기',
      courseName: '소프트웨어공학',
      credits: 3,
      grade: 'A+',
      color: '#B8FF99',
      isRetake: false,
      isWithdrawn: false,
      schedules: [
        { day: '화', startTime: '10:30', endTime: '12:00' },
        { day: '목', startTime: '10:30', endTime: '12:00' }
      ]
    }
  ]
};

// 초기 기타 활동 샘플 데이터 (<조건 1 ~ 7>)
const SEED_ACTIVITIES_BY_STUDENT = {
  '26101232': [
    {
      id: 5001,
      title: '알고리즘 코딩테스트 스터디',
      category: '동아리/스터디',
      description: '백준 골드~플래티넘 문제 풀이 및 코드 리뷰',
      link: 'https://github.com/2026ENDPoinT/team04',
      startDate: '2026-03-02',
      endDate: '2026-12-20',
      color: '#FFE699',
      isPrivate: false,
      schedules: [{ day: '수', startTime: '15:00', endTime: '17:00' }]
    },
    {
      id: 5002,
      title: '개인 백엔드 포트폴리오 정리 (비공개)',
      category: '개인 일정',
      description: '혼자 집중해서 진행하는 프로젝트 정리 시간',
      link: 'https://notion.so',
      startDate: '2026-03-02',
      endDate: '2026-12-20',
      color: '#FFB2D0',
      isPrivate: true,
      schedules: [{ day: '금', startTime: '14:00', endTime: '16:00' }]
    }
  ],
  '261': [
    {
      id: 5003,
      title: '밴드부 정기 합주',
      category: '동아리/스터디',
      description: '학생회관 지하 연습실 정기 합주',
      link: '',
      startDate: '2026-03-02',
      endDate: '2026-12-20',
      color: '#B8FF99',
      isPrivate: false,
      schedules: [{ day: '목', startTime: '18:00', endTime: '20:00' }]
    },
    {
      id: 5004,
      title: '병원 진료 및 개인 운동 (친구 비공개)',
      category: '개인 일정',
      description: '친구에게는 보이지 않고 ADMIN만 확인 가능한 비공개 활동',
      link: '',
      startDate: '2026-03-02',
      endDate: '2026-12-20',
      color: '#FFB2D0',
      isPrivate: true,
      schedules: [{ day: '월', startTime: '15:00', endTime: '16:30' }]
    }
  ]
};

const FEEDBACK_STATUS_OPTIONS = ['제출 완료', '검토 중', '검토 완료'];

// <졸업요건 조건 1, 2, 3> 서울과학기술대학교 공식 EPiC folio 인정 활동 카탈로그 (클릭만으로 간편 추가/삭제 지원)
// 각 활동명 옆에 둥근 박스로 '필수 요건' / '선택 요건', '~~점' 배지 및 활동 일시(scheduleDate) 표시
const SEOULTECH_OFFICIAL_EPIC_CATALOG = [
  {
    activityCode: 'EPIC_REQ_01',
    title: '전공 졸업작품 (캡스톤디자인 종합설계 발표 및 심사)',
    reqType: '필수 요건',
    points: 200,
    category: '전공/학술',
    scheduleDate: '매 학기 6월 / 12월 말 학과 심사 주간',
    description: '컴퓨터공학과 학부생 졸업 필수 종합설계 작품 제출 및 발표',
    officialUrl: 'https://epic.seoultech.ac.kr'
  },
  {
    activityCode: 'EPIC_REQ_02',
    title: 'ST 진로탐색 및 전공상담 (지도교수 정기 면담)',
    reqType: '필수 요건',
    points: 50,
    category: '진로/상담',
    scheduleDate: '매 학기 상시 (1학기 3~6월 / 2학기 9~12월)',
    description: '서울과기대 EPiC folio 진로 및 학업설계 지도교수 필수 상담',
    officialUrl: 'https://epic.seoultech.ac.kr'
  },
  {
    activityCode: 'EPIC_REQ_03',
    title: '공인어학성적 또는 정보처리기사 자격 취득 인증',
    reqType: '필수 요건',
    points: 150,
    category: '어학/자격증',
    scheduleDate: '연중 상시 접수 (졸업 사정 전월 마감)',
    description: 'TOEIC 700+ / OPIc IM1+ 또는 정보처리기사(산업기사) 자격증 공식 등록',
    officialUrl: 'https://epic.seoultech.ac.kr'
  },
  {
    activityCode: 'EPIC_SEL_01',
    title: 'SW 코딩역량인증 / PCCP·TOPCIT 성적 우수 인증',
    reqType: '선택 요건',
    points: 120,
    category: '전공/학술',
    scheduleDate: '2026.05.23 (토) / 2026.10.31 (토) 정기 시행',
    description: 'SW중심대학사업단 주관 TOPCIT 및 코딩역량 평가 응시/수상',
    officialUrl: 'https://epic.seoultech.ac.kr'
  },
  {
    activityCode: 'EPIC_SEL_02',
    title: '교내·외 해커톤 및 SW 경진대회 참가/입상',
    reqType: '선택 요건',
    points: 150,
    category: '공모전/경진대회',
    scheduleDate: '2026.07 ~ 2026.11 (하계/동계 방학 및 학기 중)',
    description: '서울과기대 창의융합 해커톤, ICPC, 외부 알고리즘/개발 공모전 참여',
    officialUrl: 'https://epic.seoultech.ac.kr'
  },
  {
    activityCode: 'EPIC_SEL_03',
    title: '현장실습 (ICT 학점연계 인턴십 / 하계·동계 Co-op)',
    reqType: '선택 요건',
    points: 200,
    category: '현장실습/인턴',
    scheduleDate: '하계(2026.07~08) / 동계(2027.01~02) / 학기제',
    description: '대학일자리플러스센터 및 현장실습지원센터 연계 기업 인턴십 수료',
    officialUrl: 'https://epic.seoultech.ac.kr'
  },
  {
    activityCode: 'EPIC_SEL_04',
    title: 'CTL 교수학습개발센터 학습공동체 (튜터링·스터디그룹)',
    reqType: '선택 요건',
    points: 80,
    category: '비교과/특강',
    scheduleDate: '학기별 운영 (2026.03.16 ~ 2026.06.05)',
    description: '전공 튜터링 및 스터디그룹 8주 이상 완주 시 EPiC 마일리지 자동 부여',
    officialUrl: 'https://epic.seoultech.ac.kr'
  },
  {
    activityCode: 'EPIC_SEL_05',
    title: '창업지원단 ST 창업캠프 및 창업동아리 활동',
    reqType: '선택 요건',
    points: 100,
    category: '공모전/경진대회',
    scheduleDate: '2026.05.08 ~ 2026.05.10 / 학기 중 상시',
    description: '아이디어 경진대회 및 IT 서비스 창업 캠프 수료',
    officialUrl: 'https://epic.seoultech.ac.kr'
  },
  {
    activityCode: 'EPIC_SEL_06',
    title: '대학일자리플러스센터 AI 모의면접 & 취업역량 부트캠프',
    reqType: '선택 요건',
    points: 60,
    category: '진로/상담',
    scheduleDate: '매월 둘째·넷째 주 수요일 14:00 ~ 17:00',
    description: '이력서·포트폴리오 첨삭 및 현직 개발자 멘토링 특강 수료',
    officialUrl: 'https://epic.seoultech.ac.kr'
  },
  {
    activityCode: 'EPIC_SEL_07',
    title: '글로벌 교환학생 / 단기 해외연수 및 어학연수 프로그램',
    reqType: '선택 요건',
    points: 150,
    category: '글로벌/봉사',
    scheduleDate: '하계/동계 방학 파견 및 정규학기 파견',
    description: '국제교육본부 주관 해외 자매대학 파견 및 글로벌 역량 프로그램',
    officialUrl: 'https://epic.seoultech.ac.kr'
  },
  {
    activityCode: 'EPIC_SEL_08',
    title: '사회봉사활동 및 전공 재능기부 멘토링 (30시간 이상)',
    reqType: '선택 요건',
    points: 50,
    category: '글로벌/봉사',
    scheduleDate: '연중 상시 (VMS / 1365 인증서 연동)',
    description: '지역사회 코딩 교육 봉사 및 공인 봉사활동 시간 인증',
    officialUrl: 'https://epic.seoultech.ac.kr'
  }
];

const SEED_GRADUATION_BY_STUDENT = {
  '26101232': {
    admissionType: 'REGULAR', // 'REGULAR' (신입학 재학생) | 'TRANSFER' (편입생)
    selectedEpicItems: [
      {
        activityCode: 'EPIC_REQ_02',
        title: 'ST 진로탐색 및 전공상담 (지도교수 정기 면담)',
        reqType: '필수 요건',
        points: 50,
        category: '진로/상담',
        scheduleDate: '매 학기 상시 (1학기 3~6월 / 2학기 9~12월)',
        officialUrl: 'https://epic.seoultech.ac.kr',
        status: 'COMPLETED' // 이수 완료
      },
      {
        activityCode: 'EPIC_SEL_04',
        title: 'CTL 교수학습개발센터 학습공동체 (튜터링·스터디그룹)',
        reqType: '선택 요건',
        points: 80,
        category: '비교과/특강',
        scheduleDate: '학기별 운영 (2026.03.16 ~ 2026.06.05)',
        officialUrl: 'https://epic.seoultech.ac.kr',
        status: 'COMPLETED' // 이수 완료
      },
      {
        activityCode: 'EPIC_REQ_01',
        title: '전공 졸업작품 (캡스톤디자인 종합설계 발표 및 심사)',
        reqType: '필수 요건',
        points: 200,
        category: '전공/학술',
        scheduleDate: '매 학기 6월 / 12월 말 학과 심사 주간',
        officialUrl: 'https://epic.seoultech.ac.kr',
        status: 'WISH' // 이수 희망
      },
      {
        activityCode: 'EPIC_SEL_02',
        title: '교내·외 해커톤 및 SW 경진대회 참가/입상',
        reqType: '선택 요건',
        points: 150,
        category: '공모전/경진대회',
        scheduleDate: '2026.07 ~ 2026.11 (하계/동계 방학 및 학기 중)',
        officialUrl: 'https://epic.seoultech.ac.kr',
        status: 'WISH' // 이수 희망
      }
    ]
  }
};

// <그룹 조건 1 ~ 7> 초기 샘플 그룹 데이터 (공개 그룹 1개, 비공개 그룹 1개)
const SEED_STUDY_GROUPS = [
  {
    id: 7001,
    name: '서울과기대 알고리즘·코테 정복반',
    description: '매주 백준/프로그래머스 문제 풀이 및 코드 리뷰를 진행하는 공개 스터디 그룹입니다.',
    isPrivate: false,
    ownerId: 1,
    boardCategories: ['공지사항', '자유게시판', '질문/답변', '문제풀이 인증'],
    members: [
      {
        userId: 1,
        role: 'OWNER',
        status: 'ACTIVE',
        canRead: true,
        canWrite: true,
        canManageRoles: true
      },
      {
        userId: 2,
        role: 'MANAGER',
        status: 'ACTIVE',
        canRead: true,
        canWrite: true,
        canManageRoles: true
      },
      {
        userId: 4,
        role: 'MEMBER',
        status: 'ACTIVE',
        canRead: true,
        canWrite: true,
        canManageRoles: false
      }
    ],
    posts: [
      {
        id: 8001,
        category: '공지사항',
        authorId: 1,
        authorName: '최준우',
        authorDept: '컴퓨터공학과',
        title: '[필독] 알고리즘 스터디 주간 진행 규칙 안내',
        content: '매주 수요일 오후 3시 전까지 각자 맡은 골드 난이도 2문제를 풀고 풀이를 공유해 주세요!',
        createdAt: '2026-03-10 10:00'
      },
      {
        id: 8002,
        category: '질문/답변',
        authorId: 2,
        authorName: '김민수',
        authorDept: '컴퓨터공학과',
        title: '다익스트라 우선순위 큐 시간복잡도 질문입니다',
        content: '간선 개수가 많을 때 파이썬 heapq 대신 C++ priority_queue를 쓰는 게 유리할까요?',
        createdAt: '2026-03-11 15:40'
      }
    ]
  },
  {
    id: 7002,
    name: '2026 캡스톤디자인 A팀 (비공개)',
    description: '가입 시 그룹 관리자의 승인이 필요한 캡스톤디자인 프로젝트 비공개 그룹입니다.',
    isPrivate: true,
    ownerId: 2,
    boardCategories: ['공지사항', '회의록', '개발일지'],
    members: [
      {
        userId: 2,
        role: 'OWNER',
        status: 'ACTIVE',
        canRead: true,
        canWrite: true,
        canManageRoles: true
      },
      {
        userId: 3,
        role: 'MEMBER',
        status: 'PENDING',
        canRead: true,
        canWrite: true,
        canManageRoles: false
      }
    ],
    posts: [
      {
        id: 8003,
        category: '회의록',
        authorId: 2,
        authorName: '김민수',
        authorDept: '컴퓨터공학과',
        title: '1주차 주제 선정 및 역할 분담 회의록',
        content: '백엔드 API 설계와 프론트엔드 타임테이블 컴포넌트를 각각 분담하여 진행합니다.',
        createdAt: '2026-03-12 13:00'
      }
    ]
  }
];

const SEED_USER_FEEDBACKS = [
  {
    id: 9001,
    userId: 2,
    department: '컴퓨터공학과',
    studentId: '261',
    authorName: '김민수',
    title: '여름/겨울 계절학기 시간표 색상 테마 추가 건의',
    content: '계절학기 과목을 등록할 때 구분하기 쉽도록 파스텔 민트 외에 추가 색상을 선택할 수 있으면 좋겠습니다!',
    status: '검토 완료',
    adminReply: '좋은 의견 감사합니다! 다음 업데이트에 커스텀 색상 팔레트 기능을 반영하겠습니다.',
    createdAt: '2026-03-11 14:20',
    repliedAt: '2026-03-11 16:05'
  },
  {
    id: 9002,
    userId: 4,
    department: '컴퓨터공학과',
    studentId: '263',
    authorName: '이서연',
    title: '성적 예측 기능에서 퀴즈 항목 기본 비율 조정 건의',
    content: '과목별로 퀴즈가 2번 이상 있는 경우가 많아서 시험 항목 추가 시 기본 반영비율이 10%로 들어가면 편리할 것 같아요.',
    status: '검토 중',
    adminReply: '',
    createdAt: '2026-03-12 10:15',
    repliedAt: null
  }
];

const getDefaultApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  }
  return '';
};

export default function App() {
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_accounts_v6');
      return saved ? JSON.parse(saved) : SEED_ACCOUNTS;
    } catch {
      return SEED_ACCOUNTS;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_current_user_v6');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('seoultech_auth_token_v6') || '';
    } catch {
      return '';
    }
  });

  const [serverConfig, setServerConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_server_config_v6');
      return saved ? JSON.parse(saved) : { apiUrl: getDefaultApiUrl() };
    } catch {
      return { apiUrl: getDefaultApiUrl() };
    }
  });

  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  // <조건 4, 5> 상단 이름·학번·학과 클릭 시 열리는 개인정보 수정 팝업 모달 상태
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);

  // <조건 3> 각 박스를 접거나 펼칠 수 있는 'v' 버튼 상태 관리
  const [collapsedBoxes, setCollapsedBoxes] = useState({});
  const toggleBoxCollapse = (boxKey) => {
    setCollapsedBoxes((prev) => ({
      ...prev,
      [boxKey]: !prev[boxKey]
    }));
  };

  const [authMode, setAuthMode] = useState('LOGIN');
  // 보안 강화: 초기 실행 시 학과의 '컴퓨터공학과'만 기본 입력하고, 학번과 이름은 빈 문자열로 설정
  const [authForm, setAuthForm] = useState({
    department: '컴퓨터공학과',
    studentId: '',
    name: '',
    autoLogin: true
  });

  const [coursesByStudent, setCoursesByStudent] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_courses_by_student_v6');
      return saved ? JSON.parse(saved) : SEED_COURSES_BY_STUDENT;
    } catch {
      return SEED_COURSES_BY_STUDENT;
    }
  });

  // <조건 1 ~ 7> 기타 활동(Custom Activity) 상태 및 사용자 정의 카테고리 상태
  const [activitiesByStudent, setActivitiesByStudent] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_activities_by_student_v6');
      return saved ? JSON.parse(saved) : SEED_ACTIVITIES_BY_STUDENT;
    } catch {
      return SEED_ACTIVITIES_BY_STUDENT;
    }
  });

  const [activityCategoriesByStudent, setActivityCategoriesByStudent] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_activity_categories_v5');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [selectedActivityCategoryFilter, setSelectedActivityCategoryFilter] = useState('ALL');
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [activityForm, setActivityForm] = useState({
    title: '',
    category: '동아리/스터디',
    description: '',
    link: '',
    startDate: '2026-03-02',
    endDate: '2026-06-21',
    color: '#FFE699',
    isPrivate: false,
    schedules: [{ day: '수', startTime: '15:00', endTime: '16:30' }]
  });

  // <조건 4, 6> 타임테이블 하단 강의/기타 활동 표시 체크박스 및 기준 날짜(기간 필터링용)
  const [showCoursesOnTimetable, setShowCoursesOnTimetable] = useState(true);
  const [showActivitiesOnTimetable, setShowActivitiesOnTimetable] = useState(true);
  const [timetableReferenceDate, setTimetableReferenceDate] = useState('2026-04-15');

  // ADMIN 전용 유저 및 친구 강제 관리용 상태
  const [adminSelectedUserId, setAdminSelectedUserId] = useState(null);
  const [adminFriendAddTargetId, setAdminFriendAddTargetId] = useState('');

  // <피드백 조건 1 ~ 5> 피드백(건의 사항 및 개선점) 상태 및 입력 폼
  const [userFeedbacks, setUserFeedbacks] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_user_feedbacks_v5');
      return saved ? JSON.parse(saved) : SEED_USER_FEEDBACKS;
    } catch {
      return SEED_USER_FEEDBACKS;
    }
  });

  const [feedbackSubmissionForm, setFeedbackSubmissionForm] = useState({
    title: '',
    content: ''
  });

  // ADMIN 전용 피드백 답변 입력 상태 맵 ({ [feedbackId]: { status, adminReply } })
  const [adminFeedbackDrafts, setAdminFeedbackDrafts] = useState({});
  const [adminFeedbackStatusFilter, setAdminFeedbackStatusFilter] = useState('ALL');

  // <그룹 조건 1 ~ 7> 그룹(StudyGroup) 상태 및 그룹 생성/게시판/검색/권한 관리 상태
  const [studyGroups, setStudyGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_study_groups_v5');
      return saved ? JSON.parse(saved) : SEED_STUDY_GROUPS;
    } catch {
      return SEED_STUDY_GROUPS;
    }
  });

  const [selectedGroupId, setSelectedGroupId] = useState(7001);
  const [groupInnerTab, setGroupInnerTab] = useState('BOARD'); // 'BOARD' | 'MEMBERS' | 'ROLES'
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [newGroupCategoryInput, setNewGroupCategoryInput] = useState('');
  const [selectedGroupBoardCategory, setSelectedGroupBoardCategory] = useState('ALL');
  const [groupPostSearchQuery, setGroupPostSearchQuery] = useState('');
  const [editingGroupPostId, setEditingGroupPostId] = useState(null);
  const [groupPostForm, setGroupPostForm] = useState({
    category: '자유게시판',
    title: '',
    content: ''
  });
  // 그룹원 목록에서 간단하게 바로 메시지 보내기용 인라인 입력 상태 ({ [userId]: '메시지' })
  const [quickMemberMessageMap, setQuickMemberMessageMap] = useState({});

  // <졸업요건 조건 1, 2, 3> 학번·재학생/편입생별 졸업요건 및 EPiC folio(이수 완료 / 이수 희망) 관리 상태
  const [graduationByStudent, setGraduationByStudent] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_graduation_by_student_v5');
      return saved ? JSON.parse(saved) : SEED_GRADUATION_BY_STUDENT;
    } catch {
      return SEED_GRADUATION_BY_STUDENT;
    }
  });

  const [epicCatalogFilter, setEpicCatalogFilter] = useState('ALL'); // 'ALL' | '필수 요건' | '선택 요건'
  const [epicCategoryFilter, setEpicCategoryFilter] = useState('ALL');

  // 친구 관계 로컬 동기화 상태 (백엔드 미연결 시에도 100% 동작 보장)
  const [friendships, setFriendships] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_friendships_v5');
      return saved
        ? JSON.parse(saved)
        : [
            { id: 1, requesterId: 1, receiverId: 2, status: 'ACCEPTED' },
            { id: 2, requesterId: 4, receiverId: 1, status: 'PENDING' }
          ];
    } catch {
      return [
        { id: 1, requesterId: 1, receiverId: 2, status: 'ACCEPTED' },
        { id: 2, requesterId: 4, receiverId: 1, status: 'PENDING' }
      ];
    }
  });

  // 친구 메시지 및 시간별 활동 제안 상태
  const [interactions, setInteractions] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_interactions_v5');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 1,
              senderId: 2,
              receiverId: 1,
              type: 'PROPOSAL',
              content: '월요일 점심 같이 학식 먹자!',
              day: '월',
              startTime: '12:00',
              endTime: '13:00',
              status: 'PENDING',
              createdAt: '2026-03-10 11:20'
            }
          ];
    } catch {
      return [];
    }
  });

  const [mainView, setMainView] = useState('TIMETABLE');
  const [activeToolCategory, setActiveToolCategory] = useState('COURSE');
  const [friendSubTab, setFriendSubTab] = useState('LIST'); // 'LIST' | 'REQUESTS' | 'ADD'

  // 친구 기능 전용 상태들
  const [friendSearchForm, setFriendSearchForm] = useState({
    department: '컴퓨터공학과',
    name: ''
  });
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [hasSearchedFriend, setHasSearchedFriend] = useState(false);
  const [selectedFriendForModal, setSelectedFriendForModal] = useState(null);
  const [myStatusDraft, setMyStatusDraft] = useState('');

  // 친구 타임테이블 모달 내부: 메시지 & 시간별 활동 제안 상태
  const [messageInput, setMessageInput] = useState('');
  const [proposalDraft, setProposalDraft] = useState({
    isOpen: false,
    day: '월',
    startTime: '12:00',
    endTime: '13:00',
    content: ''
  });

  // <조건 1 ~ 6> 성적 예측(Grade Prediction) 전용 상태 및 저장소
  const [predictionsByStudent, setPredictionsByStudent] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_predictions_v5');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [editingPredictionId, setEditingPredictionId] = useState(null);
  const [predictionForm, setPredictionForm] = useState({
    courseName: '운영체제',
    credits: 3,
    totalStudents: 50, // <조건 4> default 50명
    evaluationItems: DEFAULT_EVALUATION_ITEMS,
    gradeCutoffs: DEFAULT_GRADE_CUTOFFS
  });

  const [editingId, setEditingId] = useState(null);
  const [courseForm, setCourseForm] = useState({
    year: 2026,
    semester: '1학기',
    courseName: '',
    credits: 3,
    grade: '현재 이수 중',
    isRetake: false,
    isWithdrawn: false,
    schedules: [{ day: '월', startTime: '09:00', endTime: '10:30' }]
  });

  const [profileForm, setProfileForm] = useState({
    department: '컴퓨터공학과',
    studentId: '',
    name: '',
    statusMessage: '',
    preferredMainView: 'TIMETABLE',
    currentYear: 2026,
    currentSemester: '1학기'
  });

  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev.message === message ? { type: '', message: '' } : prev));
    }, 4000);
  };

  useEffect(() => {
    localStorage.setItem('seoultech_accounts_v6', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('seoultech_courses_by_student_v6', JSON.stringify(coursesByStudent));
  }, [coursesByStudent]);

  useEffect(() => {
    localStorage.setItem('seoultech_friendships_v5', JSON.stringify(friendships));
  }, [friendships]);

  useEffect(() => {
    localStorage.setItem('seoultech_interactions_v5', JSON.stringify(interactions));
  }, [interactions]);

  useEffect(() => {
    localStorage.setItem('seoultech_predictions_v5', JSON.stringify(predictionsByStudent));
  }, [predictionsByStudent]);

  useEffect(() => {
    localStorage.setItem('seoultech_activities_by_student_v6', JSON.stringify(activitiesByStudent));
  }, [activitiesByStudent]);

  useEffect(() => {
    localStorage.setItem(
      'seoultech_activity_categories_v5',
      JSON.stringify(activityCategoriesByStudent)
    );
  }, [activityCategoriesByStudent]);

  useEffect(() => {
    localStorage.setItem('seoultech_user_feedbacks_v5', JSON.stringify(userFeedbacks));
  }, [userFeedbacks]);

  useEffect(() => {
    localStorage.setItem('seoultech_study_groups_v5', JSON.stringify(studyGroups));
  }, [studyGroups]);

  useEffect(() => {
    localStorage.setItem(
      'seoultech_graduation_by_student_v5',
      JSON.stringify(graduationByStudent)
    );
  }, [graduationByStudent]);

  useEffect(() => {
    localStorage.setItem('seoultech_server_config_v5', JSON.stringify(serverConfig));
  }, [serverConfig]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('seoultech_current_user_v6', JSON.stringify(currentUser));
      setProfileForm({
        department: currentUser.department || '컴퓨터공학과',
        studentId: currentUser.studentId || '',
        name: currentUser.name || '',
        statusMessage: currentUser.statusMessage || '',
        preferredMainView: currentUser.preferredMainView || 'TIMETABLE',
        currentYear: currentUser.currentYear || 2026,
        currentSemester: currentUser.currentSemester || '1학기'
      });
      setMyStatusDraft(currentUser.statusMessage || '');
    } else {
      localStorage.removeItem('seoultech_current_user_v6');
    }
  }, [currentUser]);

  // 백엔드 서버 헬스 체크 및 초기 데이터 동기화
  useEffect(() => {
    const syncFromBackend = async () => {
      const base = (serverConfig.apiUrl || '').replace(/\/$/, '');
      if (!base) {
        setIsServerConnected(false);
        return;
      }
      try {
        const res = await fetch(`${base}/health`);
        if (res.ok) {
          setIsServerConnected(true);
        } else {
          setIsServerConnected(false);
        }
      } catch {
        setIsServerConnected(false);
      }
    };
    syncFromBackend();
  }, [serverConfig.apiUrl, authToken]);

  // <피드백 조건 2, 3> 건의 사항 및 개선점 제출 핸들러
  const handleSubmitUserFeedback = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmedTitle = feedbackSubmissionForm.title.trim();
    const trimmedContent = feedbackSubmissionForm.content.trim();

    if (!trimmedTitle) {
      showToast('error', '피드백(건의 사항) 제목을 입력해 주세요.');
      return;
    }
    if (!trimmedContent) {
      showToast('error', '건의 사항이나 개선점 내용을 입력해 주세요.');
      return;
    }

    const nowStr = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newFeedbackItem = {
      id: Date.now(),
      userId: currentUser.id,
      department: currentUser.department,
      studentId: currentUser.studentId,
      authorName: currentUser.name,
      title: trimmedTitle,
      content: trimmedContent,
      status: '제출 완료',
      adminReply: '',
      createdAt: nowStr,
      repliedAt: null
    };

    const base = (serverConfig.apiUrl || '').replace(/\/$/, '');
    if (base && isServerConnected && authToken) {
      try {
        await fetch(`${base}/admin/feedbacks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            title: trimmedTitle,
            content: trimmedContent
          })
        });
      } catch {
        // 로컬 저장소와 동기화
      }
    }

    setUserFeedbacks((prev) => [newFeedbackItem, ...prev]);
    setFeedbackSubmissionForm({ title: '', content: '' });
    showToast(
      'success',
      '건의 사항이 서버에 제출되었습니다! (현재 진행 상태: 제출 완료)'
    );
  };

  // =========================================================================
  // <그룹 기능 조건 1 ~ 7> 핸들러 모음
  // =========================================================================

  // 현재 선택된 그룹 객체
  const activeGroup = useMemo(() => {
    if (!studyGroups.length) return null;
    return studyGroups.find((g) => g.id === selectedGroupId) || studyGroups[0];
  }, [studyGroups, selectedGroupId]);

  // 현재 선택된 그룹에서 나의 멤버십/권한 정보
  const myMembershipInActiveGroup = useMemo(() => {
    if (!activeGroup || !currentUser) return null;
    return (activeGroup.members || []).find((m) => m.userId === currentUser.id) || null;
  }, [activeGroup, currentUser]);

  // <조건 1, 2> 새 그룹 생성 (생성한 유저가 그룹 최고 관리자 OWNER가 됨)
  const handleCreateStudyGroup = (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmedName = groupForm.name.trim();
    if (!trimmedName) {
      showToast('error', '생성할 그룹 이름을 입력해 주세요.');
      return;
    }

    const newGroup = {
      id: Date.now(),
      name: trimmedName,
      description: groupForm.description.trim() || '함께 공부하고 정보를 나누는 그룹입니다.',
      isPrivate: Boolean(groupForm.isPrivate),
      ownerId: currentUser.id,
      boardCategories: ['공지사항', '자유게시판', '질문/답변', '자료실'],
      members: [
        {
          userId: currentUser.id,
          role: 'OWNER',
          status: 'ACTIVE',
          canRead: true,
          canWrite: true,
          canManageRoles: true
        }
      ],
      posts: []
    };

    setStudyGroups((prev) => [newGroup, ...prev]);
    setSelectedGroupId(newGroup.id);
    setGroupInnerTab('BOARD');
    setGroupForm({ name: '', description: '', isPrivate: false });
    showToast(
      'success',
      `'${trimmedName}' (${newGroup.isPrivate ? '비공개·승인제' : '공개·즉시가입'}) 그룹이 생성되었으며 최고 관리자가 되었습니다!`
    );
  };

  // <조건 2> 그룹 가입 신청 (공개 그룹은 허락 없이 즉시 가입, 비공개 그룹은 승인 대기)
  const handleJoinStudyGroup = (group) => {
    if (!currentUser) return;
    const existing = (group.members || []).find((m) => m.userId === currentUser.id);
    if (existing) {
      showToast(
        'error',
        existing.status === 'ACTIVE'
          ? '이미 가입된 그룹입니다.'
          : '현재 비공개 그룹 가입 승인 대기 중입니다.'
      );
      return;
    }

    const nextStatus = group.isPrivate ? 'PENDING' : 'ACTIVE';
    const newMemberEntry = {
      userId: currentUser.id,
      role: 'MEMBER',
      status: nextStatus,
      canRead: true,
      canWrite: true,
      canManageRoles: false
    };

    setStudyGroups((prev) =>
      prev.map((g) =>
        g.id === group.id ? { ...g, members: [...(g.members || []), newMemberEntry] } : g
      )
    );
    setSelectedGroupId(group.id);

    showToast(
      'success',
      group.isPrivate
        ? `'${group.name}' 비공개 그룹에 가입 신청을 보냈습니다. 관리자 승인 후 활동할 수 있습니다.`
        : `'${group.name}' 공개 그룹에 즉시 가입되었습니다!`
    );
  };

  // <조건 1, 2, 6> 비공개 그룹 가입 승인/거절 및 그룹원 추방/탈퇴 (인원이 0명이 되면 그룹 자동 삭제)
  const handleGroupMemberStatusAction = (groupId, targetUserId, action) => {
    if (!currentUser) return;
    let autoDeletedGroupName = null;

    setStudyGroups((prev) => {
      const updatedList = prev
        .map((g) => {
          if (g.id !== groupId) return g;

          if (action === 'APPROVE') {
            return {
              ...g,
              members: (g.members || []).map((m) =>
                m.userId === targetUserId ? { ...m, status: 'ACTIVE' } : m
              )
            };
          }

          // 거절, 강제 퇴장 또는 탈퇴
          const remainingMembers = (g.members || []).filter((m) => m.userId !== targetUserId);
          const activeMembers = remainingMembers.filter((m) => m.status === 'ACTIVE');

          // <조건 6> 그룹 활성 인원이 0명일 때 그 그룹은 자동으로 삭제됨
          if (activeMembers.length === 0) {
            autoDeletedGroupName = g.name;
            return null;
          }

          // 만약 최고 관리자(OWNER)가 나갔는데 남은 활성 멤버가 있다면 첫 번째 멤버에게 최고 관리자 승계
          const hasOwner = activeMembers.some((m) => m.role === 'OWNER');
          let finalMembers = remainingMembers;
          let nextOwnerId = g.ownerId;
          if (!hasOwner && activeMembers.length > 0) {
            nextOwnerId = activeMembers[0].userId;
            finalMembers = remainingMembers.map((m) =>
              m.userId === nextOwnerId
                ? {
                    ...m,
                    role: 'OWNER',
                    canRead: true,
                    canWrite: true,
                    canManageRoles: true
                  }
                : m
            );
          }

          return {
            ...g,
            ownerId: nextOwnerId,
            members: finalMembers
          };
        })
        .filter(Boolean);

      return updatedList;
    });

    if (autoDeletedGroupName) {
      showToast(
        'success',
        `'${autoDeletedGroupName}' 그룹의 인원이 0명이 되어 그룹이 자동으로 삭제되었습니다.`
      );
    } else if (action === 'APPROVE') {
      showToast('success', '비공개 그룹 가입 신청을 승인했습니다!');
    } else if (Number(targetUserId) === Number(currentUser.id)) {
      showToast('success', '그룹에서 탈퇴했습니다.');
    } else {
      showToast('success', '해당 그룹원 상태를 변경했습니다.');
    }
  };

  // <조건 5> 그룹 권한 임명 (게시글 쓰기 권한, 보기 권한, 권한 임명 권한, 최고관리자 위임)
  const handleUpdateGroupMemberPermission = (groupId, targetUserId, field, value) => {
    setStudyGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;

        if (field === 'MAKE_OWNER') {
          return {
            ...g,
            ownerId: targetUserId,
            members: (g.members || []).map((m) => {
              if (m.userId === targetUserId) {
                return {
                  ...m,
                  role: 'OWNER',
                  canRead: true,
                  canWrite: true,
                  canManageRoles: true
                };
              }
              if (m.role === 'OWNER') {
                return { ...m, role: 'MANAGER' };
              }
              return m;
            })
          };
        }

        return {
          ...g,
          members: (g.members || []).map((m) => {
            if (m.userId !== targetUserId) return m;
            const updated = { ...m, [field]: value };
            if (field === 'canManageRoles' && value === true && updated.role === 'MEMBER') {
              updated.role = 'MANAGER';
            }
            if (field === 'canManageRoles' && value === false && updated.role === 'MANAGER') {
              updated.role = 'MEMBER';
            }
            return updated;
          })
        };
      })
    );
    showToast('success', '그룹원의 세부 권한 설정이 즉시 반영되었습니다.');
  };

  // <조건 3> 그룹 게시판 카테고리 추가
  const handleAddGroupBoardCategory = () => {
    if (!activeGroup) return;
    const trimmed = newGroupCategoryInput.trim();
    if (!trimmed) {
      showToast('error', '추가할 게시판 카테고리 이름을 입력해 주세요.');
      return;
    }
    if ((activeGroup.boardCategories || []).includes(trimmed)) {
      showToast('error', '이미 존재하는 게시판 카테고리입니다.');
      return;
    }

    setStudyGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroup.id
          ? { ...g, boardCategories: [...(g.boardCategories || []), trimmed] }
          : g
      )
    );
    setGroupPostForm((prev) => ({ ...prev, category: trimmed }));
    setNewGroupCategoryInput('');
    showToast('success', `'${trimmed}' 게시판 카테고리가 추가되었습니다.`);
  };

  // <조건 3, 4, 5> 그룹 게시글 작성 및 수정 (그룹 최고 관리자는 모든 게시글 수정 가능)
  const handleSaveGroupPost = (e) => {
    e.preventDefault();
    if (!activeGroup || !currentUser) return;

    const isSystemAdmin = currentUser.role === 'ADMIN';
    const isGroupOwner = myMembershipInActiveGroup?.role === 'OWNER';
    const canWritePost =
      isSystemAdmin ||
      isGroupOwner ||
      (myMembershipInActiveGroup?.status === 'ACTIVE' && myMembershipInActiveGroup?.canWrite);

    if (!canWritePost) {
      showToast('error', '현재 이 그룹 게시판의 게시글 쓰기 권한이 없습니다.');
      return;
    }

    const trimmedTitle = groupPostForm.title.trim();
    const trimmedContent = groupPostForm.content.trim();
    if (!trimmedTitle || !trimmedContent) {
      showToast('error', '게시글 제목과 내용을 모두 입력해 주세요.');
      return;
    }

    const nowStr = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (editingGroupPostId) {
      setStudyGroups((prev) =>
        prev.map((g) => {
          if (g.id !== activeGroup.id) return g;
          return {
            ...g,
            posts: (g.posts || []).map((p) =>
              p.id === editingGroupPostId
                ? {
                    ...p,
                    category: groupPostForm.category || '자유게시판',
                    title: trimmedTitle,
                    content: trimmedContent
                  }
                : p
            )
          };
        })
      );
      setEditingGroupPostId(null);
      showToast('success', '그룹 게시글이 수정되었습니다.');
    } else {
      const newPost = {
        id: Date.now(),
        category: groupPostForm.category || activeGroup.boardCategories?.[0] || '자유게시판',
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorDept: currentUser.department,
        title: trimmedTitle,
        content: trimmedContent,
        createdAt: nowStr
      };

      setStudyGroups((prev) =>
        prev.map((g) =>
          g.id === activeGroup.id ? { ...g, posts: [newPost, ...(g.posts || [])] } : g
        )
      );
      showToast('success', '그룹 게시판에 새 게시글이 등록되었습니다!');
    }

    setGroupPostForm({
      category: activeGroup.boardCategories?.[0] || '자유게시판',
      title: '',
      content: ''
    });
  };

  // <조건 4> 그룹 게시글 삭제 (작성자 본인 또는 그룹 최고 관리자 OWNER는 모든 게시글 삭제 가능)
  const handleDeleteGroupPost = (postId) => {
    if (!activeGroup) return;
    setStudyGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroup.id
          ? { ...g, posts: (g.posts || []).filter((p) => p.id !== postId) }
          : g
      )
    );
    if (editingGroupPostId === postId) {
      setEditingGroupPostId(null);
    }
    showToast('success', '게시글이 삭제되었습니다.');
  };

  // <조건 7> 그룹원 목록에서 간단하게 메시지 바로 전송
  const handleSendQuickMessageToGroupMember = (targetUser) => {
    if (!currentUser || !targetUser) return;
    const text = String(quickMemberMessageMap[targetUser.id] || '').trim();
    if (!text) {
      showToast('error', `${targetUser.name}님에게 보낼 메시지를 입력해 주세요.`);
      return;
    }

    const newMsg = {
      id: Date.now(),
      senderId: currentUser.id,
      receiverId: targetUser.id,
      type: 'MESSAGE',
      content: `[그룹: ${activeGroup?.name || '그룹'}] ${text}`,
      day: null,
      startTime: null,
      endTime: null,
      status: 'UNREAD',
      createdAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setInteractions((prev) => [newMsg, ...prev]);
    setQuickMemberMessageMap((prev) => ({ ...prev, [targetUser.id]: '' }));
    showToast('success', `그룹원 ${targetUser.name}님에게 메시지를 전송했습니다!`);
  };

  // =========================================================================
  // <졸업요건 기능 조건 1, 2, 3> 학번·재학생/편입생 자동 판별 및 EPiC folio 원클릭 핸들러
  // =========================================================================
  const myGraduationData = useMemo(() => {
    if (!currentUser) {
      return {
        admissionType: 'REGULAR',
        selectedEpicItems: []
      };
    }
    return (
      graduationByStudent[currentUser.studentId] || {
        admissionType: 'REGULAR',
        selectedEpicItems: []
      }
    );
  }, [graduationByStudent, currentUser]);

  const updateMyGraduationData = (updater) => {
    if (!currentUser) return;
    setGraduationByStudent((prev) => {
      const currentObj = prev[currentUser.studentId] || {
        admissionType: 'REGULAR',
        selectedEpicItems: []
      };
      const nextObj = typeof updater === 'function' ? updater(currentObj) : updater;
      return {
        ...prev,
        [currentUser.studentId]: nextObj
      };
    });
  };

  // <조건 1> 사용자가 입력한 개인정보(학번 맨앞 2자리 입학년도) 및 재학생/편입생 여부에 따라 졸업 기준 학점과 EPiC folio 기준 점수 자동 계산
  const graduationStandardsAndProgress = useMemo(() => {
    const sid = String(currentUser?.studentId || '').trim();
    const prefix2 = parseInt(sid.slice(0, 2), 10);
    const entryYear = !Number.isNaN(prefix2)
      ? prefix2 >= 80
        ? 1900 + prefix2
        : 2000 + prefix2
      : 2026;

    const admissionType = myGraduationData.admissionType || 'REGULAR';

    // 서울과기대 입학년도별 총 졸업 기준 학점 자동 적용
    // 2020학번 이전: 140학점 / 2021~2022학번: 136학점 / 2023학번 이후: 132학점
    let requiredTotalCredits = 132;
    if (entryYear <= 2020) {
      requiredTotalCredits = 140;
    } else if (entryYear <= 2022) {
      requiredTotalCredits = 136;
    }

    // 서울과기대 재학생(신입학) / 편입생별 EPiC folio 졸업인증 기준 점수
    // 신입학(재학생): 700점 (2020학번 이전 600점) / 편입생: 50% 감면 (350점 / 300점)
    const baseEpic = entryYear <= 2020 ? 600 : 700;
    const requiredEpicScore =
      admissionType === 'TRANSFER' ? Math.round(baseEpic * 0.5) : baseEpic;

    const items = myGraduationData.selectedEpicItems || [];
    const completedItems = items.filter((it) => it.status === 'COMPLETED');
    const wishItems = items.filter((it) => it.status === 'WISH');

    const currentEpicScore = completedItems.reduce(
      (sum, it) => sum + (Number(it.points) || 0),
      0
    );
    const wishEpicScore = wishItems.reduce(
      (sum, it) => sum + (Number(it.points) || 0),
      0
    );
    // <조건 2> 이수하고 싶은 활동(WISH)까지 모두 이수했을 때의 예상 총 EPiC folio 점수
    const projectedEpicScore = currentEpicScore + wishEpicScore;

    const completedMandatoryCount = completedItems.filter(
      (it) => it.reqType === '필수 요건'
    ).length;
    const projectedMandatoryCount = items.filter(
      (it) => it.reqType === '필수 요건'
    ).length;

    return {
      entryYear,
      studentYearPrefix: sid.slice(0, 2) || '26',
      admissionType,
      requiredTotalCredits,
      requiredEpicScore,
      currentEpicScore,
      wishEpicScore,
      projectedEpicScore,
      completedItems,
      wishItems,
      completedMandatoryCount,
      projectedMandatoryCount
    };
  }, [currentUser, myGraduationData]);

  // 재학생(신입학) <-> 편입생 전환 핸들러 (<조건 1>)
  const handleChangeAdmissionType = (nextType) => {
    updateMyGraduationData((prev) => ({
      ...prev,
      admissionType: nextType
    }));
    showToast(
      'success',
      nextType === 'TRANSFER'
        ? '입학 유형이 [편입생]으로 설정되어 EPiC folio 기준 점수가 편입생 감면 기준으로 자동 조정되었습니다.'
        : '입학 유형이 [신입학 재학생]으로 설정되어 학번 기준 졸업요건이 적용되었습니다.'
    );
  };

  // <조건 2> 공식 EPiC folio 카탈로그에서 클릭 한 번으로 [이수 완료] 또는 [이수 희망]으로 등록/변경/삭제
  const handleToggleEpicCatalogItem = (catalogItem, targetStatus) => {
    const existing = (myGraduationData.selectedEpicItems || []).find(
      (it) => it.activityCode === catalogItem.activityCode
    );

    if (existing && existing.status === targetStatus) {
      // 이미 같은 상태로 등록되어 있으면 클릭 시 즉시 삭제(해제)
      updateMyGraduationData((prev) => ({
        ...prev,
        selectedEpicItems: (prev.selectedEpicItems || []).filter(
          (it) => it.activityCode !== catalogItem.activityCode
        )
      }));
      showToast('success', `'${catalogItem.title}' 활동을 목록에서 삭제했습니다.`);
      return;
    }

    const newItem = {
      activityCode: catalogItem.activityCode,
      title: catalogItem.title,
      reqType: catalogItem.reqType,
      points: catalogItem.points,
      category: catalogItem.category,
      scheduleDate: catalogItem.scheduleDate,
      officialUrl: catalogItem.officialUrl,
      status: targetStatus // 'COMPLETED' | 'WISH'
    };

    updateMyGraduationData((prev) => {
      const filtered = (prev.selectedEpicItems || []).filter(
        (it) => it.activityCode !== catalogItem.activityCode
      );
      return {
        ...prev,
        selectedEpicItems: [newItem, ...filtered]
      };
    });

    showToast(
      'success',
      targetStatus === 'COMPLETED'
        ? `✅ '${catalogItem.title}' (+${catalogItem.points}점) 활동이 [이수 완료]로 등록되었습니다!`
        : `✨ '${catalogItem.title}' (+${catalogItem.points}점) 활동이 [이수 희망]에 추가되어 예상 점수에 반영되었습니다!`
    );
  };

  const handleRemoveEpicItem = (activityCode, title) => {
    updateMyGraduationData((prev) => ({
      ...prev,
      selectedEpicItems: (prev.selectedEpicItems || []).filter(
        (it) => it.activityCode !== activityCode
      )
    }));
    showToast('success', `'${title}' 활동이 삭제되었습니다.`);
  };

  const courses = useMemo(() => {
    if (!currentUser) return [];
    return coursesByStudent[currentUser.studentId] || [];
  }, [coursesByStudent, currentUser]);

  const myActivities = useMemo(() => {
    if (!currentUser) return [];
    return activitiesByStudent[currentUser.studentId] || [];
  }, [activitiesByStudent, currentUser]);

  const myActivityCategories = useMemo(() => {
    if (!currentUser) return ['동아리/스터디', '대외활동/공모전', '아르바이트', '개인 일정'];
    const customList = activityCategoriesByStudent[currentUser.studentId];
    if (Array.isArray(customList) && customList.length > 0) {
      return customList;
    }
    return ['동아리/스터디', '대외활동/공모전', '아르바이트', '개인 일정'];
  }, [activityCategoriesByStudent, currentUser]);

  const savedPredictions = useMemo(() => {
    if (!currentUser) return [];
    return predictionsByStudent[currentUser.studentId] || [];
  }, [predictionsByStudent, currentUser]);

  // <조건 2, 3, 4, 5> 실시간 성적 예측 계산 엔진
  const livePredictionCalculation = useMemo(() => {
    const numStudents = Math.max(1, Number(predictionForm.totalStudents) || 50);
    let totalWeightedScore = 0;
    let totalWeightSum = 0;

    let examWeightedZSum = 0;
    let examWeightForZ = 0;
    let examNormalizedSum = 0;
    let examWeightTotal = 0;
    const examDetails = [];

    (predictionForm.evaluationItems || []).forEach((item) => {
      const score = Number(item.score) || 0;
      const maxScore = Math.max(1, Number(item.maxScore) || 100);
      const weight = Math.max(0, Number(item.weight) || 0);
      const ratio = Math.min(1, Math.max(0, score / maxScore));

      totalWeightedScore += ratio * weight;
      totalWeightSum += weight;

      if (item.category === 'EXAM') {
        examNormalizedSum += ratio * weight;
        examWeightTotal += weight;

        const hasMean =
          item.mean !== undefined && item.mean !== null && String(item.mean).trim() !== '';
        const hasStd =
          item.stdDev !== undefined && item.stdDev !== null && String(item.stdDev).trim() !== '';
        const meanVal = Number(item.mean);
        const stdVal = Number(item.stdDev);

        if (
          hasMean &&
          hasStd &&
          !Number.isNaN(meanVal) &&
          !Number.isNaN(stdVal) &&
          stdVal > 0 &&
          weight > 0
        ) {
          const z = (score - meanVal) / stdVal;
          const itemTopPct = Math.min(
            99.9,
            Math.max(0.1, Math.round((1 - standardNormalCDF(z)) * 10000) / 100)
          );
          examWeightedZSum += z * weight;
          examWeightForZ += weight;
          examDetails.push({
            label: item.label,
            zScore: z.toFixed(2),
            topPercentile: itemTopPct
          });
        }
      }
    });

    const calculatedTotalScore = Math.round(totalWeightedScore * 100) / 100;

    // <조건 5> 시험 평균과 표준편차를 사용자가 제공할 시 사용자의 예상 백분위를 시험 성적만으로 계산
    let examOnlyTopPercentile = null;
    let usedExamStat = false;
    let compositeZScore = null;

    if (examWeightForZ > 0) {
      usedExamStat = true;
      const compositeZ = examWeightedZSum / examWeightForZ;
      compositeZScore = compositeZ.toFixed(2);
      const cumulativeProb = standardNormalCDF(compositeZ);
      const topPercent = (1 - cumulativeProb) * 100;
      examOnlyTopPercentile = Math.min(
        99.9,
        Math.max(0.1, Math.round(topPercent * 100) / 100)
      );
    } else if (examWeightTotal > 0) {
      const examRate = (examNormalizedSum / examWeightTotal) * 100;
      examOnlyTopPercentile = Math.min(
        99.9,
        Math.max(0.1, Math.round((100 - examRate * 0.9) * 100) / 100)
      );
    } else {
      const overallRate =
        totalWeightSum > 0 ? (totalWeightedScore / totalWeightSum) * 100 : 0;
      examOnlyTopPercentile = Math.min(
        99.9,
        Math.max(0.1, Math.round((100 - overallRate * 0.9) * 100) / 100)
      );
    }

    const estimatedRank = Math.max(
      1,
      Math.min(numStudents, Math.round((examOnlyTopPercentile / 100) * numStudents))
    );

    const orderedGrades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D'];
    let predictedGrade = 'F';
    for (const g of orderedGrades) {
      const limit = Number(predictionForm.gradeCutoffs?.[g]);
      if (!Number.isNaN(limit) && examOnlyTopPercentile <= limit) {
        predictedGrade = g;
        break;
      }
    }

    return {
      calculatedTotalScore,
      totalWeightSum,
      examOnlyTopPercentile,
      usedExamStat,
      compositeZScore,
      examDetails,
      estimatedRank,
      totalStudents: numStudents,
      predictedGrade,
      predictedGradePoint: GRADE_POINTS[predictedGrade] ?? 0.0
    };
  }, [predictionForm]);

  const updateCurrentUserCourses = (updater) => {
    if (!currentUser) return;
    setCoursesByStudent((prev) => {
      const currentList = prev[currentUser.studentId] || [];
      const nextList = typeof updater === 'function' ? updater(currentList) : updater;
      return {
        ...prev,
        [currentUser.studentId]: nextList
      };
    });
  };

  // 학과+이름 동명이인 계산 맵 (<조건 3>)
  const duplicateDeptNameCountMap = useMemo(() => {
    const map = {};
    accounts.forEach((acc) => {
      const key = `${acc.department.trim()}__${acc.name.trim()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [accounts]);

  const formatUserWithDuplicateMask = (acc) => {
    if (!acc) return null;
    const key = `${acc.department.trim()}__${acc.name.trim()}`;
    const hasDuplicate = (duplicateDeptNameCountMap[key] || 0) >= 2;
    return {
      ...acc,
      hasDuplicateSameName: hasDuplicate,
      maskedStudentId: hasDuplicate ? maskStudentIdFront2Back3(acc.studentId) : null
    };
  };

  // 내 친구 목록, 받은 신청, 보낸 신청 계산
  const friendData = useMemo(() => {
    if (!currentUser) {
      return { myFriends: [], incomingRequests: [], outgoingRequests: [] };
    }
    const myId = currentUser.id;
    const myFriends = [];
    const incomingRequests = [];
    const outgoingRequests = [];

    friendships.forEach((rel) => {
      if (rel.status === 'ACCEPTED') {
        const friendId =
          rel.requesterId === myId
            ? rel.receiverId
            : rel.receiverId === myId
            ? rel.requesterId
            : null;
        if (friendId) {
          const found = accounts.find((a) => a.id === friendId);
          if (found) {
            myFriends.push({
              friendshipId: rel.id,
              ...formatUserWithDuplicateMask(found)
            });
          }
        }
      } else if (rel.status === 'PENDING') {
        if (rel.receiverId === myId) {
          const reqUser = accounts.find((a) => a.id === rel.requesterId);
          if (reqUser) {
            incomingRequests.push({
              friendshipId: rel.id,
              requester: formatUserWithDuplicateMask(reqUser)
            });
          }
        } else if (rel.requesterId === myId) {
          const recUser = accounts.find((a) => a.id === rel.receiverId);
          if (recUser) {
            outgoingRequests.push({
              friendshipId: rel.id,
              receiver: formatUserWithDuplicateMask(recUser)
            });
          }
        }
      }
    });

    return { myFriends, incomingRequests, outgoingRequests };
  }, [currentUser, friendships, accounts, duplicateDeptNameCountMap]);

  // GPA 자동 계산 엔진
  const academicStats = useMemo(() => {
    let totalWeightedPoints = 0;
    let totalGpaCredits = 0;
    let totalEarnedCredits = 0;
    let currentSemesterCredits = 0;

    const targetYear = Number(currentUser?.currentYear || 2026);
    const targetSem = currentUser?.currentSemester || '1학기';

    courses.forEach((c) => {
      const cr = Number(c.credits) || 0;
      if (!c.isWithdrawn && Number(c.year) === targetYear && c.semester === targetSem) {
        currentSemesterCredits += cr;
      }
    });

    const groupedByName = new Map();
    courses.forEach((c) => {
      if (c.isWithdrawn) return;
      const key = c.courseName.trim().toLowerCase();
      if (!groupedByName.has(key)) groupedByName.set(key, []);
      groupedByName.get(key).push(c);
    });

    const activeRetakeReplacedIds = new Set();

    for (const [, group] of groupedByName.entries()) {
      group.sort((a, b) => {
        if (Number(a.year) !== Number(b.year)) return Number(a.year) - Number(b.year);
        return (SEMESTER_ORDER[a.semester] || 0) - (SEMESTER_ORDER[b.semester] || 0);
      });

      const gradedList = group.filter(
        (c) => c.grade !== '현재 이수 중' && GRADE_POINTS[c.grade] !== undefined
      );

      const effectiveCourse =
        gradedList.length > 0 ? gradedList[gradedList.length - 1] : group[group.length - 1];

      group.forEach((item) => {
        if (group.length > 1 && item.id !== effectiveCourse.id) {
          activeRetakeReplacedIds.add(item.id);
        }
      });

      if (
        effectiveCourse &&
        effectiveCourse.grade !== '현재 이수 중' &&
        GRADE_POINTS[effectiveCourse.grade] !== undefined
      ) {
        const cr = Number(effectiveCourse.credits) || 0;
        const gp = GRADE_POINTS[effectiveCourse.grade];
        totalWeightedPoints += cr * gp;
        totalGpaCredits += cr;
        if (effectiveCourse.grade !== 'F') {
          totalEarnedCredits += cr;
        }
      }
    }

    const gpa =
      totalGpaCredits > 0 ? (totalWeightedPoints / totalGpaCredits).toFixed(2) : '0.00';

    return {
      gpa,
      totalEarnedCredits,
      currentSemesterCredits,
      activeRetakeReplacedIds
    };
  }, [courses, currentUser]);

  // 저장된 성적 예측들을 현재 GPA에 합산했을 때의 예상 총 평점(Simulated GPA)
  const simulatedGpaWithPredictions = useMemo(() => {
    let weightedPoints = 0;
    let totalCr = 0;

    courses.forEach((c) => {
      if (c.isWithdrawn) return;
      if (academicStats?.activeRetakeReplacedIds?.has(c.id)) return;
      if (c.grade !== '현재 이수 중' && GRADE_POINTS[c.grade] !== undefined) {
        const cr = Number(c.credits) || 0;
        weightedPoints += cr * GRADE_POINTS[c.grade];
        totalCr += cr;
      }
    });

    savedPredictions.forEach((p) => {
      const cr = Number(p.credits) || 3;
      const gp = GRADE_POINTS[p.predictedGrade] ?? 0.0;
      weightedPoints += cr * gp;
      totalCr += cr;
    });

    return totalCr > 0 ? (weightedPoints / totalCr).toFixed(2) : '0.00';
  }, [courses, savedPredictions, academicStats]);

  // 현재 학기 시간표 과목 필터링
  const currentTimetableCourses = useMemo(() => {
    const targetYear = Number(currentUser?.currentYear || 2026);
    const targetSem = currentUser?.currentSemester || '1학기';
    return courses.filter(
      (c) => !c.isWithdrawn && Number(c.year) === targetYear && c.semester === targetSem
    );
  }, [courses, currentUser]);

  // <조건 4> 타임테이블에 등록한 기타 활동을 세부정보로 등록한 기간(startDate ~ endDate) 동안만 필터링
  const currentTimetableActivities = useMemo(() => {
    if (!timetableReferenceDate) return myActivities;
    return myActivities.filter((act) => {
      const s = act.startDate || '1900-01-01';
      const e = act.endDate || '2099-12-31';
      return timetableReferenceDate >= s && timetableReferenceDate <= e;
    });
  }, [myActivities, timetableReferenceDate]);

  // 기타 활동 핸들러 (<조건 1 ~ 7>)
  const updateCurrentUserActivities = (updater) => {
    if (!currentUser) return;
    setActivitiesByStudent((prev) => {
      const currentList = prev[currentUser.studentId] || [];
      const nextList = typeof updater === 'function' ? updater(currentList) : updater;
      return {
        ...prev,
        [currentUser.studentId]: nextList
      };
    });
  };

  const handleAddActivityCategory = () => {
    if (!currentUser) return;
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      showToast('error', '추가할 카테고리 이름을 입력해 주세요.');
      return;
    }
    if (myActivityCategories.includes(trimmed)) {
      showToast('error', '이미 존재하는 카테고리입니다.');
      return;
    }
    const updated = [...myActivityCategories, trimmed];
    setActivityCategoriesByStudent((prev) => ({
      ...prev,
      [currentUser.studentId]: updated
    }));
    setActivityForm((prev) => ({ ...prev, category: trimmed }));
    setNewCategoryInput('');
    showToast('success', `'${trimmed}' 카테고리가 추가되었습니다.`);
  };

  const addActivityScheduleSlot = () => {
    setActivityForm((prev) => ({
      ...prev,
      schedules: [...prev.schedules, { day: '금', startTime: '14:00', endTime: '15:30' }]
    }));
  };

  const removeActivityScheduleSlot = (idx) => {
    setActivityForm((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== idx)
    }));
  };

  const updateActivityScheduleSlot = (idx, field, val) => {
    setActivityForm((prev) => {
      const next = [...prev.schedules];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, schedules: next };
    });
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    const trimmedTitle = activityForm.title.trim();
    if (!trimmedTitle) {
      showToast('error', '기타 활동명을 입력해 주세요.');
      return;
    }

    if (activityForm.startDate && activityForm.endDate && activityForm.endDate < activityForm.startDate) {
      showToast('error', '기타 활동 종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }

    for (let i = 0; i < activityForm.schedules.length; i++) {
      const slot = activityForm.schedules[i];
      const sMin = timeToMin(slot.startTime);
      const eMin = timeToMin(slot.endTime);
      if (eMin <= sMin) {
        showToast(
          'error',
          `[시간 설정 오류] ${i + 1}번째 기타 활동 시간(${slot.day}요일)의 종료 시간이 시작 시간보다 빠르거나 같습니다.`
        );
        return;
      }
    }

    const record = {
      id: editingActivityId || Date.now(),
      title: trimmedTitle,
      category: activityForm.category || myActivityCategories[0] || '일반',
      description: activityForm.description.trim(),
      link: activityForm.link.trim(),
      startDate: activityForm.startDate || '2026-03-02',
      endDate: activityForm.endDate || '2026-06-21',
      color:
        activityForm.color ||
        PASTEL_COLORS[(myActivities.length + 2) % PASTEL_COLORS.length],
      isPrivate: Boolean(activityForm.isPrivate),
      schedules: activityForm.schedules
    };

    const base = (serverConfig.apiUrl || '').replace(/\/$/, '');
    if (base && isServerConnected && authToken) {
      try {
        await fetch(`${base}/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify(record)
        });
      } catch {
        // 로컬 저장소와 동기화
      }
    }

    updateCurrentUserActivities((prev) => {
      if (editingActivityId) {
        return prev.map((a) => (a.id === editingActivityId ? record : a));
      }
      return [record, ...prev];
    });

    showToast(
      'success',
      editingActivityId
        ? `'${trimmedTitle}' 기타 활동 세부정보가 수정되었습니다.`
        : `'${trimmedTitle}' 기타 활동이 타임테이블에 등록되었습니다.`
    );

    setEditingActivityId(null);
    setActivityForm({
      title: '',
      category: myActivityCategories[0] || '동아리/스터디',
      description: '',
      link: '',
      startDate: '2026-03-02',
      endDate: '2026-06-21',
      color: '#FFE699',
      isPrivate: false,
      schedules: [{ day: '수', startTime: '15:00', endTime: '16:30' }]
    });
  };

  // <조건 5> 등록한 기타 활동 목록에서 활동명을 클릭해 세부정보 수정
  const startEditActivity = (act) => {
    setEditingActivityId(act.id);
    setActivityForm({
      title: act.title,
      category: act.category || myActivityCategories[0] || '동아리/스터디',
      description: act.description || '',
      link: act.link || '',
      startDate: act.startDate || '2026-03-02',
      endDate: act.endDate || '2026-06-21',
      color: act.color || '#FFE699',
      isPrivate: Boolean(act.isPrivate),
      schedules:
        Array.isArray(act.schedules) && act.schedules.length > 0
          ? act.schedules
          : [{ day: '수', startTime: '15:00', endTime: '16:30' }]
    });
    setMainView('DASHBOARD');
    setActiveToolCategory('ACTIVITY');
  };

  const handleDeleteActivity = (id, title) => {
    updateCurrentUserActivities((prev) => prev.filter((a) => a.id !== id));
    if (editingActivityId === id) setEditingActivityId(null);
    showToast('success', `'${title}' 기타 활동이 삭제되었습니다.`);
  };

  // ADMIN 전용: 유저 강제 삭제 및 유저의 친구 관계 강제 추가/삭제 핸들러
  const handleAdminForceDeleteUser = (targetUser) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    if (targetUser.id === currentUser.id) {
      showToast('error', '현재 로그인 중인 운영자 본인 계정은 삭제할 수 없습니다.');
      return;
    }

    setAccounts((prev) => prev.filter((a) => a.id !== targetUser.id));
    setFriendships((prev) =>
      prev.filter((f) => f.requesterId !== targetUser.id && f.receiverId !== targetUser.id)
    );
    setCoursesByStudent((prev) => {
      const next = { ...prev };
      delete next[targetUser.studentId];
      return next;
    });
    setActivitiesByStudent((prev) => {
      const next = { ...prev };
      delete next[targetUser.studentId];
      return next;
    });
    if (adminSelectedUserId === targetUser.id) {
      setAdminSelectedUserId(null);
    }
    showToast('success', `[ADMIN] ${targetUser.name}(${targetUser.studentId}) 계정을 강제 삭제했습니다.`);
  };

  const handleAdminForceAddFriend = (userAId, userBId) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    const aId = Number(userAId);
    const bId = Number(userBId);
    if (!aId || !bId || aId === bId) {
      showToast('error', '서로 다른 두 사용자를 선택해 주세요.');
      return;
    }

    const existing = friendships.find(
      (f) =>
        (f.requesterId === aId && f.receiverId === bId) ||
        (f.requesterId === bId && f.receiverId === aId)
    );

    if (existing) {
      setFriendships((prev) =>
        prev.map((f) => (f.id === existing.id ? { ...f, status: 'ACCEPTED' } : f))
      );
      showToast('success', '[ADMIN] 두 사용자의 친구 관계를 즉시 승인(ACCEPTED) 상태로 강제 연결했습니다.');
      return;
    }

    setFriendships((prev) => [
      {
        id: Date.now(),
        requesterId: aId,
        receiverId: bId,
        status: 'ACCEPTED'
      },
      ...prev
    ]);
    setAdminFriendAddTargetId('');
    showToast('success', '[ADMIN] 두 사용자를 강제로 친구 추가했습니다.');
  };

  const handleAdminForceRemoveFriend = (friendshipId) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setFriendships((prev) => prev.filter((f) => f.id !== friendshipId));
    showToast('success', '[ADMIN] 해당 친구 관계를 강제로 해제했습니다.');
  };

  // <피드백 조건 3, 5> ADMIN 전용 피드백 현황(제출 완료 / 검토 중 / 검토 완료) 변경 및 답변 등록 핸들러
  const handleAdminUpdateFeedbackItem = async (feedbackId, nextStatus, nextReply) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    const nowStr = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const base = (serverConfig.apiUrl || '').replace(/\/$/, '');
    if (base && isServerConnected && authToken) {
      try {
        await fetch(`${base}/admin/feedbacks/${feedbackId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            status: nextStatus,
            adminReply: nextReply
          })
        });
      } catch {
        // 로컬 저장소와 동기화
      }
    }

    setUserFeedbacks((prev) =>
      prev.map((item) => {
        if (item.id !== feedbackId) return item;
        const updatedReply =
          nextReply !== undefined ? String(nextReply).trim() : item.adminReply;
        return {
          ...item,
          status: nextStatus || item.status,
          adminReply: updatedReply,
          repliedAt: updatedReply ? nowStr : item.repliedAt
        };
      })
    );

    showToast(
      'success',
      `[ADMIN] 피드백 현황(${nextStatus}) 및 답변이 저장되어 작성자에게 반영되었습니다.`
    );
  };

  // 내가 보낸 피드백 목록 (<조건 3, 4>)
  const mySubmittedFeedbacks = useMemo(() => {
    if (!currentUser) return [];
    return userFeedbacks.filter(
      (fb) => fb.userId === currentUser.id || fb.studentId === currentUser.studentId
    );
  }, [userFeedbacks, currentUser]);

  // 회원가입 및 로그인 핸들러
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const dept = authForm.department.trim() || '컴퓨터공학과';
    const sid = authForm.studentId.trim();
    const uname = authForm.name.trim();

    if (!sid) {
      showToast('error', '학번을 입력해 주세요. (필수 예외 처리)');
      return;
    }
    if (!uname) {
      showToast('error', '이름을 입력해 주세요. (필수 예외 처리)');
      return;
    }

    const base = (serverConfig.apiUrl || '').replace(/\/$/, '');
    if (base && isServerConnected) {
      try {
        const endpoint = authMode === 'REGISTER' ? '/auth/register' : '/auth/login';
        const res = await fetch(`${base}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            department: dept,
            studentId: sid,
            name: uname,
            autoLogin: authForm.autoLogin
          })
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || '인증 처리 중 오류가 발생했습니다.');
          return;
        }
        if (data.token) {
          setAuthToken(data.token);
          localStorage.setItem('seoultech_auth_token_v5', data.token);
        }
        setCurrentUser(data.user);
        setMainView(data.user.preferredMainView || 'TIMETABLE');
        showToast('success', data.message);
        return;
      } catch {
        // 서버 오프라인 시 로컬 모드로 폴백
      }
    }

    if (authMode === 'REGISTER') {
      const exists = accounts.find((a) => a.studentId === sid);
      if (exists) {
        showToast('error', '이미 등록된 학번입니다. 로그인 모드로 전환해 주세요.');
        return;
      }
      const isAdmin = sid === '26101232' && uname === '최준우' && dept === '컴퓨터공학과';
      const newAcc = {
        id: Date.now(),
        department: dept,
        studentId: sid,
        name: uname,
        statusMessage: '',
        role: isAdmin ? 'ADMIN' : 'STUDENT',
        preferredMainView: 'TIMETABLE',
        currentYear: 2026,
        currentSemester: '1학기'
      };
      setAccounts((prev) => [...prev, newAcc]);
      setCurrentUser(newAcc);
      setMainView('TIMETABLE');
      showToast('success', `${dept} ${uname}님 회원가입 및 로그인이 완료되었습니다!`);
    } else {
      const matched = accounts.find(
        (a) => a.studentId === sid && a.department === dept && a.name === uname
      );
      if (!matched) {
        showToast(
          'error',
          '입력하신 학과, 학번, 이름 정보가 일치하는 계정이 없습니다. 정보를 다시 확인해 주세요.'
        );
        return;
      }
      setCurrentUser(matched);
      setMainView(matched.preferredMainView || 'TIMETABLE');
      showToast('success', `${matched.name}님 환영합니다!`);
    }
  };

  // 상태메시지 즉시 저장 핸들러 (<조건 4>)
  const handleSaveStatusMessage = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmed = myStatusDraft.trim().slice(0, 100);

    const updatedUser = {
      ...currentUser,
      statusMessage: trimmed
    };

    setAccounts((prev) => prev.map((a) => (a.id === currentUser.id ? updatedUser : a)));
    setCurrentUser(updatedUser);

    const base = (serverConfig.apiUrl || '').replace(/\/$/, '');
    if (base && isServerConnected && authToken) {
      try {
        await fetch(`${base}/auth/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ statusMessage: trimmed })
        });
      } catch {
        // 로컬 저장 완료
      }
    }

    showToast('success', '나의 상태메시지가 저장되었습니다!');
  };

  // 학과와 이름으로 친구 검색 (<조건 2, 3>)
  const handleSearchFriends = (e) => {
    e.preventDefault();
    const dept = friendSearchForm.department.trim() || '컴퓨터공학과';
    const targetName = friendSearchForm.name.trim();

    if (!targetName) {
      showToast('error', '찾으실 친구의 이름을 입력해 주세요.');
      return;
    }

    const matchedAll = accounts.filter(
      (a) => a.department.trim() === dept && a.name.trim() === targetName
    );
    const isDuplicateDeptAndName = matchedAll.length >= 2;

    const results = matchedAll
      .filter((a) => a.id !== currentUser?.id)
      .map((a) => ({
        ...a,
        hasDuplicateSameName: isDuplicateDeptAndName,
        maskedStudentId: isDuplicateDeptAndName ? maskStudentIdFront2Back3(a.studentId) : null
      }));

    setFriendSearchResults(results);
    setHasSearchedFriend(true);
  };

  // 친구 신청 발송 (<조건 1, 2>)
  const handleSendFriendRequest = (targetUser) => {
    if (!currentUser) return;
    const existing = friendships.find(
      (f) =>
        (f.requesterId === currentUser.id && f.receiverId === targetUser.id) ||
        (f.requesterId === targetUser.id && f.receiverId === currentUser.id)
    );

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        showToast('error', '이미 친구 목록에 등록된 학우입니다.');
        return;
      }
      if (existing.status === 'PENDING') {
        showToast('error', '이미 친구 신청이 진행 중입니다.');
        return;
      }
      setFriendships((prev) =>
        prev.map((f) =>
          f.id === existing.id
            ? { ...f, requesterId: currentUser.id, receiverId: targetUser.id, status: 'PENDING' }
            : f
        )
      );
      showToast('success', `${targetUser.department} ${targetUser.name}님에게 친구 신청을 보냈습니다!`);
      return;
    }

    const newRel = {
      id: Date.now(),
      requesterId: currentUser.id,
      receiverId: targetUser.id,
      status: 'PENDING'
    };
    setFriendships((prev) => [newRel, ...prev]);
    showToast('success', `${targetUser.department} ${targetUser.name}님에게 친구 신청을 보냈습니다!`);
  };

  // 친구 신청 수락/거절
  const handleRespondFriendRequest = (friendshipId, action) => {
    setFriendships((prev) =>
      prev.map((f) =>
        f.id === friendshipId
          ? { ...f, status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' }
          : f
      )
    );
    showToast(
      'success',
      action === 'ACCEPT' ? '친구 신청을 수락했습니다! 이제 친구의 시간표를 볼 수 있습니다.' : '친구 신청을 거절했습니다.'
    );
  };

  // 친구에게 일반 메시지 전송 (<조건 6>)
  const handleSendFriendMessage = (e) => {
    e.preventDefault();
    if (!currentUser || !selectedFriendForModal) return;
    const text = messageInput.trim();
    if (!text) {
      showToast('error', '전달할 메시지 내용을 입력해 주세요.');
      return;
    }

    const newMsg = {
      id: Date.now(),
      senderId: currentUser.id,
      receiverId: selectedFriendForModal.id,
      type: 'MESSAGE',
      content: text,
      day: null,
      startTime: null,
      endTime: null,
      status: 'UNREAD',
      createdAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setInteractions((prev) => [newMsg, ...prev]);
    setMessageInput('');
    showToast('success', `${selectedFriendForModal.name}님에게 메시지를 전달했습니다!`);
  };

  // 친구 타임테이블 클릭 -> 시간별 활동 제안 전송 (<조건 6>)
  const handleSendTimeProposal = (e) => {
    e.preventDefault();
    if (!currentUser || !selectedFriendForModal) return;
    const content = proposalDraft.content.trim();
    if (!content) {
      showToast('error', '제안할 활동 내용(예: 학식 먹기, 도서관 스터디 등)을 입력해 주세요.');
      return;
    }
    if (timeToMin(proposalDraft.endTime) <= timeToMin(proposalDraft.startTime)) {
      showToast('error', '활동 종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    const newProposal = {
      id: Date.now(),
      senderId: currentUser.id,
      receiverId: selectedFriendForModal.id,
      type: 'PROPOSAL',
      content,
      day: proposalDraft.day,
      startTime: proposalDraft.startTime,
      endTime: proposalDraft.endTime,
      status: 'PENDING',
      createdAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setInteractions((prev) => [newProposal, ...prev]);
    setProposalDraft((prev) => ({ ...prev, isOpen: false, content: '' }));
    showToast(
      'success',
      `${selectedFriendForModal.name}님에게 [${proposalDraft.day}요일 ${proposalDraft.startTime}~${proposalDraft.endTime}] 활동을 제안했습니다!`
    );
  };

  // 친구가 제안한 활동 수락 혹은 거절 (<조건 7>)
  const handleRespondActivityProposal = (interactionId, nextStatus) => {
    setInteractions((prev) =>
      prev.map((item) => (item.id === interactionId ? { ...item, status: nextStatus } : item))
    );
    showToast(
      'success',
      nextStatus === 'ACCEPTED'
        ? '친구가 제안한 활동을 수락했습니다!'
        : '친구가 제안한 활동을 거절했습니다.'
    );
  };

  // <조건 1 ~ 6> 성적 예측 평가 항목 조작 및 저장 핸들러
  const handleAddEvaluationItem = (category = 'EXAM') => {
    const labelMap = {
      EXAM: '추가 시험 / 퀴즈',
      ATTENDANCE: '출석 점수',
      ASSIGNMENT: '과제 / 기타'
    };
    setPredictionForm((prev) => ({
      ...prev,
      evaluationItems: [
        ...prev.evaluationItems,
        {
          id: `item_${Date.now()}`,
          category,
          label: labelMap[category] || '평가 항목',
          score: 85,
          maxScore: 100,
          weight: 10,
          mean: category === 'EXAM' ? '75' : '',
          stdDev: category === 'EXAM' ? '10' : ''
        }
      ]
    }));
  };

  const handleUpdateEvaluationItem = (idx, field, value) => {
    setPredictionForm((prev) => {
      const next = [...prev.evaluationItems];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, evaluationItems: next };
    });
  };

  const handleRemoveEvaluationItem = (idx) => {
    setPredictionForm((prev) => ({
      ...prev,
      evaluationItems: prev.evaluationItems.filter((_, i) => i !== idx)
    }));
  };

  const handleSavePrediction = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmedCourse = String(predictionForm.courseName || '').trim();
    if (!trimmedCourse) {
      showToast('error', '성적을 예측할 과목명을 입력해 주세요.');
      return;
    }

    const numStudents = Math.max(1, Number(predictionForm.totalStudents) || 50);

    const record = {
      id: editingPredictionId || Date.now(),
      courseName: trimmedCourse,
      credits: Number(predictionForm.credits) || 3,
      totalStudents: numStudents,
      evaluationItems: predictionForm.evaluationItems,
      gradeCutoffs: predictionForm.gradeCutoffs,
      calculatedTotalScore: livePredictionCalculation.calculatedTotalScore,
      examOnlyTopPercentile: livePredictionCalculation.examOnlyTopPercentile,
      usedExamStat: livePredictionCalculation.usedExamStat,
      estimatedRank: livePredictionCalculation.estimatedRank,
      predictedGrade: livePredictionCalculation.predictedGrade,
      updatedAt: new Date().toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const base = (serverConfig.apiUrl || '').replace(/\/$/, '');
    if (base && isServerConnected && authToken) {
      try {
        await fetch(`${base}/predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify(record)
        });
      } catch {
        // 로컬 저장소에 함께 보존
      }
    }

    setPredictionsByStudent((prev) => {
      const list = prev[currentUser.studentId] || [];
      const existsIdx = list.findIndex((item) => item.id === record.id);
      const nextList =
        existsIdx >= 0
          ? list.map((item, idx) => (idx === existsIdx ? record : item))
          : [record, ...list];
      return {
        ...prev,
        [currentUser.studentId]: nextList
      };
    });

    setEditingPredictionId(null);
    showToast(
      'success',
      `'${trimmedCourse}' 과목의 성적 예측 결과(예상 등급: ${record.predictedGrade}, 상위 ${record.examOnlyTopPercentile}%)가 저장되었습니다!`
    );
  };

  const handleLoadPredictionToEdit = (pred) => {
    setEditingPredictionId(pred.id);
    setPredictionForm({
      courseName: pred.courseName,
      credits: pred.credits || 3,
      totalStudents: pred.totalStudents || 50,
      evaluationItems: pred.evaluationItems || DEFAULT_EVALUATION_ITEMS,
      gradeCutoffs: pred.gradeCutoffs || DEFAULT_GRADE_CUTOFFS
    });
    showToast('success', `'${pred.courseName}' 성적 예측 설정을 불러왔습니다.`);
  };

  const handleDeletePrediction = async (id, courseName) => {
    if (!currentUser) return;
    const base = (serverConfig.apiUrl || '').replace(/\/$/, '');
    if (base && isServerConnected && authToken) {
      try {
        await fetch(`${base}/predictions/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch {
        // 로컬에서도 삭제
      }
    }

    setPredictionsByStudent((prev) => ({
      ...prev,
      [currentUser.studentId]: (prev[currentUser.studentId] || []).filter((p) => p.id !== id)
    }));
    if (editingPredictionId === id) {
      setEditingPredictionId(null);
    }
    showToast('success', `'${courseName}' 성적 예측 기록이 삭제되었습니다.`);
  };

  const handleApplyPredictedGradeToCourse = (pred) => {
    const matched = courses.find(
      (c) => c.courseName.trim().toLowerCase() === pred.courseName.trim().toLowerCase()
    );
    if (!matched) {
      showToast(
        'error',
        `현재 등록된 수강 과목 중 '${pred.courseName}' 과목이 없습니다. 먼저 과목 등록 탭에서 과목을 추가해 주세요.`
      );
      return;
    }
    updateCurrentUserCourses((prev) =>
      prev.map((c) => (c.id === matched.id ? { ...c, grade: pred.predictedGrade } : c))
    );
    showToast(
      'success',
      `'${pred.courseName}' 과목의 성적이 예측 등급(${pred.predictedGrade})으로 반영되었습니다!`
    );
  };

  // 과목 추가/수정 핸들러
  const addScheduleSlot = () => {
    setCourseForm((prev) => ({
      ...prev,
      schedules: [...prev.schedules, { day: '수', startTime: '09:00', endTime: '10:30' }]
    }));
  };

  const removeScheduleSlot = (idx) => {
    setCourseForm((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== idx)
    }));
  };

  const updateScheduleSlot = (idx, field, val) => {
    setCourseForm((prev) => {
      const updated = [...prev.schedules];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, schedules: updated };
    });
  };

  const handleSaveCourse = (e) => {
    e.preventDefault();
    const trimmedName = courseForm.courseName.trim();
    if (!trimmedName) {
      showToast('error', '과목명을 입력해 주세요.');
      return;
    }

    const numYear = Number(courseForm.year);
    if (!Number.isInteger(numYear) || numYear < 1980 || numYear > 2050) {
      showToast('error', '수강 년도는 1980년부터 2050년 사이로 입력해 주세요.');
      return;
    }

    const duplicateInSameSemester = courses.find(
      (c) =>
        c.id !== editingId &&
        Number(c.year) === numYear &&
        c.semester === courseForm.semester &&
        c.courseName.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateInSameSemester) {
      showToast(
        'error',
        `${numYear}년 ${courseForm.semester}에 이미 '${trimmedName}' 과목이 등록되어 있습니다.`
      );
      return;
    }

    for (let i = 0; i < courseForm.schedules.length; i++) {
      const slot = courseForm.schedules[i];
      const sMin = timeToMin(slot.startTime);
      const eMin = timeToMin(slot.endTime);

      if (eMin <= sMin) {
        showToast(
          'error',
          `[시간 설정 오류] ${i + 1}번째 수업(${slot.day}요일)의 종료 시간이 시작 시간보다 빠르거나 같습니다.`
        );
        return;
      }

      for (let j = i + 1; j < courseForm.schedules.length; j++) {
        const other = courseForm.schedules[j];
        if (slot.day === other.day) {
          const oStart = timeToMin(other.startTime);
          const oEnd = timeToMin(other.endTime);
          if (sMin < oEnd && eMin > oStart) {
            showToast('error', `동일 과목 내 ${slot.day}요일 수업 시간이 서로 겹칩니다.`);
            return;
          }
        }
      }
    }

    if (editingId) {
      updateCurrentUserCourses((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                ...courseForm,
                year: numYear,
                courseName: trimmedName,
                credits: Number(courseForm.credits)
              }
            : c
        )
      );
      showToast('success', `'${trimmedName}' 과목 정보가 수정되었습니다.`);
      setEditingId(null);
    } else {
      const newCourse = {
        id: Date.now(),
        ...courseForm,
        year: numYear,
        courseName: trimmedName,
        credits: Number(courseForm.credits),
        color: PASTEL_COLORS[courses.length % PASTEL_COLORS.length]
      };
      updateCurrentUserCourses((prev) => [newCourse, ...prev]);
      showToast('success', `'${trimmedName}' 과목이 등록되었습니다.`);
    }

    setCourseForm({
      year: currentUser?.currentYear || 2026,
      semester: currentUser?.currentSemester || '1학기',
      courseName: '',
      credits: 3,
      grade: '현재 이수 중',
      isRetake: false,
      isWithdrawn: false,
      schedules: [{ day: '월', startTime: '09:00', endTime: '10:30' }]
    });
  };

  const startEditCourse = (course) => {
    setEditingId(course.id);
    setCourseForm({
      year: course.year,
      semester: course.semester,
      courseName: course.courseName,
      credits: course.credits,
      grade: course.grade,
      isRetake: Boolean(course.isRetake),
      isWithdrawn: Boolean(course.isWithdrawn),
      schedules: course.schedules.length > 0 ? course.schedules : []
    });
    setMainView('DASHBOARD');
    setActiveToolCategory('COURSE');
  };

  const handleDeleteCourse = (id, name) => {
    updateCurrentUserCourses((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
    showToast('success', `'${name}' 과목이 삭제되었습니다.`);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const dept = profileForm.department.trim();
    const uname = profileForm.name.trim();
    const numYear = Number(profileForm.currentYear);

    if (!dept || !uname) {
      showToast('error', '학과와 이름은 비워둘 수 없습니다.');
      return;
    }

    // <조건 4, 5> 학번은 변경하지 않고 기존 학번을 그대로 유지
    const updatedUser = {
      ...currentUser,
      department: dept,
      studentId: currentUser.studentId,
      name: uname,
      statusMessage: (profileForm.statusMessage || '').trim(),
      preferredMainView: profileForm.preferredMainView,
      currentYear: numYear,
      currentSemester: profileForm.currentSemester
    };

    setAccounts((prev) => prev.map((a) => (a.id === currentUser.id ? updatedUser : a)));
    setCurrentUser(updatedUser);
    setMyStatusDraft(updatedUser.statusMessage || '');
    setIsProfilePopupOpen(false);
    showToast('success', '개인정보 및 현재 학기 설정이 저장되었습니다.');
  };

  const handleConfirmDeleteAccount = () => {
    if (!currentUser) return;
    const deletedSid = currentUser.studentId;
    const deletedName = currentUser.name;

    setAccounts((prev) => prev.filter((a) => a.id !== currentUser.id));
    setCoursesByStudent((prev) => {
      const next = { ...prev };
      delete next[deletedSid];
      return next;
    });
    setIsDeleteAccountModalOpen(false);
    setIsProfilePopupOpen(false);
    setCurrentUser(null);
    showToast('success', `${deletedName}님의 회원탈퇴가 완료되었습니다.`);
  };

  // 로그인 전 화면
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0D0D12] text-gray-100 p-[20px] flex items-center justify-center font-sans">
        <div className="w-full max-w-md bg-[#161622] border border-[#A8FFDB]/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(168,255,219,0.08)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#A8FFDB]/15 border border-[#A8FFDB] flex items-center justify-center text-[#A8FFDB]">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-[#A8FFDB]">
                  SEOULTECH CSE PORTAL
                </span>
                <h1 className="text-xl font-extrabold text-white">
                  서울과기대 성적·시간표 시스템
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsServerModalOpen(true)}
              className="p-2.5 rounded-xl bg-[#0D0D12] border border-gray-800 text-gray-400 hover:text-[#A8FFDB] hover:border-[#A8FFDB]/50 transition"
              title="클라우드 DB 및 백엔드 연결 설정"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-[#0D0D12] rounded-xl mb-6 border border-gray-800">
            <button
              type="button"
              onClick={() => setAuthMode('LOGIN')}
              className={`py-2.5 text-sm font-bold rounded-lg transition ${
                authMode === 'LOGIN'
                  ? 'bg-[#A8FFDB] text-[#0D0D12] shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('REGISTER')}
              className={`py-2.5 text-sm font-bold rounded-lg transition ${
                authMode === 'REGISTER'
                  ? 'bg-[#D4B2FF] text-[#0D0D12] shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              신규 회원가입
            </button>
          </div>

          {feedback.message && (
            <div
              className={`mb-5 p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                feedback.type === 'error'
                  ? 'bg-[#FFB2D0]/10 border-[#FFB2D0] text-[#FFB2D0]'
                  : 'bg-[#A8FFDB]/10 border-[#A8FFDB] text-[#A8FFDB]'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                학과 (기본값: 컴퓨터공학과)
              </label>
              <input
                type="text"
                value={authForm.department}
                onChange={(e) => setAuthForm({ ...authForm, department: e.target.value })}
                placeholder="컴퓨터공학과"
                className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#A8FFDB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                학번 <span className="text-[#FFB2D0]">*</span>
              </label>
              <input
                type="text"
                value={authForm.studentId}
                onChange={(e) => setAuthForm({ ...authForm, studentId: e.target.value })}
                placeholder="학번을 입력하세요"
                className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#A8FFDB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                이름 <span className="text-[#FFB2D0]">*</span>
              </label>
              <input
                type="text"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                placeholder="이름을 입력하세요"
                className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#A8FFDB]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={authForm.autoLogin}
                  onChange={(e) => setAuthForm({ ...authForm, autoLogin: e.target.checked })}
                  className="rounded accent-[#A8FFDB]"
                />
                자동 로그인 유지
              </label>
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition shadow-lg ${
                authMode === 'LOGIN'
                  ? 'bg-[#A8FFDB] text-[#0D0D12] hover:bg-[#8ef5c8]'
                  : 'bg-[#D4B2FF] text-[#0D0D12] hover:bg-[#c294ff]'
              }`}
            >
              {authMode === 'LOGIN' ? '시스템 접속하기' : '회원가입 및 시작하기'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 선택된 친구의 현재 학기 시간표 과목 조회 (<조건 5> 성적·학점 완전 제외)
  const selectedFriendTimetableCourses = selectedFriendForModal
    ? (coursesByStudent[selectedFriendForModal.studentId] || []).filter(
        (c) =>
          !c.isWithdrawn &&
          Number(c.year) === Number(selectedFriendForModal.currentYear || 2026) &&
          c.semester === (selectedFriendForModal.currentSemester || '1학기')
      )
    : [];

  // <기타 활동 조건 7> 특정 기타 활동은 비공개 설정 시 친구에게 안 보이도록 처리 (단, ADMIN 계정은 확인 가능)
  const selectedFriendTimetableActivities = selectedFriendForModal
    ? (activitiesByStudent[selectedFriendForModal.studentId] || []).filter((act) => {
        const s = act.startDate || '1900-01-01';
        const e = act.endDate || '2099-12-31';
        const inDateRange = !timetableReferenceDate || (timetableReferenceDate >= s && timetableReferenceDate <= e);
        if (!inDateRange) return false;
        if (currentUser.role === 'ADMIN') return true;
        return !act.isPrivate;
      })
    : [];

  // 선택된 친구와 주고받은 메시지 및 활동 제안 목록
  const selectedFriendInteractions = selectedFriendForModal
    ? interactions.filter(
        (it) =>
          (it.senderId === currentUser.id && it.receiverId === selectedFriendForModal.id) ||
          (it.senderId === selectedFriendForModal.id && it.receiverId === currentUser.id)
      )
    : [];

  return (
    <div className="min-h-screen bg-[#0D0D12] text-gray-100 p-[20px] font-sans">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* 상단 고정 헤더 (<조건 4, 5> 학과, 학번, 이름 클릭 시 학번 제외 개인정보 수정 및 로그아웃/탈퇴 팝업창 오픈) */}
        <header className="bg-[#151521] border border-[#A8FFDB]/25 rounded-2xl px-4 py-3 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsProfilePopupOpen(true)}
                title="클릭하여 개인정보 수정 / 로그아웃 / 탈퇴"
                className="px-3 py-1.5 rounded-xl bg-[#A8FFDB]/10 border border-[#A8FFDB]/40 hover:border-[#A8FFDB] flex items-center gap-2 transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-[#A8FFDB]" />
                <span className="text-xs font-bold text-[#A8FFDB]">
                  {currentUser.department}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsProfilePopupOpen(true)}
                title="클릭하여 개인정보 수정 / 로그아웃 / 탈퇴"
                className="px-3 py-1.5 rounded-xl bg-[#1E1E2E] border border-gray-700 hover:border-[#A8FFDB] text-xs transition cursor-pointer"
              >
                <span className="text-gray-400 mr-1.5">학번</span>
                <span className="font-mono font-bold text-white">{currentUser.studentId}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProfilePopupOpen(true)}
                title="클릭하여 개인정보 수정 / 로그아웃 / 탈퇴"
                className="px-3 py-1.5 rounded-xl bg-[#1E1E2E] border border-gray-700 hover:border-[#A8FFDB] text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <span className="text-gray-400">이름</span>
                <span className="font-bold text-white">{currentUser.name}</span>
                {currentUser.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-[#FFB2D0]/20 text-[#FFB2D0] border border-[#FFB2D0]/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 운영자
                  </span>
                )}
              </button>

              <div className="px-3 py-1.5 rounded-xl bg-[#D4B2FF]/10 border border-[#D4B2FF]/30 text-xs font-bold text-[#D4B2FF]">
                현재 학기: {currentUser.currentYear || 2026}년{' '}
                {currentUser.currentSemester || '1학기'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-xl bg-[#0D0D12] border border-gray-800 flex items-center gap-1.5">
                <span className="text-xs text-gray-400">현재 학기 학점</span>
                <span className="text-sm font-extrabold text-[#A8FFDB]">
                  {academicStats.currentSemesterCredits}
                </span>
                <span className="text-xs text-gray-500">학점</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-[#0D0D12] border border-gray-800 flex items-center gap-1.5">
                <span className="text-xs text-gray-400">총 이수 학점</span>
                <span className="text-sm font-extrabold text-[#D4B2FF]">
                  {academicStats.totalEarnedCredits}
                </span>
                <span className="text-xs text-gray-500">학점</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#A8FFDB]/20 to-[#D4B2FF]/20 border border-[#A8FFDB]/50 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#A8FFDB]" />
                <span className="text-xs font-semibold text-gray-200">총 평점(GPA)</span>
                <span className="text-base font-black text-white">{academicStats.gpa}</span>
                <span className="text-xs text-gray-400">/ 4.5</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentUser(null);
                  setAuthToken('');
                  localStorage.removeItem('seoultech_auth_token_v6');
                }}
                className="p-2 rounded-xl bg-[#1E1E2E] hover:bg-[#FFB2D0]/20 text-gray-300 hover:text-[#FFB2D0] border border-gray-700 transition"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* 메인 화면 전환 탭 (<조건 2> '시간표' 및 '도구'로 명칭 변경) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#151521] border border-gray-800 rounded-2xl p-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMainView('TIMETABLE')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-extrabold transition ${
                mainView === 'TIMETABLE'
                  ? 'bg-[#A8FFDB] text-[#0D0D12] shadow-[0_0_20px_rgba(168,255,219,0.3)]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1E1E2E]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              시간표
            </button>

            <button
              type="button"
              onClick={() => setMainView('DASHBOARD')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-extrabold transition ${
                mainView === 'DASHBOARD'
                  ? 'bg-[#D4B2FF] text-[#0D0D12] shadow-[0_0_20px_rgba(212,178,255,0.3)]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1E1E2E]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              도구
              {friendData.incomingRequests.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-[#FFB2D0] text-[#0D0D12] font-black">
                  {friendData.incomingRequests.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsServerModalOpen(true)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
                isServerConnected
                  ? 'bg-[#A8FFDB]/10 text-[#A8FFDB] border-[#A8FFDB]/40'
                  : 'bg-[#1E1E2E] text-gray-300 border-gray-700 hover:border-[#A8FFDB]'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              {isServerConnected ? '클라우드 DB 실시간 연동중' : '서버 연결 설정'}
            </button>
          </div>
        </div>

        {/* 알림 메시지 바 */}
        {feedback.message && (
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between ${
              feedback.type === 'error'
                ? 'bg-[#FFB2D0]/10 border-[#FFB2D0] text-[#FFB2D0]'
                : 'bg-[#A8FFDB]/10 border-[#A8FFDB] text-[#A8FFDB]'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback({ type: '', message: '' })}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              닫기
            </button>
          </div>
        )}

        {/* [메인 화면 1] 주간 시간표 화면 (<조건 1> 아래로 스크롤하지 않아도 한 화면에 다 보이도록 컴팩트 높이 적용 + <조건 3> 우측 상단 'v' 버튼) */}
        {mainView === 'TIMETABLE' && (
          <div className="bg-[#151521] border border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#A8FFDB]" />
                  {currentUser.currentYear || 2026}년 {currentUser.currentSemester || '1학기'} 주간
                  타임테이블 (09:00 ~ 21:00)
                </h2>
                <p className="text-[11px] text-gray-400">
                  현재 학기 강의와 세부정보로 설정한 기간 내의{' '}
                  <strong className="text-[#FFE699]">기타 활동</strong>이 한 화면에 표시됩니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMainView('DASHBOARD');
                    setActiveToolCategory('FRIEND');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#99E6FF]/15 text-[#99E6FF] border border-[#99E6FF]/40 text-xs font-bold hover:bg-[#99E6FF] hover:text-[#0D0D12] transition flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" /> 친구 시간표
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMainView('DASHBOARD');
                    setActiveToolCategory('COURSE');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#A8FFDB]/15 text-[#A8FFDB] border border-[#A8FFDB]/40 text-xs font-bold hover:bg-[#A8FFDB] hover:text-[#0D0D12] transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> 강의 추가
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMainView('DASHBOARD');
                    setActiveToolCategory('ACTIVITY');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FFE699]/15 text-[#FFE699] border border-[#FFE699]/40 text-xs font-bold hover:bg-[#FFE699] hover:text-[#0D0D12] transition flex items-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5" /> 기타 활동 추가
                </button>
                <button
                  type="button"
                  onClick={() => toggleBoxCollapse('mainTimetable')}
                  className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition"
                  title="접기/펼치기"
                >
                  <span
                    className={`inline-block transition-transform duration-200 ${
                      collapsedBoxes['mainTimetable'] ? '-rotate-90' : ''
                    }`}
                  >
                    v
                  </span>
                </button>
              </div>
            </div>

            {!collapsedBoxes['mainTimetable'] && (
              <>
                <div className="overflow-x-auto">
                  <div className="min-w-[680px] border border-gray-800 rounded-2xl overflow-hidden bg-[#0D0D12]">
                    <div className="grid grid-cols-6 border-b border-gray-800 bg-[#1A1A28]">
                      <div className="py-1.5 px-2 text-center text-[11px] font-bold text-gray-400 border-r border-gray-800">
                        시간
                      </div>
                      {DAYS.map((day) => (
                        <div
                          key={day}
                          className="py-1.5 px-2 text-center text-xs font-extrabold text-[#A8FFDB] border-r border-gray-800 last:border-r-0"
                        >
                          {day}요일
                        </div>
                      ))}
                    </div>

                    {/* <조건 1> 30분당 18px (1시간 36px, 총 12시간 = 432px)로 설정하여 스크롤 없이 한 화면에 표시 */}
                    <div className="grid grid-cols-6 relative" style={{ height: '432px' }}>
                      <div className="border-r border-gray-800">
                        {Array.from({ length: 12 }, (_, idx) => 9 + idx).map((hour) => (
                          <div
                            key={hour}
                            style={{ height: '36px' }}
                            className="border-b border-gray-800/60 px-2 py-0.5 text-[10px] font-mono text-gray-400 flex items-start"
                          >
                            {String(hour).padStart(2, '0')}:00
                          </div>
                        ))}
                      </div>

                      {DAYS.map((day) => (
                        <div key={day} className="relative border-r border-gray-800 last:border-r-0">
                          {Array.from({ length: 24 }, (_, idx) => idx).map((halfIdx) => (
                            <div
                              key={halfIdx}
                              style={{ height: '18px' }}
                              className={`${
                                halfIdx % 2 === 0
                                  ? 'border-b border-gray-800/30'
                                  : 'border-b border-gray-800/70'
                              }`}
                            />
                          ))}

                          {/* <조건 6> 강의 표시 체크박스가 켜져 있을 때만 강의 렌더링 */}
                          {showCoursesOnTimetable &&
                            currentTimetableCourses.map((course) =>
                              (course.schedules || [])
                                .filter((s) => s.day === day)
                                .map((slot, sIdx) => {
                                  const startMin = timeToMin(slot.startTime);
                                  const endMin = timeToMin(slot.endTime);
                                  const topPx = ((startMin - 540) / 30) * 18;
                                  const heightPx = Math.max(((endMin - startMin) / 30) * 18, 18);

                                  return (
                                    <div
                                      key={`course-${course.id}-${sIdx}`}
                                      onClick={() => startEditCourse(course)}
                                      style={{
                                        top: `${topPx}px`,
                                        height: `${heightPx}px`,
                                        backgroundColor: `${course.color || '#A8FFDB'}22`,
                                        borderColor: course.color || '#A8FFDB'
                                      }}
                                      className="absolute left-1 right-1 rounded-lg border-l-4 px-1.5 py-0.5 cursor-pointer hover:brightness-125 transition overflow-hidden shadow-md z-10"
                                    >
                                      <div
                                        className="text-[11px] font-extrabold leading-tight truncate"
                                        style={{ color: course.color || '#A8FFDB' }}
                                      >
                                        {course.courseName}
                                      </div>
                                      <div className="text-[9px] text-gray-300 font-mono leading-tight truncate">
                                        {slot.startTime}-{slot.endTime} · {course.credits}학점
                                      </div>
                                    </div>
                                  );
                                })
                            )}

                          {/* <조건 1, 2, 4, 6> 기타 활동 표시 체크박스가 켜져 있을 때 설정된 기간 내의 기타 활동 렌더링 */}
                          {showActivitiesOnTimetable &&
                            currentTimetableActivities.map((act) =>
                              (act.schedules || [])
                                .filter((s) => s.day === day)
                                .map((slot, sIdx) => {
                                  const startMin = timeToMin(slot.startTime);
                                  const endMin = timeToMin(slot.endTime);
                                  const topPx = ((startMin - 540) / 30) * 18;
                                  const heightPx = Math.max(((endMin - startMin) / 30) * 18, 18);

                                  return (
                                    <div
                                      key={`act-${act.id}-${sIdx}`}
                                      onClick={() => startEditActivity(act)}
                                      style={{
                                        top: `${topPx}px`,
                                        height: `${heightPx}px`,
                                        backgroundColor: `${act.color || '#FFE699'}26`,
                                        borderColor: act.color || '#FFE699'
                                      }}
                                      className="absolute left-1 right-1 rounded-lg border-l-4 border-dashed px-1.5 py-0.5 cursor-pointer hover:brightness-125 transition overflow-hidden shadow-md z-20"
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span
                                          className="text-[11px] font-extrabold leading-tight truncate"
                                          style={{ color: act.color || '#FFE699' }}
                                        >
                                          ★ {act.title}
                                        </span>
                                        {act.isPrivate && (
                                          <Lock className="w-2.5 h-2.5 text-[#FFB2D0] shrink-0" />
                                        )}
                                      </div>
                                      <div className="text-[9px] text-gray-200 font-mono leading-tight truncate">
                                        {slot.startTime}-{slot.endTime} [{act.category}]
                                      </div>
                                    </div>
                                  );
                                })
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 타임테이블 하단: 강의 표시 체크박스 + 기타 활동 표시 체크박스 + 활동 기간 기준일 필터 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-gray-800 bg-[#0D0D12] px-3.5 py-2.5 rounded-2xl">
                  <div className="flex flex-wrap items-center gap-5">
                    <label className="flex items-center gap-2 text-xs font-extrabold text-[#A8FFDB] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showCoursesOnTimetable}
                        onChange={(e) => setShowCoursesOnTimetable(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#A8FFDB]"
                      />
                      📚 강의 시간표 보이기 ({currentTimetableCourses.length}개)
                    </label>

                    <label className="flex items-center gap-2 text-xs font-extrabold text-[#FFE699] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showActivitiesOnTimetable}
                        onChange={(e) => setShowActivitiesOnTimetable(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#FFE699]"
                      />
                      ✨ 기타 활동 보이기 (기간 내 {currentTimetableActivities.length}개)
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-gray-400 font-semibold">
                      📅 타임테이블 기준 날짜 (기타 활동 기간 필터):
                    </span>
                    <input
                      type="date"
                      value={timetableReferenceDate}
                      onChange={(e) => setTimetableReferenceDate(e.target.value)}
                      className="rounded-lg bg-[#151521] border border-gray-700 px-2.5 py-1 text-xs font-mono text-white focus:border-[#FFE699] focus:outline-none"
                    />
                    {timetableReferenceDate && (
                      <button
                        type="button"
                        onClick={() => setTimetableReferenceDate('')}
                        className="text-[11px] text-gray-400 hover:text-white underline"
                      >
                        전체 기간 보기
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* [메인 화면 2] 도구 화면 */}
        {mainView === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* 도구 상단 카테고리 스위치 */}
            <div className="flex flex-wrap items-center gap-2 bg-[#151521] border border-gray-800 rounded-2xl p-2.5">
              <button
                type="button"
                onClick={() => setActiveToolCategory('COURSE')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  activeToolCategory === 'COURSE'
                    ? 'bg-[#A8FFDB] text-[#0D0D12]'
                    : 'text-gray-400 hover:text-white bg-[#0D0D12]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                과목 및 성적 관리
              </button>

              <button
                type="button"
                onClick={() => setActiveToolCategory('ACTIVITY')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  activeToolCategory === 'ACTIVITY'
                    ? 'bg-[#B8FF99] text-[#0D0D12] shadow-[0_0_15px_rgba(184,255,153,0.3)]'
                    : 'text-gray-400 hover:text-white bg-[#0D0D12]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                기타 활동 ({myActivities.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveToolCategory('PREDICTION')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  activeToolCategory === 'PREDICTION'
                    ? 'bg-[#FFE699] text-[#0D0D12] shadow-[0_0_15px_rgba(255,230,153,0.3)]'
                    : 'text-gray-400 hover:text-white bg-[#0D0D12]'
                }`}
              >
                <Calculator className="w-4 h-4" />
                성적 예측
                {savedPredictions.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#0D0D12] text-[#FFE699] font-black">
                    {savedPredictions.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveToolCategory('FRIEND')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  activeToolCategory === 'FRIEND'
                    ? 'bg-[#99E6FF] text-[#0D0D12]'
                    : 'text-gray-400 hover:text-white bg-[#0D0D12]'
                }`}
              >
                <Users className="w-4 h-4" />
                친구
                {friendData.incomingRequests.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#FFB2D0] text-[#0D0D12] font-black">
                    {friendData.incomingRequests.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveToolCategory('GROUP')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  activeToolCategory === 'GROUP'
                    ? 'bg-[#A8FFDB] text-[#0D0D12] shadow-[0_0_15px_rgba(168,255,219,0.3)]'
                    : 'text-gray-400 hover:text-white bg-[#0D0D12]'
                }`}
              >
                <Users className="w-4 h-4" />
                그룹 ({studyGroups.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveToolCategory('GRADUATION')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  activeToolCategory === 'GRADUATION'
                    ? 'bg-[#FFE699] text-[#0D0D12] shadow-[0_0_15px_rgba(255,230,153,0.35)]'
                    : 'text-gray-400 hover:text-white bg-[#0D0D12]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                졸업요건 (EPiC·학점)
              </button>

              <button
                type="button"
                onClick={() => setActiveToolCategory('PROFILE')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  activeToolCategory === 'PROFILE'
                    ? 'bg-[#D4B2FF] text-[#0D0D12]'
                    : 'text-gray-400 hover:text-white bg-[#0D0D12]'
                }`}
              >
                <Settings className="w-4 h-4" />
                개인정보 설정
              </button>

              {currentUser.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => setActiveToolCategory('ADMIN')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                    activeToolCategory === 'ADMIN'
                      ? 'bg-[#FFB2D0] text-[#0D0D12] shadow-[0_0_15px_rgba(255,178,208,0.4)]'
                      : 'text-[#FFB2D0] hover:bg-[#FFB2D0]/15 bg-[#0D0D12] border border-[#FFB2D0]/40'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  ADMIN 유저·친구 강제 관리
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveToolCategory('FEEDBACK')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  activeToolCategory === 'FEEDBACK'
                    ? 'bg-[#A8FFDB] text-[#0D0D12] shadow-[0_0_15px_rgba(168,255,219,0.35)]'
                    : 'text-gray-400 hover:text-white bg-[#0D0D12]'
                }`}
              >
                <MessageCircleQuestion className="w-4 h-4" />
                피드백
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#161622] text-[#A8FFDB] font-black">
                  {currentUser.role === 'ADMIN'
                    ? userFeedbacks.length
                    : mySubmittedFeedbacks.length}
                </span>
              </button>
            </div>

            {/* 1. 과목 및 성적 관리 탭 (<조건 3> 각 박스 우측 상단 'v' 접기/펼치기 버튼) */}
            {activeToolCategory === 'COURSE' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-[#151521] border border-[#D4B2FF]/30 rounded-2xl p-6 space-y-5 h-fit">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#D4B2FF]" />
                      {editingId ? '과목 및 성적 수정' : '과목 및 성적 등록'}
                    </h2>
                    <div className="flex items-center gap-2">
                      {editingId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setCourseForm({
                              year: currentUser.currentYear || 2026,
                              semester: currentUser.currentSemester || '1학기',
                              courseName: '',
                              credits: 3,
                              grade: '현재 이수 중',
                              isRetake: false,
                              isWithdrawn: false,
                              schedules: [{ day: '월', startTime: '09:00', endTime: '10:30' }]
                            });
                          }}
                          className="text-xs text-[#FFB2D0] hover:underline"
                        >
                          수정 취소
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('courseFormBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#D4B2FF] hover:border-[#D4B2FF] flex items-center justify-center transition"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['courseFormBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>
                  </div>

                  {!collapsedBoxes['courseFormBox'] && (
                    <form onSubmit={handleSaveCourse} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            수강 년도 (숫자)
                          </label>
                          <input
                            type="number"
                            min={1980}
                            max={2050}
                            value={courseForm.year}
                            onChange={(e) => setCourseForm({ ...courseForm, year: e.target.value })}
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#D4B2FF] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            수강 학기
                          </label>
                          <select
                            value={courseForm.semester}
                            onChange={(e) =>
                              setCourseForm({ ...courseForm, semester: e.target.value })
                            }
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#D4B2FF] focus:outline-none"
                          >
                            {SEMESTER_OPTIONS.map((sem) => (
                              <option key={sem} value={sem}>
                                {sem}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          과목명 <span className="text-[#FFB2D0]">*</span>
                        </label>
                        <input
                          type="text"
                          value={courseForm.courseName}
                          onChange={(e) =>
                            setCourseForm({ ...courseForm, courseName: e.target.value })
                          }
                          placeholder="예: 알고리즘, 컴퓨터네트워크"
                          className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#D4B2FF] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            학점 수 (1~4학점)
                          </label>
                          <select
                            value={courseForm.credits}
                            onChange={(e) =>
                              setCourseForm({ ...courseForm, credits: Number(e.target.value) })
                            }
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#D4B2FF] focus:outline-none"
                          >
                            {[1, 2, 3, 4].map((cr) => (
                              <option key={cr} value={cr}>
                                {cr}학점
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            성적 등급 (A+ ~ F)
                          </label>
                          <select
                            value={courseForm.grade}
                            onChange={(e) =>
                              setCourseForm({ ...courseForm, grade: e.target.value })
                            }
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#D4B2FF] focus:outline-none"
                          >
                            {GRADE_OPTIONS.map((g) => (
                              <option key={g} value={g}>
                                {g} {GRADE_POINTS[g] !== undefined ? `(${GRADE_POINTS[g]})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <label
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                            courseForm.isRetake
                              ? 'bg-[#A8FFDB]/15 border-[#A8FFDB] text-[#A8FFDB]'
                              : 'bg-[#0D0D12] border-gray-800 text-gray-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={courseForm.isRetake}
                            onChange={(e) =>
                              setCourseForm({ ...courseForm, isRetake: e.target.checked })
                            }
                            className="accent-[#A8FFDB]"
                          />
                          <RotateCcw className="w-3.5 h-3.5" />
                          재수강 과목
                        </label>

                        <label
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                            courseForm.isWithdrawn
                              ? 'bg-[#FFB2D0]/15 border-[#FFB2D0] text-[#FFB2D0]'
                              : 'bg-[#0D0D12] border-gray-800 text-gray-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={courseForm.isWithdrawn}
                            onChange={(e) =>
                              setCourseForm({ ...courseForm, isWithdrawn: e.target.checked })
                            }
                            className="accent-[#FFB2D0]"
                          />
                          <Ban className="w-3.5 h-3.5" />
                          수강포기(W)
                        </label>
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-gray-800">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#A8FFDB]">
                            수업 요일 및 시간 (30분 단위)
                          </label>
                          <button
                            type="button"
                            onClick={addScheduleSlot}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#A8FFDB]/15 text-[#A8FFDB] hover:bg-[#A8FFDB]/25 font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> 시간 추가
                          </button>
                        </div>

                        {courseForm.schedules.map((slot, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-[#0D0D12] p-2.5 rounded-xl border border-gray-800"
                          >
                            <select
                              value={slot.day}
                              onChange={(e) => updateScheduleSlot(index, 'day', e.target.value)}
                              className="rounded-lg bg-[#161622] border border-gray-700 px-2.5 py-1.5 text-xs text-white"
                            >
                              {DAYS.map((d) => (
                                <option key={d} value={d}>
                                  {d}요일
                                </option>
                              ))}
                            </select>

                            <select
                              value={slot.startTime}
                              onChange={(e) =>
                                updateScheduleSlot(index, 'startTime', e.target.value)
                              }
                              className="rounded-lg bg-[#161622] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white"
                            >
                              {TIME_OPTIONS.slice(0, -1).map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>

                            <span className="text-gray-500 text-xs">~</span>

                            <select
                              value={slot.endTime}
                              onChange={(e) => updateScheduleSlot(index, 'endTime', e.target.value)}
                              className="rounded-lg bg-[#161622] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white"
                            >
                              {TIME_OPTIONS.slice(1).map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>

                            {courseForm.schedules.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeScheduleSlot(index)}
                                className="ml-auto p-1.5 text-gray-400 hover:text-[#FFB2D0]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#A8FFDB] to-[#D4B2FF] text-[#0D0D12] hover:opacity-95 transition shadow-lg"
                      >
                        {editingId ? '과목 수정 내용 저장' : '과목 및 성적 저장하기'}
                      </button>
                    </form>
                  )}
                </div>

                {/* 오른쪽: 전체 과목 목록 */}
                <div className="lg:col-span-7 bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-4 h-fit">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-white">
                        등록된 수강 과목 및 성적 내역 ({courses.length}과목)
                      </h2>
                      <p className="text-xs text-gray-400">
                        재수강 시 최신 성적으로 GPA가 자동 갱신되며, 수강포기(W) 과목은 계산에서
                        제외됩니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBoxCollapse('courseListBox')}
                      className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition shrink-0"
                      title="접기/펼치기"
                    >
                      <span
                        className={`inline-block transition-transform duration-200 ${
                          collapsedBoxes['courseListBox'] ? '-rotate-90' : ''
                        }`}
                      >
                        v
                      </span>
                    </button>
                  </div>

                  {!collapsedBoxes['courseListBox'] && (
                    <div className="space-y-3">
                      {courses.map((course) => {
                        const isReplacedByRetake = academicStats.activeRetakeReplacedIds.has(
                          course.id
                        );
                        return (
                          <div
                            key={course.id}
                            className={`p-4 rounded-2xl bg-[#0D0D12] border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              course.isWithdrawn || isReplacedByRetake
                                ? 'border-gray-800/50 opacity-60'
                                : 'border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: course.color || '#A8FFDB' }}
                                />
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-800 text-gray-300">
                                  {course.year}년 {course.semester}
                                </span>
                                <h3 className="text-sm font-extrabold text-white">
                                  {course.courseName}
                                </h3>
                                <span className="text-xs text-gray-400">({course.credits}학점)</span>

                                {course.isRetake && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#A8FFDB]/15 text-[#A8FFDB] border border-[#A8FFDB]/40">
                                    재수강
                                  </span>
                                )}
                                {course.isWithdrawn && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FFB2D0]/15 text-[#FFB2D0] border border-[#FFB2D0]/40">
                                    수강포기(W) · 학점/GPA 제외
                                  </span>
                                )}
                                {isReplacedByRetake && !course.isWithdrawn && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-800 text-gray-400">
                                    재수강 완료로 GPA 계산 제외됨
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(course.schedules || []).map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161622] text-gray-300 border border-gray-800"
                                  >
                                    {s.day} {s.startTime}~{s.endTime}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                                  course.grade === '현재 이수 중'
                                    ? 'bg-[#D4B2FF]/10 text-[#D4B2FF] border-[#D4B2FF]/40'
                                    : course.grade === 'F'
                                    ? 'bg-[#FFB2D0]/10 text-[#FFB2D0] border-[#FFB2D0]/40'
                                    : 'bg-[#A8FFDB]/10 text-[#A8FFDB] border-[#A8FFDB]/40'
                                }`}
                              >
                                {course.grade}
                              </div>

                              <button
                                type="button"
                                onClick={() => startEditCourse(course)}
                                className="p-2 rounded-xl bg-[#161622] hover:bg-gray-800 text-gray-300 hover:text-[#A8FFDB] transition"
                                title="과목 수정"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCourse(course.id, course.courseName)}
                                className="p-2 rounded-xl bg-[#161622] hover:bg-gray-800 text-gray-300 hover:text-[#FFB2D0] transition"
                                title="과목 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 1-1. 기타 활동 전용 탭 (<조건 3> 박스 우측 상단 'v' 접기/펼치기 버튼) */}
            {activeToolCategory === 'ACTIVITY' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-[#151521] border border-[#B8FF99]/35 rounded-2xl p-6 space-y-5 h-fit">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[#B8FF99]" />
                        {editingActivityId ? '기타 활동 세부정보 수정' : '새 기타 활동 등록'}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        강의가 아닌 활동이므로 학점·평점은 없으며, 설명·링크·기간·친구 비공개 여부를
                        설정할 수 있습니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {editingActivityId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingActivityId(null);
                            setActivityForm({
                              title: '',
                              category: myActivityCategories[0] || '동아리/스터디',
                              description: '',
                              link: '',
                              startDate: '2026-03-02',
                              endDate: '2026-06-21',
                              color: '#FFE699',
                              isPrivate: false,
                              schedules: [{ day: '수', startTime: '15:00', endTime: '16:30' }]
                            });
                          }}
                          className="text-xs text-[#FFB2D0] hover:underline"
                        >
                          수정 취소
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('activityFormBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#B8FF99] hover:border-[#B8FF99] flex items-center justify-center transition"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['activityFormBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>
                  </div>

                  {!collapsedBoxes['activityFormBox'] && (
                    <>
                      <div className="p-3.5 rounded-xl bg-[#0D0D12] border border-gray-800 space-y-2">
                        <label className="block text-xs font-bold text-[#B8FF99]">
                          📁 나만의 기타 활동 카테고리 추가
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCategoryInput}
                            onChange={(e) => setNewCategoryInput(e.target.value)}
                            placeholder="예: 운동/헬스, 학부연구생, 자격증..."
                            className="flex-1 rounded-lg bg-[#161622] border border-gray-700 px-3 py-1.5 text-xs text-white focus:border-[#B8FF99] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddActivityCategory}
                            className="px-3 py-1.5 rounded-lg bg-[#B8FF99]/20 text-[#B8FF99] border border-[#B8FF99]/40 text-xs font-extrabold hover:bg-[#B8FF99] hover:text-[#0D0D12] transition flex items-center gap-1"
                          >
                            <FolderPlus className="w-3.5 h-3.5" /> 추가
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleSaveActivity} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-5">
                            <label className="block text-xs font-semibold text-gray-300 mb-1">
                              카테고리 분류
                            </label>
                            <select
                              value={activityForm.category}
                              onChange={(e) =>
                                setActivityForm({ ...activityForm, category: e.target.value })
                              }
                              className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3 py-2.5 text-sm text-white focus:border-[#B8FF99] focus:outline-none"
                            >
                              {myActivityCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-7">
                            <label className="block text-xs font-semibold text-gray-300 mb-1">
                              기타 활동명 <span className="text-[#FFB2D0]">*</span>
                            </label>
                            <input
                              type="text"
                              value={activityForm.title}
                              onChange={(e) =>
                                setActivityForm({ ...activityForm, title: e.target.value })
                              }
                              placeholder="예: 알고리즘 스터디, 근로장학생"
                              className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#B8FF99] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            세부정보 · 간략한 내용 설명
                          </label>
                          <input
                            type="text"
                            value={activityForm.description}
                            onChange={(e) =>
                              setActivityForm({ ...activityForm, description: e.target.value })
                            }
                            placeholder="예: 매주 백준 3문제 풀이 및 발표"
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#B8FF99] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            세부정보 · 관련 링크 (URL)
                          </label>
                          <input
                            type="text"
                            value={activityForm.link}
                            onChange={(e) =>
                              setActivityForm({ ...activityForm, link: e.target.value })
                            }
                            placeholder="예: https://github.com/... 또는 오픈채팅/노션 링크"
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#B8FF99] focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#FFE699] mb-1">
                              활동 시작일 (기간 설정)
                            </label>
                            <input
                              type="date"
                              value={activityForm.startDate}
                              onChange={(e) =>
                                setActivityForm({ ...activityForm, startDate: e.target.value })
                              }
                              className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3 py-2 text-xs font-mono text-white focus:border-[#FFE699] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#FFE699] mb-1">
                              활동 종료일 (기간 설정)
                            </label>
                            <input
                              type="date"
                              value={activityForm.endDate}
                              onChange={(e) =>
                                setActivityForm({ ...activityForm, endDate: e.target.value })
                              }
                              className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3 py-2 text-xs font-mono text-white focus:border-[#FFE699] focus:outline-none"
                            />
                          </div>
                        </div>

                        <label
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                            activityForm.isPrivate
                              ? 'bg-[#FFB2D0]/15 border-[#FFB2D0] text-[#FFB2D0]'
                              : 'bg-[#0D0D12] border-gray-800 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={activityForm.isPrivate}
                              onChange={(e) =>
                                setActivityForm({ ...activityForm, isPrivate: e.target.checked })
                              }
                              className="accent-[#FFB2D0]"
                            />
                            {activityForm.isPrivate ? (
                              <Lock className="w-4 h-4 text-[#FFB2D0]" />
                            ) : (
                              <Unlock className="w-4 h-4 text-gray-400" />
                            )}
                            <span>친구에게 비공개 설정 (내 시간표와 ADMIN에게만 표시)</span>
                          </div>
                        </label>

                        <div className="space-y-2.5 pt-2 border-t border-gray-800">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#B8FF99]">
                              활동 요일 및 시간 (30분 단위)
                            </label>
                            <button
                              type="button"
                              onClick={addActivityScheduleSlot}
                              className="text-xs px-2.5 py-1 rounded-lg bg-[#B8FF99]/15 text-[#B8FF99] hover:bg-[#B8FF99]/25 font-bold flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> 시간 추가
                            </button>
                          </div>

                          {activityForm.schedules.map((slot, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 bg-[#0D0D12] p-2.5 rounded-xl border border-gray-800"
                            >
                              <select
                                value={slot.day}
                                onChange={(e) =>
                                  updateActivityScheduleSlot(index, 'day', e.target.value)
                                }
                                className="rounded-lg bg-[#161622] border border-gray-700 px-2.5 py-1.5 text-xs text-white"
                              >
                                {DAYS.map((d) => (
                                  <option key={d} value={d}>
                                    {d}요일
                                  </option>
                                ))}
                              </select>

                              <select
                                value={slot.startTime}
                                onChange={(e) =>
                                  updateActivityScheduleSlot(index, 'startTime', e.target.value)
                                }
                                className="rounded-lg bg-[#161622] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white"
                              >
                                {TIME_OPTIONS.slice(0, -1).map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>

                              <span className="text-gray-500 text-xs">~</span>

                              <select
                                value={slot.endTime}
                                onChange={(e) =>
                                  updateActivityScheduleSlot(index, 'endTime', e.target.value)
                                }
                                className="rounded-lg bg-[#161622] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white"
                              >
                                {TIME_OPTIONS.slice(1).map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>

                              {activityForm.schedules.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeActivityScheduleSlot(index)}
                                  className="ml-auto p-1.5 text-gray-400 hover:text-[#FFB2D0]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#B8FF99] to-[#FFE699] text-[#0D0D12] hover:opacity-95 transition shadow-lg"
                        >
                          {editingActivityId ? '기타 활동 세부정보 수정 저장' : '기타 활동 저장하기'}
                        </button>
                      </form>
                    </>
                  )}
                </div>

                {/* 우측 7칸: 카테고리별 기타 활동 목록 */}
                <div className="lg:col-span-7 bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-4 h-fit">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-extrabold text-white">
                        등록된 기타 활동 목록 ({myActivities.length}건)
                      </h2>
                      <p className="text-xs text-gray-400">
                        💡 <strong className="text-[#B8FF99]">기타 활동명을 클릭</strong>하면 좌측
                        입력폼으로 불러와 세부정보(설명·링크·기간·비공개)를 즉시 수정할 수 있습니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBoxCollapse('activityListBox')}
                      className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#B8FF99] hover:border-[#B8FF99] flex items-center justify-center transition shrink-0"
                      title="접기/펼치기"
                    >
                      <span
                        className={`inline-block transition-transform duration-200 ${
                          collapsedBoxes['activityListBox'] ? '-rotate-90' : ''
                        }`}
                      >
                        v
                      </span>
                    </button>
                  </div>

                  {!collapsedBoxes['activityListBox'] && (
                    <>
                      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-gray-800">
                        <button
                          type="button"
                          onClick={() => setSelectedActivityCategoryFilter('ALL')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                            selectedActivityCategoryFilter === 'ALL'
                              ? 'bg-[#B8FF99] text-[#0D0D12]'
                              : 'bg-[#0D0D12] text-gray-400 hover:text-white border border-gray-800'
                          }`}
                        >
                          전체 ({myActivities.length})
                        </button>
                        {myActivityCategories.map((cat) => {
                          const count = myActivities.filter((a) => a.category === cat).length;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedActivityCategoryFilter(cat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                                selectedActivityCategoryFilter === cat
                                  ? 'bg-[#B8FF99] text-[#0D0D12]'
                                  : 'bg-[#0D0D12] text-gray-400 hover:text-white border border-gray-800'
                              }`}
                            >
                              {cat} ({count})
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-3">
                        {myActivities
                          .filter(
                            (a) =>
                              selectedActivityCategoryFilter === 'ALL' ||
                              a.category === selectedActivityCategoryFilter
                          )
                          .map((act) => (
                            <div
                              key={act.id}
                              className="p-4 rounded-2xl bg-[#0D0D12] border border-gray-800 hover:border-[#B8FF99]/60 transition space-y-2"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: act.color || '#FFE699' }}
                                  />
                                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#B8FF99]/15 text-[#B8FF99] border border-[#B8FF99]/30">
                                    {act.category}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => startEditActivity(act)}
                                    className="text-sm font-extrabold text-white hover:text-[#B8FF99] underline-offset-4 hover:underline text-left flex items-center gap-1.5"
                                    title="클릭하여 기타 활동 세부정보 수정"
                                  >
                                    {act.title}
                                    <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                                  </button>
                                  {act.isPrivate ? (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FFB2D0]/15 text-[#FFB2D0] border border-[#FFB2D0]/40 flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> 친구 비공개 (ADMIN만 열람 가능)
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-800 text-gray-300">
                                      친구 공개
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  <span className="text-[11px] font-mono text-[#FFE699] bg-[#FFE699]/10 px-2.5 py-1 rounded-lg border border-[#FFE699]/30">
                                    기간: {act.startDate} ~ {act.endDate}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteActivity(act.id, act.title)}
                                    className="p-2 rounded-xl bg-[#161622] hover:bg-gray-800 text-gray-300 hover:text-[#FFB2D0] transition"
                                    title="기타 활동 삭제"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {act.description && (
                                <p className="text-xs text-gray-300 pl-1">📝 {act.description}</p>
                              )}

                              {act.link && (
                                <div className="pl-1">
                                  <a
                                    href={
                                      act.link.startsWith('http') ? act.link : `https://${act.link}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-[#99E6FF] hover:underline font-mono"
                                  >
                                    <Link2 className="w-3.5 h-3.5" />
                                    {act.link}
                                  </a>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(act.schedules || []).map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161622] text-gray-300 border border-gray-800"
                                  >
                                    {s.day} {s.startTime}~{s.endTime}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 1-2. 성적 예측 전용 탭 (<조건 3> 각 박스 우측 상단 'v' 버튼) */}
            {activeToolCategory === 'PREDICTION' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-[#151521] border border-[#FFE699]/35 rounded-2xl p-6 space-y-6 h-fit">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-4">
                    <div>
                      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-[#FFE699]" />
                        {editingPredictionId ? '성적 예측 데이터 수정' : '과목별 성적 예측 시뮬레이터'}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        시험·출석·과제 점수와 성적 비율을 입력하고, 시험 평균·표준편차 입력 시{' '}
                        <strong className="text-[#FFE699]">시험 성적만으로 예상 백분위</strong>를
                        정밀 계산하여 저장합니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {editingPredictionId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPredictionId(null);
                            setPredictionForm({
                              courseName: '',
                              credits: 3,
                              totalStudents: 50,
                              evaluationItems: DEFAULT_EVALUATION_ITEMS,
                              gradeCutoffs: DEFAULT_GRADE_CUTOFFS
                            });
                          }}
                          className="text-xs text-[#FFB2D0] hover:underline"
                        >
                          새 예측 작성
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('predictionSimulatorBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#FFE699] hover:border-[#FFE699] flex items-center justify-center transition"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['predictionSimulatorBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>
                  </div>

                  {!collapsedBoxes['predictionSimulatorBox'] && (
                    <form onSubmit={handleSavePrediction} className="space-y-6">
                      {/* 과목 선택/입력 및 <조건 4> 수강 인원 설정 (Default: 50명) */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-6">
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            예측할 과목명 (직접 입력 또는 내 수강과목 선택)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={predictionForm.courseName}
                              onChange={(e) =>
                                setPredictionForm({ ...predictionForm, courseName: e.target.value })
                              }
                              placeholder="예: 운영체제, 알고리즘"
                              className="flex-1 rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#FFE699] focus:outline-none"
                            />
                            {courses.length > 0 && (
                              <select
                                value=""
                                onChange={(e) => {
                                  const selected = courses.find(
                                    (c) => String(c.id) === e.target.value
                                  );
                                  if (selected) {
                                    setPredictionForm((prev) => ({
                                      ...prev,
                                      courseName: selected.courseName,
                                      credits: selected.credits
                                    }));
                                  }
                                }}
                                className="rounded-xl bg-[#0D0D12] border border-gray-700 px-2.5 py-2 text-xs text-gray-300 focus:border-[#FFE699] focus:outline-none"
                              >
                                <option value="">내 과목 불러오기</option>
                                {courses.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.courseName} ({c.credits}학점)
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            학점 수
                          </label>
                          <select
                            value={predictionForm.credits}
                            onChange={(e) =>
                              setPredictionForm({
                                ...predictionForm,
                                credits: Number(e.target.value)
                              })
                            }
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3 py-2.5 text-sm text-white focus:border-[#FFE699] focus:outline-none"
                          >
                            {[1, 2, 3, 4].map((cr) => (
                              <option key={cr} value={cr}>
                                {cr}학점
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-xs font-semibold text-[#FFE699] mb-1">
                            수강 인원 (기본 50명)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={500}
                              value={predictionForm.totalStudents}
                              onChange={(e) =>
                                setPredictionForm({
                                  ...predictionForm,
                                  totalStudents: e.target.value
                                })
                              }
                              className="w-full rounded-xl bg-[#0D0D12] border border-[#FFE699]/50 px-3 py-2.5 text-sm font-mono font-bold text-white focus:border-[#FFE699] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setPredictionForm((prev) => ({ ...prev, totalStudents: 50 }))
                              }
                              className="px-2 py-2 rounded-lg bg-[#0D0D12] border border-gray-700 text-[10px] text-gray-400 hover:text-white shrink-0"
                              title="기본값 50명으로 초기화"
                            >
                              50명
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <label className="text-xs font-extrabold text-[#A8FFDB]">
                              📊 평가 항목별 점수 및 반영 비율 입력 (현재 반영 비율 합계:{' '}
                              <span
                                className={
                                  livePredictionCalculation.totalWeightSum === 100
                                    ? 'text-[#A8FFDB]'
                                    : 'text-[#FFB2D0]'
                                }
                              >
                                {livePredictionCalculation.totalWeightSum}%
                              </span>
                              )
                            </label>
                            <p className="text-[11px] text-gray-400">
                              💡 <strong>시험(EXAM)</strong> 항목에{' '}
                              <strong className="text-[#FFE699]">평균과 표준편차</strong>를 입력하면
                              출석/과제를 제외하고 <strong>오직 시험 성적만으로 예상 백분위</strong>를
                              산출합니다.
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAddEvaluationItem('EXAM')}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FFE699]/15 text-[#FFE699] border border-[#FFE699]/40 text-xs font-bold hover:bg-[#FFE699] hover:text-[#0D0D12] transition"
                            >
                              + 시험 항목 추가
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddEvaluationItem('ATTENDANCE')}
                              className="px-2.5 py-1.5 rounded-lg bg-[#A8FFDB]/15 text-[#A8FFDB] border border-[#A8FFDB]/40 text-xs font-bold hover:bg-[#A8FFDB] hover:text-[#0D0D12] transition"
                            >
                              + 출석/과제 추가
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {predictionForm.evaluationItems.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="p-3.5 rounded-2xl bg-[#0D0D12] border border-gray-800 space-y-2.5"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] text-gray-400 mb-0.5">
                                    구분
                                  </label>
                                  <select
                                    value={item.category}
                                    onChange={(e) =>
                                      handleUpdateEvaluationItem(idx, 'category', e.target.value)
                                    }
                                    className="w-full rounded-lg bg-[#161622] border border-gray-700 px-2.5 py-1.5 text-xs font-bold text-white"
                                  >
                                    <option value="EXAM">🎯 시험 (백분위 반영)</option>
                                    <option value="ATTENDANCE">✅ 출석 점수</option>
                                    <option value="ASSIGNMENT">📁 과제 / 기타</option>
                                  </select>
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] text-gray-400 mb-0.5">
                                    항목명
                                  </label>
                                  <input
                                    type="text"
                                    value={item.label}
                                    onChange={(e) =>
                                      handleUpdateEvaluationItem(idx, 'label', e.target.value)
                                    }
                                    className="w-full rounded-lg bg-[#161622] border border-gray-700 px-2.5 py-1.5 text-xs text-white"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] text-gray-400 mb-0.5">
                                    내 점수
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.score}
                                    onChange={(e) =>
                                      handleUpdateEvaluationItem(idx, 'score', e.target.value)
                                    }
                                    className="w-full rounded-lg bg-[#161622] border border-gray-700 px-2.5 py-1.5 text-xs font-mono text-[#A8FFDB] font-bold"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] text-gray-400 mb-0.5">
                                    만점 기준
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.maxScore}
                                    onChange={(e) =>
                                      handleUpdateEvaluationItem(idx, 'maxScore', e.target.value)
                                    }
                                    className="w-full rounded-lg bg-[#161622] border border-gray-700 px-2.5 py-1.5 text-xs font-mono text-gray-300"
                                  />
                                </div>

                                <div className="sm:col-span-2 flex items-end gap-1">
                                  <div className="flex-1">
                                    <label className="block text-[10px] text-gray-400 mb-0.5">
                                      반영비율(%)
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={item.weight}
                                      onChange={(e) =>
                                        handleUpdateEvaluationItem(idx, 'weight', e.target.value)
                                      }
                                      className="w-full rounded-lg bg-[#161622] border border-gray-700 px-2 py-1.5 text-xs font-mono text-[#D4B2FF] font-bold"
                                    />
                                  </div>
                                  {predictionForm.evaluationItems.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveEvaluationItem(idx)}
                                      className="p-1.5 text-gray-500 hover:text-[#FFB2D0]"
                                      title="항목 삭제"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {item.category === 'EXAM' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-800/80 bg-[#151521]/60 p-2.5 rounded-xl">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-[#FFE699]">
                                      📐 시험 평균 (선택 입력):
                                    </span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      placeholder="미입력 시 비워둠 (예: 74)"
                                      value={item.mean}
                                      onChange={(e) =>
                                        handleUpdateEvaluationItem(idx, 'mean', e.target.value)
                                      }
                                      className="w-36 rounded-lg bg-[#0D0D12] border border-[#FFE699]/40 px-2.5 py-1 text-xs font-mono text-white"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-[#FFE699]">
                                      📏 시험 표준편차 (선택 입력):
                                    </span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0.1"
                                      placeholder="미입력 시 비워둠 (예: 11)"
                                      value={item.stdDev}
                                      onChange={(e) =>
                                        handleUpdateEvaluationItem(idx, 'stdDev', e.target.value)
                                      }
                                      className="w-36 rounded-lg bg-[#0D0D12] border border-[#FFE699]/40 px-2.5 py-1 text-xs font-mono text-white"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-gray-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-extrabold text-[#D4B2FF]">
                              🏅 등급별 성적 비율 설정 (상위 누적 % 기준)
                            </label>
                            <p className="text-[11px] text-gray-400">
                              교수님 강의계획서의 상대평가/절대평가 등급 컷 비율(%)을 직접 조정할 수
                              있습니다.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPredictionForm((prev) => ({
                                ...prev,
                                gradeCutoffs: DEFAULT_GRADE_CUTOFFS
                              }))
                            }
                            className="text-[11px] text-gray-400 hover:text-white underline"
                          >
                            기본 비율로 초기화
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D'].map((gradeKey) => (
                            <div
                              key={gradeKey}
                              className="p-2.5 rounded-xl bg-[#0D0D12] border border-gray-800 flex items-center justify-between gap-2"
                            >
                              <span className="text-xs font-extrabold text-[#A8FFDB]">
                                {gradeKey} 컷
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-400">상위</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={predictionForm.gradeCutoffs[gradeKey] ?? 100}
                                  onChange={(e) =>
                                    setPredictionForm((prev) => ({
                                      ...prev,
                                      gradeCutoffs: {
                                        ...prev.gradeCutoffs,
                                        [gradeKey]: Number(e.target.value)
                                      }
                                    }))
                                  }
                                  className="w-14 rounded-lg bg-[#161622] border border-gray-700 px-2 py-1 text-xs font-mono text-right text-white"
                                />
                                <span className="text-xs text-gray-400">%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#FFE699] via-[#A8FFDB] to-[#D4B2FF] text-[#0D0D12] hover:opacity-95 transition shadow-lg flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {editingPredictionId
                          ? '성적 예측 수정 내용 저장하기'
                          : '계산된 성적 예측 결과 저장하기'}
                      </button>
                    </form>
                  )}
                </div>

                {/* 우측 5칸: 실시간 예측 결과 대시보드 & 저장된 성적 예측 목록 */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-[#151521] border border-[#A8FFDB]/40 rounded-2xl p-6 space-y-5 shadow-[0_0_30px_rgba(168,255,219,0.06)]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#A8FFDB]" />
                        실시간 성적 예측 분석 결과
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFE699]/15 text-[#FFE699] border border-[#FFE699]/40">
                          수강 인원 {livePredictionCalculation.totalStudents}명 기준
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleBoxCollapse('predictionLiveResultBox')}
                          className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition"
                          title="접기/펼치기"
                        >
                          <span
                            className={`inline-block transition-transform duration-200 ${
                              collapsedBoxes['predictionLiveResultBox'] ? '-rotate-90' : ''
                            }`}
                          >
                            v
                          </span>
                        </button>
                      </div>
                    </div>

                    {!collapsedBoxes['predictionLiveResultBox'] && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-2xl bg-[#0D0D12] border border-[#A8FFDB]/40 text-center space-y-1">
                            <div className="text-xs text-gray-400">예상 최종 성적 등급</div>
                            <div className="text-3xl font-black text-[#A8FFDB]">
                              {livePredictionCalculation.predictedGrade}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              평점 {livePredictionCalculation.predictedGradePoint.toFixed(1)} / 4.5
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-[#0D0D12] border border-[#FFE699]/40 text-center space-y-1">
                            <div className="text-xs text-gray-400">
                              {livePredictionCalculation.usedExamStat
                                ? '시험 단독 예상 백분위'
                                : '예상 상위 백분위'}
                            </div>
                            <div className="text-2xl font-black text-[#FFE699]">
                              상위 {livePredictionCalculation.examOnlyTopPercentile}%
                            </div>
                            <div className="text-[11px] text-gray-300 font-semibold">
                              약 {livePredictionCalculation.totalStudents}명 중{' '}
                              <span className="text-white font-extrabold">
                                {livePredictionCalculation.estimatedRank}등
                              </span>{' '}
                              예상
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#0D0D12] border border-gray-800 space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">총점 환산 점수 (출석·과제·시험 합산)</span>
                            <span className="font-mono font-extrabold text-white text-sm">
                              {livePredictionCalculation.calculatedTotalScore}점 /{' '}
                              {livePredictionCalculation.totalWeightSum}점
                            </span>
                          </div>

                          <div className="pt-2 border-t border-gray-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[#FFE699] font-bold">
                                📌 백분위 산출 방식 (조건 5 적용)
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#FFE699]/15 text-[#FFE699] font-bold text-[11px]">
                                {livePredictionCalculation.usedExamStat
                                  ? '정규분포(Z-score) 시험 성적 단독 계산'
                                  : '시험 평균·표준편차 미입력 (득점률 추정)'}
                              </span>
                            </div>
                            {livePredictionCalculation.usedExamStat && (
                              <p className="text-[11px] text-gray-400 leading-relaxed">
                                입력하신 시험 평균과 표준편차를 바탕으로 출석·과제 점수를 배제하고{' '}
                                <strong className="text-white">
                                  오직 시험 성적(종합 Z-점수: {livePredictionCalculation.compositeZScore}
                                  )만으로 계산된 상위 백분위
                                </strong>
                                입니다.
                              </p>
                            )}

                            {livePredictionCalculation.examDetails.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {livePredictionCalculation.examDetails.map((ed, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161622] text-gray-300 border border-gray-800"
                                  >
                                    {ed.label}: Z={ed.zScore} (상위 {ed.topPercentile}%)
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 저장된 성적 예측 목록 */}
                  <div className="bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                          <Award className="w-5 h-5 text-[#D4B2FF]" />
                          저장된 성적 예측 보관함 ({savedPredictions.length}건)
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          저장된 예측 등급들을 모두 반영할 경우 예상 총 평점(GPA):{' '}
                          <strong className="text-[#A8FFDB]">{simulatedGpaWithPredictions}</strong>{' '}
                          / 4.5
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('predictionSavedListBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#D4B2FF] hover:border-[#D4B2FF] flex items-center justify-center transition shrink-0"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['predictionSavedListBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>

                    {!collapsedBoxes['predictionSavedListBox'] && (
                      <>
                        {savedPredictions.length === 0 ? (
                          <div className="p-8 rounded-2xl bg-[#0D0D12] border border-gray-800 text-center text-xs text-gray-500">
                            아직 저장된 성적 예측 내역이 없습니다. 좌측에서 점수와 비율을 입력한 뒤{' '}
                            <strong className="text-gray-300">저장하기</strong>를 눌러보세요!
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                            {savedPredictions.map((pred) => (
                              <div
                                key={pred.id}
                                className="p-4 rounded-2xl bg-[#0D0D12] border border-gray-800 hover:border-[#FFE699]/50 transition space-y-2.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-extrabold text-white">
                                      {pred.courseName}
                                    </span>
                                    <span className="text-xs text-gray-400">({pred.credits}학점)</span>
                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                                      수강인원 {pred.totalStudents}명
                                    </span>
                                  </div>

                                  <span className="px-3 py-1 rounded-xl bg-[#A8FFDB]/15 text-[#A8FFDB] border border-[#A8FFDB]/40 text-xs font-black">
                                    예상 {pred.predictedGrade}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
                                  <span className="px-2 py-0.5 rounded bg-[#FFE699]/10 text-[#FFE699] font-mono">
                                    시험 상위 {pred.examOnlyTopPercentile}% (약 {pred.estimatedRank}등/
                                    {pred.totalStudents}명)
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-[#D4B2FF]/10 text-[#D4B2FF] font-mono">
                                    총 환산점수 {pred.calculatedTotalScore}점
                                  </span>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-gray-800/80">
                                  <span className="text-[11px] text-gray-500">
                                    저장 시각: {pred.updatedAt || '방금 전'}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPredictedGradeToCourse(pred)}
                                      className="px-2.5 py-1 rounded-lg bg-[#A8FFDB]/15 text-[#A8FFDB] hover:bg-[#A8FFDB] hover:text-[#0D0D12] text-[11px] font-extrabold transition"
                                    >
                                      내 과목 성적에 반영
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleLoadPredictionToEdit(pred)}
                                      className="px-2.5 py-1 rounded-lg bg-[#161622] text-gray-300 hover:text-white text-[11px] font-bold"
                                    >
                                      불러오기/수정
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeletePrediction(pred.id, pred.courseName)
                                      }
                                      className="p-1 text-gray-500 hover:text-[#FFB2D0]"
                                      title="삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. 친구 기능 탭 (<조건 3> 각 박스 우측 상단 'v' 버튼) */}
            {activeToolCategory === 'FRIEND' && (
              <div className="space-y-6">
                <div className="bg-[#151521] border border-[#99E6FF]/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-extrabold text-[#99E6FF] flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        친구에게 보여주는 나의 상태메시지
                      </span>
                      <p className="text-xs text-gray-400">
                        친구 목록과 내 시간표 상단에 상태메시지가 표시됩니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBoxCollapse('friendStatusBox')}
                      className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#99E6FF] hover:border-[#99E6FF] flex items-center justify-center transition shrink-0"
                      title="접기/펼치기"
                    >
                      <span
                        className={`inline-block transition-transform duration-200 ${
                          collapsedBoxes['friendStatusBox'] ? '-rotate-90' : ''
                        }`}
                      >
                        v
                      </span>
                    </button>
                  </div>

                  {!collapsedBoxes['friendStatusBox'] && (
                    <form onSubmit={handleSaveStatusMessage} className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={100}
                        value={myStatusDraft}
                        onChange={(e) => setMyStatusDraft(e.target.value)}
                        placeholder="친구들에게 보여줄 상태메시지를 입력하세요..."
                        className="flex-1 rounded-xl bg-[#0D0D12] border border-gray-700 px-4 py-2.5 text-sm text-white focus:border-[#99E6FF] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-[#99E6FF] text-[#0D0D12] font-extrabold text-xs hover:opacity-90 transition shrink-0"
                      >
                        상태메시지 저장
                      </button>
                    </form>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFriendSubTab('LIST')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                      friendSubTab === 'LIST'
                        ? 'bg-[#A8FFDB] text-[#0D0D12]'
                        : 'bg-[#151521] text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    친구 목록 ({friendData.myFriends.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFriendSubTab('REQUESTS')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                      friendSubTab === 'REQUESTS'
                        ? 'bg-[#D4B2FF] text-[#0D0D12]'
                        : 'bg-[#151521] text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    친구 신청 관리 (받은 신청 {friendData.incomingRequests.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFriendSubTab('ADD')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                      friendSubTab === 'ADD'
                        ? 'bg-[#99E6FF] text-[#0D0D12]'
                        : 'bg-[#151521] text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    친구 추가 (학과·이름 검색)
                  </button>
                </div>

                {friendSubTab === 'LIST' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-4 h-fit">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#A8FFDB]" />내 친구 목록 (
                            {friendData.myFriends.length}명)
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            친구 이름을 클릭하면 성적 정보를 제외한{' '}
                            <strong className="text-[#A8FFDB]">친구의 강의 타임테이블</strong>을
                            확인하고 시간별 활동을 제안할 수 있습니다.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleBoxCollapse('friendMyListBox')}
                          className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition shrink-0"
                          title="접기/펼치기"
                        >
                          <span
                            className={`inline-block transition-transform duration-200 ${
                              collapsedBoxes['friendMyListBox'] ? '-rotate-90' : ''
                            }`}
                          >
                            v
                          </span>
                        </button>
                      </div>

                      {!collapsedBoxes['friendMyListBox'] && (
                        <>
                          {friendData.myFriends.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-[#0D0D12] border border-gray-800 text-center space-y-2">
                              <p className="text-sm text-gray-400">아직 등록된 친구가 없습니다.</p>
                              <button
                                type="button"
                                onClick={() => setFriendSubTab('ADD')}
                                className="px-4 py-2 rounded-xl bg-[#99E6FF]/15 text-[#99E6FF] text-xs font-bold hover:bg-[#99E6FF] hover:text-[#0D0D12] transition"
                              >
                                학과와 이름으로 친구 추가하기
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {friendData.myFriends.map((friend) => (
                                <div
                                  key={friend.id}
                                  onClick={() => {
                                    setSelectedFriendForModal(friend);
                                    setProposalDraft({
                                      isOpen: false,
                                      day: '월',
                                      startTime: '12:00',
                                      endTime: '13:00',
                                      content: ''
                                    });
                                  }}
                                  className="p-4 rounded-2xl bg-[#0D0D12] border border-gray-800 hover:border-[#A8FFDB] cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                >
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#A8FFDB]/10 text-[#A8FFDB] border border-[#A8FFDB]/30">
                                        {friend.department}
                                      </span>
                                      <span className="text-base font-extrabold text-white group-hover:text-[#A8FFDB] transition underline-offset-4 group-hover:underline">
                                        {friend.name}
                                      </span>
                                      {friend.hasDuplicateSameName && friend.maskedStudentId && (
                                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#D4B2FF]/15 text-[#D4B2FF] border border-[#D4B2FF]/40">
                                          학번: {friend.maskedStudentId}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                      💬 {friend.statusMessage || '등록된 상태메시지가 없습니다.'}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-center">
                                    <span className="px-3 py-1.5 rounded-xl bg-[#161622] group-hover:bg-[#A8FFDB] text-xs font-extrabold text-[#A8FFDB] group-hover:text-[#0D0D12] transition flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5" />
                                      타임테이블 & 활동 제안
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="lg:col-span-5 bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-4 h-fit">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            <CalendarPlus className="w-5 h-5 text-[#D4B2FF]" />
                            친구 메시지 및 활동 제안 알림함
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            친구가 제안한 시간별 활동을 수락하거나 거절할 수 있습니다.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleBoxCollapse('friendInteractionsBox')}
                          className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#D4B2FF] hover:border-[#D4B2FF] flex items-center justify-center transition shrink-0"
                          title="접기/펼치기"
                        >
                          <span
                            className={`inline-block transition-transform duration-200 ${
                              collapsedBoxes['friendInteractionsBox'] ? '-rotate-90' : ''
                            }`}
                          >
                            v
                          </span>
                        </button>
                      </div>

                      {!collapsedBoxes['friendInteractionsBox'] && (
                        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                          {interactions.filter(
                            (it) =>
                              it.senderId === currentUser.id || it.receiverId === currentUser.id
                          ).length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-6">
                              주고받은 메시지나 활동 제안이 없습니다.
                            </p>
                          ) : (
                            interactions
                              .filter(
                                (it) =>
                                  it.senderId === currentUser.id || it.receiverId === currentUser.id
                              )
                              .map((item) => {
                                const isReceived = item.receiverId === currentUser.id;
                                const otherUser = accounts.find(
                                  (a) => a.id === (isReceived ? item.senderId : item.receiverId)
                                );
                                return (
                                  <div
                                    key={item.id}
                                    className="p-3.5 rounded-2xl bg-[#0D0D12] border border-gray-800 space-y-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-white">
                                        {isReceived ? '📥 받은 내역' : '📤 보낸 내역'} ·{' '}
                                        <span className="text-[#A8FFDB]">
                                          {otherUser ? otherUser.name : '알 수 없음'}
                                        </span>
                                      </span>
                                      <span className="text-[11px] text-gray-500">
                                        {item.createdAt}
                                      </span>
                                    </div>

                                    {item.type === 'PROPOSAL' && (
                                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D4B2FF]/15 border border-[#D4B2FF]/40 text-xs font-mono text-[#D4B2FF]">
                                        <Clock className="w-3.5 h-3.5" />
                                        {item.day}요일 {item.startTime} ~ {item.endTime} 활동 제안
                                      </div>
                                    )}

                                    <p className="text-xs text-gray-200 leading-relaxed">
                                      {item.content}
                                    </p>

                                    {item.type === 'PROPOSAL' && (
                                      <div className="flex items-center justify-between pt-1">
                                        <span
                                          className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                                            item.status === 'ACCEPTED'
                                              ? 'bg-[#A8FFDB]/15 text-[#A8FFDB]'
                                              : item.status === 'REJECTED'
                                              ? 'bg-[#FFB2D0]/15 text-[#FFB2D0]'
                                              : 'bg-yellow-500/15 text-yellow-300'
                                          }`}
                                        >
                                          {item.status === 'ACCEPTED'
                                            ? '수락됨'
                                            : item.status === 'REJECTED'
                                            ? '거절됨'
                                            : '응답 대기중'}
                                        </span>

                                        {isReceived && item.status === 'PENDING' && (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRespondActivityProposal(item.id, 'ACCEPTED')
                                              }
                                              className="px-2.5 py-1 rounded-lg bg-[#A8FFDB] text-[#0D0D12] text-xs font-extrabold flex items-center gap-1 hover:opacity-90"
                                            >
                                              <Check className="w-3 h-3" /> 수락
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRespondActivityProposal(item.id, 'REJECTED')
                                              }
                                              className="px-2.5 py-1 rounded-lg bg-[#FFB2D0]/20 text-[#FFB2D0] border border-[#FFB2D0]/40 text-xs font-extrabold flex items-center gap-1 hover:bg-[#FFB2D0]/30"
                                            >
                                              <XCircle className="w-3 h-3" /> 거절
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {friendSubTab === 'REQUESTS' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-4 h-fit">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-white">
                          받은 친구 신청 ({friendData.incomingRequests.length}건)
                        </h3>
                        <button
                          type="button"
                          onClick={() => toggleBoxCollapse('friendIncomingBox')}
                          className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition"
                          title="접기/펼치기"
                        >
                          <span
                            className={`inline-block transition-transform duration-200 ${
                              collapsedBoxes['friendIncomingBox'] ? '-rotate-90' : ''
                            }`}
                          >
                            v
                          </span>
                        </button>
                      </div>
                      {!collapsedBoxes['friendIncomingBox'] && (
                        <>
                          {friendData.incomingRequests.length === 0 ? (
                            <p className="text-xs text-gray-500 py-6 text-center">
                              현재 도착한 친구 신청이 없습니다.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {friendData.incomingRequests.map((req) => (
                                <div
                                  key={req.friendshipId}
                                  className="p-4 rounded-2xl bg-[#0D0D12] border border-gray-800 flex items-center justify-between gap-3"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-[#A8FFDB]">
                                        {req.requester.department}
                                      </span>
                                      <span className="text-sm font-extrabold text-white">
                                        {req.requester.name}
                                      </span>
                                      {req.requester.hasDuplicateSameName &&
                                        req.requester.maskedStudentId && (
                                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#D4B2FF]/15 text-[#D4B2FF]">
                                            {req.requester.maskedStudentId}
                                          </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                      {req.requester.statusMessage || '상태메시지 없음'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRespondFriendRequest(req.friendshipId, 'ACCEPT')
                                      }
                                      className="px-3 py-1.5 rounded-xl bg-[#A8FFDB] text-[#0D0D12] text-xs font-extrabold"
                                    >
                                      수락
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRespondFriendRequest(req.friendshipId, 'REJECT')
                                      }
                                      className="px-3 py-1.5 rounded-xl bg-[#FFB2D0]/15 text-[#FFB2D0] border border-[#FFB2D0]/40 text-xs font-extrabold"
                                    >
                                      거절
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-4 h-fit">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-white">
                          내가 보낸 친구 신청 ({friendData.outgoingRequests.length}건)
                        </h3>
                        <button
                          type="button"
                          onClick={() => toggleBoxCollapse('friendOutgoingBox')}
                          className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#99E6FF] hover:border-[#99E6FF] flex items-center justify-center transition"
                          title="접기/펼치기"
                        >
                          <span
                            className={`inline-block transition-transform duration-200 ${
                              collapsedBoxes['friendOutgoingBox'] ? '-rotate-90' : ''
                            }`}
                          >
                            v
                          </span>
                        </button>
                      </div>
                      {!collapsedBoxes['friendOutgoingBox'] && (
                        <>
                          {friendData.outgoingRequests.length === 0 ? (
                            <p className="text-xs text-gray-500 py-6 text-center">
                              대기 중인 보낸 친구 신청이 없습니다.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {friendData.outgoingRequests.map((req) => (
                                <div
                                  key={req.friendshipId}
                                  className="p-4 rounded-2xl bg-[#0D0D12] border border-gray-800 flex items-center justify-between gap-3"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-[#99E6FF]">
                                        {req.receiver.department}
                                      </span>
                                      <span className="text-sm font-extrabold text-white">
                                        {req.receiver.name}
                                      </span>
                                      {req.receiver.hasDuplicateSameName &&
                                        req.receiver.maskedStudentId && (
                                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#D4B2FF]/15 text-[#D4B2FF]">
                                            {req.receiver.maskedStudentId}
                                          </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {req.receiver.statusMessage || '상태메시지 없음'}
                                    </p>
                                  </div>
                                  <span className="text-xs font-bold text-yellow-300 bg-yellow-500/10 px-2.5 py-1 rounded-lg">
                                    수락 대기중
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {friendSubTab === 'ADD' && (
                  <div className="bg-[#151521] border border-[#99E6FF]/30 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-[#99E6FF]" />
                          학과와 이름으로 친구 찾기 및 신청
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          학과와 이름을 입력해 친구를 검색하세요.{' '}
                          <strong className="text-[#D4B2FF]">
                            만약 학과와 이름이 같은 동명이인이 존재할 경우 학번의 맨앞 2자리와 맨뒤
                            3자리가 자동으로 공개
                          </strong>
                          됩니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('friendAddSearchBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#99E6FF] hover:border-[#99E6FF] flex items-center justify-center transition shrink-0"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['friendAddSearchBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>

                    {!collapsedBoxes['friendAddSearchBox'] && (
                      <>
                        <form
                          onSubmit={handleSearchFriends}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
                        >
                          <div className="sm:col-span-5">
                            <label className="block text-xs font-semibold text-gray-300 mb-1">
                              학과
                            </label>
                            <input
                              type="text"
                              value={friendSearchForm.department}
                              onChange={(e) =>
                                setFriendSearchForm({ ...friendSearchForm, department: e.target.value })
                              }
                              placeholder="컴퓨터공학과"
                              className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#99E6FF] focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-5">
                            <label className="block text-xs font-semibold text-gray-300 mb-1">
                              이름
                            </label>
                            <input
                              type="text"
                              value={friendSearchForm.name}
                              onChange={(e) =>
                                setFriendSearchForm({ ...friendSearchForm, name: e.target.value })
                              }
                              placeholder="예: 김민수, 박진, 이서연"
                              className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#99E6FF] focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-end">
                            <button
                              type="submit"
                              className="w-full py-2.5 rounded-xl bg-[#99E6FF] text-[#0D0D12] font-extrabold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 transition"
                            >
                              <Search className="w-4 h-4" /> 검색
                            </button>
                          </div>
                        </form>

                        {hasSearchedFriend && (
                          <div className="space-y-3 pt-2 border-t border-gray-800">
                            {friendSearchResults.length === 0 ? (
                              <p className="text-xs text-gray-400 py-4 text-center">
                                일치하는 학우를 찾을 수 없습니다. 학과와 이름을 다시 확인해 주세요.
                              </p>
                            ) : (
                              friendSearchResults.map((candidate) => (
                                <div
                                  key={candidate.id}
                                  className="p-4 rounded-2xl bg-[#0D0D12] border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#99E6FF]/15 text-[#99E6FF]">
                                        {candidate.department}
                                      </span>
                                      <span className="text-sm font-extrabold text-white">
                                        {candidate.name}
                                      </span>
                                      {candidate.hasDuplicateSameName && candidate.maskedStudentId && (
                                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-[#D4B2FF]/20 text-[#D4B2FF] border border-[#D4B2FF]/50">
                                          동명이인 구분 학번: {candidate.maskedStudentId}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                      💬 {candidate.statusMessage || '상태메시지 없음'}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleSendFriendRequest(candidate)}
                                    className="px-4 py-2 rounded-xl bg-[#A8FFDB] text-[#0D0D12] text-xs font-extrabold hover:opacity-90 transition flex items-center gap-1.5 self-end sm:self-center"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" /> 친구 신청 보내기
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2-2. 그룹 기능 탭 (<조건 3> 각 박스 우측 상단 'v' 버튼) */}
            {activeToolCategory === 'GROUP' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-6">
                  {/* 그룹 생성 박스 */}
                  <div className="bg-[#151521] border border-[#A8FFDB]/35 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#A8FFDB]" />새 그룹 만들기
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          그룹을 생성하면 자동으로{' '}
                          <strong className="text-[#A8FFDB]">그룹 최고 관리자(OWNER)</strong>가 됩니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('groupCreateBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition shrink-0"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['groupCreateBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>

                    {!collapsedBoxes['groupCreateBox'] && (
                      <form onSubmit={handleCreateStudyGroup} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            그룹 이름 <span className="text-[#FFB2D0]">*</span>
                          </label>
                          <input
                            type="text"
                            value={groupForm.name}
                            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                            placeholder="예: 운영체제 A+ 스터디, 캡스톤 팀"
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2 text-xs text-white focus:border-[#A8FFDB] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            그룹 소개
                          </label>
                          <input
                            type="text"
                            value={groupForm.description}
                            onChange={(e) =>
                              setGroupForm({ ...groupForm, description: e.target.value })
                            }
                            placeholder="그룹 활동 목적이나 규칙을 간단히 적어주세요"
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2 text-xs text-white focus:border-[#A8FFDB] focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setGroupForm({ ...groupForm, isPrivate: false })}
                            className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                              !groupForm.isPrivate
                                ? 'bg-[#A8FFDB]/15 border-[#A8FFDB] text-[#A8FFDB]'
                                : 'bg-[#0D0D12] border-gray-800 text-gray-400'
                            }`}
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            공개 그룹 (즉시가입)
                          </button>
                          <button
                            type="button"
                            onClick={() => setGroupForm({ ...groupForm, isPrivate: true })}
                            className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                              groupForm.isPrivate
                                ? 'bg-[#FFB2D0]/15 border-[#FFB2D0] text-[#FFB2D0]'
                                : 'bg-[#0D0D12] border-gray-800 text-gray-400'
                            }`}
                          >
                            <Lock className="w-3.5 h-3.5" />
                            비공개 (승인필요)
                          </button>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#A8FFDB] to-[#99E6FF] text-[#0D0D12] font-extrabold text-xs hover:opacity-95 transition shadow-md"
                        >
                          + 그룹 생성 및 관리자 시작하기
                        </button>
                      </form>
                    )}
                  </div>

                  {/* 전체 그룹 목록 */}
                  <div className="bg-[#151521] border border-gray-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-white">
                          전체 그룹 목록 ({studyGroups.length}개)
                        </h3>
                        <span className="text-[11px] text-gray-400">인원 0명 시 자동 삭제</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('groupListBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition shrink-0"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['groupListBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>

                    {!collapsedBoxes['groupListBox'] && (
                      <>
                        {studyGroups.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-6">
                            현재 생성된 그룹이 없습니다. 위에서 첫 그룹을 만들어 보세요!
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {studyGroups.map((g) => {
                              const activeCount = (g.members || []).filter(
                                (m) => m.status === 'ACTIVE'
                              ).length;
                              const pendingCount = (g.members || []).filter(
                                (m) => m.status === 'PENDING'
                              ).length;
                              const myRel = (g.members || []).find(
                                (m) => m.userId === currentUser.id
                              );
                              const isSelected = activeGroup?.id === g.id;

                              return (
                                <div
                                  key={g.id}
                                  onClick={() => setSelectedGroupId(g.id)}
                                  className={`p-3.5 rounded-2xl border cursor-pointer transition space-y-2 ${
                                    isSelected
                                      ? 'bg-[#1E1E2E] border-[#A8FFDB]'
                                      : 'bg-[#0D0D12] border-gray-800 hover:border-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 truncate">
                                      {g.isPrivate ? (
                                        <span className="px-2 py-0.5 rounded bg-[#FFB2D0]/15 text-[#FFB2D0] border border-[#FFB2D0]/40 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                                          <Lock className="w-2.5 h-2.5" /> 비공개
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded bg-[#A8FFDB]/15 text-[#A8FFDB] border border-[#A8FFDB]/40 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                                          <Unlock className="w-2.5 h-2.5" /> 공개
                                        </span>
                                      )}
                                      <span className="text-xs font-extrabold text-white truncate">
                                        {g.name}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-mono text-gray-400 shrink-0">
                                      {activeCount}명
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-gray-400 line-clamp-1">
                                    {g.description}
                                  </p>

                                  <div className="flex items-center justify-between pt-1">
                                    {myRel ? (
                                      <span
                                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                          myRel.status === 'PENDING'
                                            ? 'bg-yellow-500/15 text-yellow-300'
                                            : myRel.role === 'OWNER'
                                            ? 'bg-[#A8FFDB] text-[#0D0D12]'
                                            : myRel.role === 'MANAGER'
                                            ? 'bg-[#D4B2FF]/20 text-[#D4B2FF]'
                                            : 'bg-gray-800 text-gray-300'
                                        }`}
                                      >
                                        {myRel.status === 'PENDING'
                                          ? '⏳ 가입 승인 대기중'
                                          : myRel.role === 'OWNER'
                                          ? '👑 최고 관리자'
                                          : myRel.role === 'MANAGER'
                                          ? '🛡️ 부관리자'
                                          : '✅ 그룹원'}
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleJoinStudyGroup(g);
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-[#99E6FF] text-[#0D0D12] text-[11px] font-extrabold hover:opacity-90"
                                      >
                                        {g.isPrivate ? '가입 허락 신청' : '즉시 가입하기'}
                                      </button>
                                    )}

                                    {pendingCount > 0 &&
                                      (myRel?.role === 'OWNER' || myRel?.canManageRoles) && (
                                        <span className="text-[10px] font-bold text-[#FFB2D0]">
                                          가입신청 {pendingCount}건 대기
                                        </span>
                                      )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 우측 8칸: 선택된 그룹 상세 화면 */}
                <div className="lg:col-span-8 bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-5 h-fit">
                  {!activeGroup ? (
                    <div className="p-12 text-center text-xs text-gray-500">
                      선택된 그룹이 없습니다. 좌측에서 그룹을 선택하거나 새로 생성해 주세요.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                                activeGroup.isPrivate
                                  ? 'bg-[#FFB2D0]/15 text-[#FFB2D0] border border-[#FFB2D0]/40'
                                  : 'bg-[#A8FFDB]/15 text-[#A8FFDB] border border-[#A8FFDB]/40'
                              }`}
                            >
                              {activeGroup.isPrivate ? '🔒 비공개 그룹 (승인제)' : '🌐 공개 그룹'}
                            </span>
                            <h2 className="text-lg font-extrabold text-white">
                              {activeGroup.name}
                            </h2>
                            <span className="text-xs text-gray-400">
                              (현재 그룹원{' '}
                              {
                                (activeGroup.members || []).filter((m) => m.status === 'ACTIVE')
                                  .length
                              }
                              명)
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{activeGroup.description}</p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {!myMembershipInActiveGroup ? (
                            <button
                              type="button"
                              onClick={() => handleJoinStudyGroup(activeGroup)}
                              className="px-4 py-2 rounded-xl bg-[#A8FFDB] text-[#0D0D12] text-xs font-extrabold hover:opacity-90"
                            >
                              {activeGroup.isPrivate ? '가입 승인 신청하기' : '그룹 즉시 가입하기'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleGroupMemberStatusAction(
                                  activeGroup.id,
                                  currentUser.id,
                                  'REMOVE_OR_LEAVE'
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-[#FFB2D0]/15 text-[#FFB2D0] border border-[#FFB2D0]/40 text-xs font-extrabold hover:bg-[#FFB2D0] hover:text-[#0D0D12] transition"
                              title="남은 인원이 0명이 되면 그룹이 자동으로 삭제됩니다"
                            >
                              그룹 나가기 (0명 시 자동삭제)
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleBoxCollapse('groupDetailBox')}
                            className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition"
                            title="접기/펼치기"
                          >
                            <span
                              className={`inline-block transition-transform duration-200 ${
                                collapsedBoxes['groupDetailBox'] ? '-rotate-90' : ''
                              }`}
                            >
                              v
                            </span>
                          </button>
                        </div>
                      </div>

                      {!collapsedBoxes['groupDetailBox'] && (
                        <>
                          {/* 그룹 내부 서브탭 */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setGroupInnerTab('BOARD')}
                              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                                groupInnerTab === 'BOARD'
                                  ? 'bg-[#A8FFDB] text-[#0D0D12]'
                                  : 'bg-[#0D0D12] text-gray-400 hover:text-white border border-gray-800'
                              }`}
                            >
                              📋 그룹 게시판 ({(activeGroup.posts || []).length})
                            </button>

                            <button
                              type="button"
                              onClick={() => setGroupInnerTab('MEMBERS')}
                              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                                groupInnerTab === 'MEMBERS'
                                  ? 'bg-[#99E6FF] text-[#0D0D12]'
                                  : 'bg-[#0D0D12] text-gray-400 hover:text-white border border-gray-800'
                              }`}
                            >
                              👥 그룹원 목록 & 빠른 친구추가/메시지 (
                              {
                                (activeGroup.members || []).filter((m) => m.status === 'ACTIVE')
                                  .length
                              }
                              명)
                            </button>

                            {(myMembershipInActiveGroup?.role === 'OWNER' ||
                              myMembershipInActiveGroup?.canManageRoles ||
                              currentUser.role === 'ADMIN') && (
                              <button
                                type="button"
                                onClick={() => setGroupInnerTab('ROLES')}
                                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                                  groupInnerTab === 'ROLES'
                                    ? 'bg-[#D4B2FF] text-[#0D0D12]'
                                    : 'bg-[#0D0D12] text-gray-400 hover:text-white border border-gray-800'
                                }`}
                              >
                                🛡️ 그룹원 관리 & 세부 권한 임명
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 2-3. 졸업요건 (EPiC folio & 총 이수학점) 탭 (<조건 3> 각 박스 우측 상단 'v' 버튼) */}
            {activeToolCategory === 'GRADUATION' && (
              <div className="space-y-6">
                <div className="bg-[#151521] border border-[#FFE699]/40 rounded-2xl p-6 space-y-6 shadow-[0_0_30px_rgba(255,230,153,0.06)]">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800 pb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-[#A8FFDB]/15 text-[#A8FFDB] border border-[#A8FFDB]/40 text-xs font-extrabold">
                          {currentUser.department} · {graduationStandardsAndProgress.entryYear}학번 (
                          {graduationStandardsAndProgress.studentYearPrefix}학번 자동 인식)
                        </span>
                        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-[#FFE699]" />
                          맞춤형 졸업요건 & 서울과기대 EPiC folio 시뮬레이터
                        </h2>
                      </div>
                      <p className="text-xs text-gray-400">
                        개인정보의 학번({currentUser.studentId})으로 입학년도를 자동 판별하여 졸업
                        기준을 적용하며, 성적이 확정된 과목들의 총 학점과 EPiC folio(이수 완료 +
                        이수 희망) 점수를 계산합니다.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start lg:self-center">
                      <div className="flex items-center gap-2 bg-[#0D0D12] p-1.5 rounded-2xl border border-gray-800">
                        <button
                          type="button"
                          onClick={() => handleChangeAdmissionType('REGULAR')}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                            graduationStandardsAndProgress.admissionType === 'REGULAR'
                              ? 'bg-[#A8FFDB] text-[#0D0D12] shadow-md'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          🎓 신입학 (재학생 기준)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeAdmissionType('TRANSFER')}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                            graduationStandardsAndProgress.admissionType === 'TRANSFER'
                              ? 'bg-[#FFE699] text-[#0D0D12] shadow-md'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          🔄 편입생 (EPiC 50% 감면 기준)
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('gradSummaryBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#FFE699] hover:border-[#FFE699] flex items-center justify-center transition"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['gradSummaryBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>
                  </div>

                  {!collapsedBoxes['gradSummaryBox'] && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* 카드 1: 학기가 끝나고 평점이 나온 과목들의 총 이수 학점 */}
                      <div className="p-5 rounded-2xl bg-[#0D0D12] border border-[#D4B2FF]/40 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-extrabold text-[#D4B2FF]">
                              📚 1. 총 졸업 이수 학점 (평점 확정 과목 합산)
                            </span>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              &apos;현재 이수 중&apos;이거나 수강포기(W)·F인 과목을 제외하고 학기가 끝나 평점이
                              나온 과목 학점만 계산합니다.
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-xl bg-[#D4B2FF]/15 text-[#D4B2FF] border border-[#D4B2FF]/40 text-xs font-black shrink-0">
                            {graduationStandardsAndProgress.entryYear}학번 기준:{' '}
                            {graduationStandardsAndProgress.requiredTotalCredits}학점
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-1">
                          <div>
                            <span className="text-3xl font-black text-white">
                              {academicStats.totalEarnedCredits}
                            </span>
                            <span className="text-sm text-gray-400 font-bold">
                              {' '}
                              / {graduationStandardsAndProgress.requiredTotalCredits} 학점
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#A8FFDB]">
                            {academicStats.totalEarnedCredits >=
                            graduationStandardsAndProgress.requiredTotalCredits
                              ? '🎉 졸업 학점 요건 충족 완료!'
                              : `졸업까지 ${
                                  graduationStandardsAndProgress.requiredTotalCredits -
                                  academicStats.totalEarnedCredits
                                }학점 남음 (현재 학기 수강 중: ${academicStats.currentSemesterCredits}학점)`}
                          </span>
                        </div>

                        <div className="w-full h-3 rounded-full bg-[#161622] overflow-hidden border border-gray-800">
                          <div
                            className="h-full bg-gradient-to-r from-[#D4B2FF] to-[#A8FFDB] transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (academicStats.totalEarnedCredits /
                                    graduationStandardsAndProgress.requiredTotalCredits) *
                                    100
                                )
                              )}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* 카드 2: EPiC folio 졸업인증 점수 */}
                      <div className="p-5 rounded-2xl bg-[#0D0D12] border border-[#A8FFDB]/40 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-extrabold text-[#A8FFDB]">
                              🏆 2. 서울과기대 EPiC folio 졸업인증 점수
                            </span>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              이수 완료한 활동 점수에{' '}
                              <strong className="text-[#FFE699]">이수하고 싶은 활동(희망)</strong>을
                              더해 이수 시 몇 점이 되는지 즉시 시뮬레이션합니다.
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-xl bg-[#A8FFDB]/15 text-[#A8FFDB] border border-[#A8FFDB]/40 text-xs font-black shrink-0">
                            {graduationStandardsAndProgress.admissionType === 'TRANSFER'
                              ? '편입생 기준'
                              : `${graduationStandardsAndProgress.entryYear}학번 재학생 기준`}
                            : {graduationStandardsAndProgress.requiredEpicScore}점
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                          <div className="p-2.5 rounded-xl bg-[#151521] border border-gray-800 text-center">
                            <div className="text-[11px] text-gray-400">현재 이수 완료</div>
                            <div className="text-xl font-black text-[#A8FFDB]">
                              {graduationStandardsAndProgress.currentEpicScore}점
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#151521] border border-[#FFE699]/40 text-center">
                            <div className="text-[11px] text-[#FFE699]">+ 이수 희망 활동</div>
                            <div className="text-xl font-black text-[#FFE699]">
                              +{graduationStandardsAndProgress.wishEpicScore}점
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#A8FFDB]/20 to-[#FFE699]/20 border border-[#A8FFDB]/50 text-center">
                            <div className="text-[11px] text-gray-200 font-bold">
                              희망 활동 이수 시
                            </div>
                            <div className="text-xl font-black text-white">
                              총 {graduationStandardsAndProgress.projectedEpicScore}점
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="w-full h-3 rounded-full bg-[#161622] overflow-hidden border border-gray-800 flex">
                            <div
                              className="h-full bg-[#A8FFDB] transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(
                                    (graduationStandardsAndProgress.currentEpicScore /
                                      graduationStandardsAndProgress.requiredEpicScore) *
                                      100
                                  )
                                )}%`
                              }}
                              title={`현재 이수 완료: ${graduationStandardsAndProgress.currentEpicScore}점`}
                            />
                            <div
                              className="h-full bg-[#FFE699] transition-all duration-300"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100 -
                                      Math.min(
                                        100,
                                        Math.round(
                                          (graduationStandardsAndProgress.currentEpicScore /
                                            graduationStandardsAndProgress.requiredEpicScore) *
                                            100
                                        )
                                      ),
                                    Math.round(
                                      (graduationStandardsAndProgress.wishEpicScore /
                                        graduationStandardsAndProgress.requiredEpicScore) *
                                        100
                                    )
                                  )
                                )}%`
                              }}
                              title={`이수 희망 활동 추가분: +${graduationStandardsAndProgress.wishEpicScore}점`}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400">
                              현재 달성률:{' '}
                              <strong className="text-[#A8FFDB]">
                                {Math.round(
                                  (graduationStandardsAndProgress.currentEpicScore /
                                    graduationStandardsAndProgress.requiredEpicScore) *
                                    100
                                )}
                                %
                              </strong>{' '}
                              → 희망 활동 모두 이수 시:{' '}
                              <strong className="text-[#FFE699]">
                                {Math.round(
                                  (graduationStandardsAndProgress.projectedEpicScore /
                                    graduationStandardsAndProgress.requiredEpicScore) *
                                    100
                                )}
                                % ({graduationStandardsAndProgress.projectedEpicScore}점 /{' '}
                                {graduationStandardsAndProgress.requiredEpicScore}점)
                              </strong>
                            </span>
                            <a
                              href="https://epic.seoultech.ac.kr"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#99E6FF] hover:underline flex items-center gap-1 font-bold"
                            >
                              <Link2 className="w-3 h-3" /> 서울과기대 EPiC folio 공식 웹사이트
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 하단 12그리드: 좌측 7칸(공식 카탈로그) + 우측 5칸(내 이수 완료 & 이수 희망 활동 보관함) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-4 h-fit">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#A8FFDB]" />
                          서울과기대 공식 EPiC folio 활동 원클릭 선택 카탈로그
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          직접 입력할 필요 없이 버튼 클릭 한 번으로{' '}
                          <strong className="text-[#A8FFDB]">[이수 완료]</strong> 또는{' '}
                          <strong className="text-[#FFE699]">[이수 희망]</strong>에 추가하거나 다시
                          클릭해 삭제할 수 있습니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('gradCatalogBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition shrink-0"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['gradCatalogBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>

                    {!collapsedBoxes['gradCatalogBox'] && (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-800">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {['ALL', '필수 요건', '선택 요건'].map((reqFilter) => (
                              <button
                                key={reqFilter}
                                type="button"
                                onClick={() => setEpicCatalogFilter(reqFilter)}
                                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition ${
                                  epicCatalogFilter === reqFilter
                                    ? reqFilter === '필수 요건'
                                      ? 'bg-[#FFB2D0] text-[#0D0D12]'
                                      : 'bg-[#A8FFDB] text-[#0D0D12]'
                                    : 'bg-[#0D0D12] text-gray-400 hover:text-white border border-gray-800'
                                }`}
                              >
                                {reqFilter === 'ALL' ? '전체 요건' : reqFilter}
                              </button>
                            ))}
                          </div>

                          <select
                            value={epicCategoryFilter}
                            onChange={(e) => setEpicCategoryFilter(e.target.value)}
                            className="rounded-xl bg-[#0D0D12] border border-gray-700 px-3 py-1.5 text-xs text-white"
                          >
                            <option value="ALL">모든 영역 보기</option>
                            <option value="전공/학술">전공/학술</option>
                            <option value="어학/자격증">어학/자격증</option>
                            <option value="공모전/경진대회">공모전/경진대회</option>
                            <option value="현장실습/인턴">현장실습/인턴</option>
                            <option value="비교과/특강">비교과/특강</option>
                            <option value="진로/상담">진로/상담</option>
                            <option value="글로벌/봉사">글로벌/봉사</option>
                          </select>
                        </div>

                        <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                          {SEOULTECH_OFFICIAL_EPIC_CATALOG.filter((item) => {
                            const matchReq =
                              epicCatalogFilter === 'ALL' || item.reqType === epicCatalogFilter;
                            const matchCat =
                              epicCategoryFilter === 'ALL' || item.category === epicCategoryFilter;
                            return matchReq && matchCat;
                          }).map((item) => {
                            const savedEntry = (myGraduationData.selectedEpicItems || []).find(
                              (s) => s.activityCode === item.activityCode
                            );
                            const isCompleted = savedEntry?.status === 'COMPLETED';
                            const isWish = savedEntry?.status === 'WISH';

                            return (
                              <div
                                key={item.activityCode}
                                className={`p-4 rounded-2xl border transition space-y-2.5 ${
                                  isCompleted
                                    ? 'bg-[#A8FFDB]/10 border-[#A8FFDB]'
                                    : isWish
                                    ? 'bg-[#FFE699]/10 border-[#FFE699]'
                                    : 'bg-[#0D0D12] border-gray-800 hover:border-gray-700'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                                  <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-sm font-extrabold text-white">
                                        {item.title}
                                      </span>

                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                                          item.reqType === '필수 요건'
                                            ? 'bg-[#FFB2D0]/20 text-[#FFB2D0] border-[#FFB2D0]/50'
                                            : 'bg-[#99E6FF]/20 text-[#99E6FF] border-[#99E6FF]/50'
                                        }`}
                                      >
                                        {item.reqType}
                                      </span>

                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FFE699]/20 text-[#FFE699] border border-[#FFE699]/50">
                                        {item.points}점
                                      </span>

                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300">
                                        {item.category}
                                      </span>
                                    </div>

                                    <p className="text-xs text-gray-300">{item.description}</p>

                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 pt-0.5">
                                      <span className="flex items-center gap-1 text-[#D4B2FF] font-semibold">
                                        <Clock className="w-3.5 h-3.5" />
                                        일시: {item.scheduleDate}
                                      </span>
                                      <a
                                        href={item.officialUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#99E6FF] hover:underline flex items-center gap-1"
                                      >
                                        <Link2 className="w-3 h-3" /> 공식 안내 확인
                                      </a>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleEpicCatalogItem(item, 'COMPLETED')
                                      }
                                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1 ${
                                        isCompleted
                                          ? 'bg-[#A8FFDB] text-[#0D0D12] shadow-md'
                                          : 'bg-[#161622] text-gray-300 hover:text-[#A8FFDB] border border-gray-700'
                                      }`}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      {isCompleted ? '이수완료됨 (클릭해제)' : '이수 완료'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleEpicCatalogItem(item, 'WISH')}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1 ${
                                        isWish
                                          ? 'bg-[#FFE699] text-[#0D0D12] shadow-md'
                                          : 'bg-[#161622] text-gray-300 hover:text-[#FFE699] border border-gray-700'
                                      }`}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      {isWish ? '희망등록됨 (클릭해제)' : '이수 희망'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 우측 5칸: 내가 선택한 [이수 완료 활동] 및 [이수하고 싶은 희망 활동] 목록 */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-[#151521] border border-[#A8FFDB]/35 rounded-2xl p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#A8FFDB]" />내 이수 완료 EPiC 활동 (
                          {graduationStandardsAndProgress.completedItems.length}건)
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#A8FFDB]/15 text-[#A8FFDB] text-xs font-black">
                            현재 {graduationStandardsAndProgress.currentEpicScore}점
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleBoxCollapse('gradCompletedBox')}
                            className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition"
                            title="접기/펼치기"
                          >
                            <span
                              className={`inline-block transition-transform duration-200 ${
                                collapsedBoxes['gradCompletedBox'] ? '-rotate-90' : ''
                              }`}
                            >
                              v
                            </span>
                          </button>
                        </div>
                      </div>

                      {!collapsedBoxes['gradCompletedBox'] && (
                        <>
                          {graduationStandardsAndProgress.completedItems.length === 0 ? (
                            <p className="text-xs text-gray-500 py-5 text-center bg-[#0D0D12] rounded-xl border border-gray-800">
                              좌측 목록에서 이미 참여한 활동의 <strong>[이수 완료]</strong> 버튼을
                              클릭해 보세요!
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              {graduationStandardsAndProgress.completedItems.map((it) => (
                                <div
                                  key={it.activityCode}
                                  className="p-3.5 rounded-2xl bg-[#0D0D12] border border-gray-800 space-y-1.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-xs font-extrabold text-white">
                                        {it.title}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                          it.reqType === '필수 요건'
                                            ? 'bg-[#FFB2D0]/20 text-[#FFB2D0] border-[#FFB2D0]/50'
                                            : 'bg-[#99E6FF]/20 text-[#99E6FF] border-[#99E6FF]/50'
                                        }`}
                                      >
                                        {it.reqType}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#A8FFDB]/20 text-[#A8FFDB] border border-[#A8FFDB]/50">
                                        {it.points}점
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveEpicItem(it.activityCode, it.title)
                                      }
                                      className="text-gray-500 hover:text-[#FFB2D0] p-1"
                                      title="클릭하여 삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="text-[11px] text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[#D4B2FF]" /> 일시:{' '}
                                    {it.scheduleDate}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="bg-[#151521] border border-[#FFE699]/40 rounded-2xl p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#FFE699]" />
                            이수하고 싶은 희망 활동 (
                            {graduationStandardsAndProgress.wishItems.length}건)
                          </h3>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            현재{' '}
                            <strong className="text-[#A8FFDB]">
                              {graduationStandardsAndProgress.currentEpicScore}점
                            </strong>
                            에서 아래 희망 활동을 이수하면{' '}
                            <strong className="text-[#FFE699]">
                              총 {graduationStandardsAndProgress.projectedEpicScore}점
                            </strong>
                            이 됩니다!
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FFE699]/20 text-[#FFE699] text-xs font-black">
                            +{graduationStandardsAndProgress.wishEpicScore}점 예상
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleBoxCollapse('gradWishBox')}
                            className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#FFE699] hover:border-[#FFE699] flex items-center justify-center transition"
                            title="접기/펼치기"
                          >
                            <span
                              className={`inline-block transition-transform duration-200 ${
                                collapsedBoxes['gradWishBox'] ? '-rotate-90' : ''
                              }`}
                            >
                              v
                            </span>
                          </button>
                        </div>
                      </div>

                      {!collapsedBoxes['gradWishBox'] && (
                        <>
                          {graduationStandardsAndProgress.wishItems.length === 0 ? (
                            <p className="text-xs text-gray-500 py-5 text-center bg-[#0D0D12] rounded-xl border border-gray-800">
                              좌측 목록에서 앞으로 참여하고 싶은 활동의{' '}
                              <strong className="text-[#FFE699]">[이수 희망]</strong> 버튼을 클릭해
                              예상 점수를 계산해 보세요!
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              {graduationStandardsAndProgress.wishItems.map((it) => (
                                <div
                                  key={it.activityCode}
                                  className="p-3.5 rounded-2xl bg-[#0D0D12] border border-[#FFE699]/30 space-y-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-xs font-extrabold text-white">
                                        {it.title}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                          it.reqType === '필수 요건'
                                            ? 'bg-[#FFB2D0]/20 text-[#FFB2D0] border-[#FFB2D0]/50'
                                            : 'bg-[#99E6FF]/20 text-[#99E6FF] border-[#99E6FF]/50'
                                        }`}
                                      >
                                        {it.reqType}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFE699]/20 text-[#FFE699] border border-[#FFE699]/50">
                                        {it.points}점
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleEpicCatalogItem(it, 'COMPLETED')
                                        }
                                        className="px-2 py-1 rounded-lg bg-[#A8FFDB]/15 text-[#A8FFDB] hover:bg-[#A8FFDB] hover:text-[#0D0D12] text-[10px] font-extrabold transition"
                                        title="이수 완료로 전환"
                                      >
                                        완료로 변경
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveEpicItem(it.activityCode, it.title)
                                        }
                                        className="text-gray-500 hover:text-[#FFB2D0] p-1"
                                        title="삭제"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-[#D4B2FF]" /> 일시:{' '}
                                      {it.scheduleDate}
                                    </span>
                                    <span className="text-[#FFE699] font-mono font-bold">
                                      단독 이수 시:{' '}
                                      {graduationStandardsAndProgress.currentEpicScore +
                                        Number(it.points)}
                                      점
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. 개인정보 및 현재 학기 설정 탭 (<조건 3, 4, 5> 학번 수정 불가 처리 + 우측 상단 'v' 버튼) */}
            {activeToolCategory === 'PROFILE' && (
              <div className="max-w-2xl bg-[#151521] border border-[#A8FFDB]/30 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-5 h-5 text-[#A8FFDB]" />
                    <div>
                      <h2 className="text-base font-extrabold text-white">
                        개인정보 수정 및 현재 학기 설정
                      </h2>
                      <p className="text-xs text-gray-400">
                        학번을 제외한 학과, 이름, 상태메시지 및 현재 학기를 변경할 수 있습니다.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleBoxCollapse('profileSettingBox')}
                    className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition"
                    title="접기/펼치기"
                  >
                    <span
                      className={`inline-block transition-transform duration-200 ${
                        collapsedBoxes['profileSettingBox'] ? '-rotate-90' : ''
                      }`}
                    >
                      v
                    </span>
                  </button>
                </div>

                {!collapsedBoxes['profileSettingBox'] && (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          학과
                        </label>
                        <input
                          type="text"
                          value={profileForm.department}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, department: e.target.value })
                          }
                          className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#A8FFDB] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">
                          학번 (변경 불가)
                        </label>
                        <input
                          type="text"
                          value={currentUser.studentId}
                          disabled
                          className="w-full rounded-xl bg-[#0D0D12]/60 border border-gray-800 px-3.5 py-2.5 text-sm font-mono text-gray-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          이름
                        </label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#A8FFDB] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        친구에게 보여줄 나의 상태메시지
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        value={profileForm.statusMessage}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, statusMessage: e.target.value })
                        }
                        placeholder="예: 수요일 오후 공강! 같이 밥 먹어요"
                        className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#A8FFDB] focus:outline-none"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#D4B2FF]/40 space-y-3">
                      <div className="text-xs font-bold text-[#D4B2FF]">
                        📌 현재 나의 수강 학기 설정 (상단 현재 학기 학점 및 주간 시간표 기준)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            현재 수강 년도
                          </label>
                          <input
                            type="number"
                            min={1980}
                            max={2050}
                            value={profileForm.currentYear}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, currentYear: e.target.value })
                            }
                            className="w-full rounded-xl bg-[#151521] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#D4B2FF] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            현재 수강 학기
                          </label>
                          <select
                            value={profileForm.currentSemester}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, currentSemester: e.target.value })
                            }
                            className="w-full rounded-xl bg-[#151521] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#D4B2FF] focus:outline-none"
                          >
                            {SEMESTER_OPTIONS.map((sem) => (
                              <option key={sem} value={sem}>
                                {sem}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl font-extrabold text-xs bg-[#A8FFDB] text-[#0D0D12] hover:bg-[#8ef5c8] transition"
                      >
                        개인정보 및 학기 설정 저장
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDeleteAccountModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#FFB2D0]/10 text-[#FFB2D0] border border-[#FFB2D0]/40 hover:bg-[#FFB2D0]/20 transition flex items-center justify-center gap-1.5"
                      >
                        <UserX className="w-4 h-4" />
                        회원탈퇴
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 4. ADMIN 전용 전체 유저 목록 & 유저별 친구 강제 추가/삭제 */}
            {activeToolCategory === 'ADMIN' && currentUser.role === 'ADMIN' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-[#151521] border border-[#FFB2D0]/40 rounded-2xl p-6 space-y-4 h-fit">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#FFB2D0]" />
                        [ADMIN] 전체 사용자 목록 관리 ({accounts.length}명)
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        유저를 클릭해 친구 관계를 조회·강제 추가·삭제하거나 타임테이블을 열람합니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBoxCollapse('adminUserListBox')}
                      className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#FFB2D0] hover:border-[#FFB2D0] flex items-center justify-center transition shrink-0"
                      title="접기/펼치기"
                    >
                      <span
                        className={`inline-block transition-transform duration-200 ${
                          collapsedBoxes['adminUserListBox'] ? '-rotate-90' : ''
                        }`}
                      >
                        v
                      </span>
                    </button>
                  </div>

                  {!collapsedBoxes['adminUserListBox'] && (
                    <div className="space-y-3">
                      {accounts.map((acc) => {
                        const isSelected = adminSelectedUserId === acc.id;
                        const userFriendCount = friendships.filter(
                          (f) =>
                            f.status === 'ACCEPTED' &&
                            (f.requesterId === acc.id || f.receiverId === acc.id)
                        ).length;

                        return (
                          <div
                            key={acc.id}
                            onClick={() => setAdminSelectedUserId(acc.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-[#1E1E2E] border-[#FFB2D0]'
                                : 'bg-[#0D0D12] border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#A8FFDB]/15 text-[#A8FFDB]">
                                  {acc.department}
                                </span>
                                <span className="text-sm font-extrabold text-white">{acc.name}</span>
                                <span className="text-xs font-mono text-gray-400">
                                  ({acc.studentId})
                                </span>
                                {acc.role === 'ADMIN' && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#FFB2D0] text-[#0D0D12]">
                                    ADMIN
                                  </span>
                                )}
                                <span className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                                  친구 {userFriendCount}명
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">
                                💬 {acc.statusMessage || '상태메시지 없음'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFriendForModal(formatUserWithDuplicateMask(acc));
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-[#99E6FF]/15 text-[#99E6FF] hover:bg-[#99E6FF] hover:text-[#0D0D12] text-xs font-extrabold transition flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> 타임테이블(비공개포함)
                              </button>

                              {acc.id !== currentUser.id && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdminForceDeleteUser(acc);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#FFB2D0]/15 text-[#FFB2D0] hover:bg-[#FFB2D0] hover:text-[#0D0D12] text-xs font-extrabold transition flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> 유저 강제삭제
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-6 bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-5 h-fit">
                  {(() => {
                    const targetUser =
                      accounts.find((a) => a.id === adminSelectedUserId) || accounts[0];
                    if (!targetUser) return null;

                    const targetRelations = friendships.filter(
                      (f) => f.requesterId === targetUser.id || f.receiverId === targetUser.id
                    );

                    return (
                      <>
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                          <div>
                            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                              <Users className="w-5 h-5 text-[#A8FFDB]" />
                              [ADMIN] {targetUser.name} ({targetUser.studentId})님의 친구 강제 관리
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              운영자 권한으로 친구를 강제로 추가하거나 삭제할 수 있습니다.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleBoxCollapse('adminFriendManageBox')}
                            className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition shrink-0"
                            title="접기/펼치기"
                          >
                            <span
                              className={`inline-block transition-transform duration-200 ${
                                collapsedBoxes['adminFriendManageBox'] ? '-rotate-90' : ''
                              }`}
                            >
                              v
                            </span>
                          </button>
                        </div>

                        {!collapsedBoxes['adminFriendManageBox'] && (
                          <>
                            <div className="p-4 rounded-2xl bg-[#0D0D12] border border-[#A8FFDB]/40 space-y-3">
                              <label className="block text-xs font-extrabold text-[#A8FFDB]">
                                ➕ {targetUser.name}님에게 새로운 친구 강제 추가
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={adminFriendAddTargetId}
                                  onChange={(e) => setAdminFriendAddTargetId(e.target.value)}
                                  className="flex-1 rounded-xl bg-[#151521] border border-gray-700 px-3 py-2 text-xs text-white"
                                >
                                  <option value="">강제로 친구 맺어줄 다른 유저 선택...</option>
                                  {accounts
                                    .filter((a) => a.id !== targetUser.id)
                                    .map((a) => (
                                      <option key={a.id} value={a.id}>
                                        {a.department} · {a.name} ({a.studentId})
                                      </option>
                                    ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdminForceAddFriend(targetUser.id, adminFriendAddTargetId)
                                  }
                                  className="px-4 py-2 rounded-xl bg-[#A8FFDB] text-[#0D0D12] text-xs font-extrabold hover:opacity-90 shrink-0"
                                >
                                  강제 친구 추가
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              <h4 className="text-xs font-bold text-gray-300">
                                등록된 친구 및 신청 관계 ({targetRelations.length}건)
                              </h4>
                              {targetRelations.length === 0 ? (
                                <p className="text-xs text-gray-500 py-6 text-center bg-[#0D0D12] rounded-xl border border-gray-800">
                                  현재 연결된 친구 관계가 없습니다.
                                </p>
                              ) : (
                                targetRelations.map((rel) => {
                                  const otherId =
                                    rel.requesterId === targetUser.id
                                      ? rel.receiverId
                                      : rel.requesterId;
                                  const otherUser = accounts.find((a) => a.id === otherId);
                                  if (!otherUser) return null;

                                  return (
                                    <div
                                      key={rel.id}
                                      className="p-3.5 rounded-xl bg-[#0D0D12] border border-gray-800 flex items-center justify-between gap-2"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-[#99E6FF]">
                                            {otherUser.department}
                                          </span>
                                          <span className="text-sm font-extrabold text-white">
                                            {otherUser.name}
                                          </span>
                                          <span className="text-xs font-mono text-gray-400">
                                            ({otherUser.studentId})
                                          </span>
                                          <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                              rel.status === 'ACCEPTED'
                                                ? 'bg-[#A8FFDB]/15 text-[#A8FFDB]'
                                                : 'bg-yellow-500/15 text-yellow-300'
                                            }`}
                                          >
                                            {rel.status === 'ACCEPTED'
                                              ? '친구(승인됨)'
                                              : '신청 대기중'}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {rel.status !== 'ACCEPTED' && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleAdminForceAddFriend(targetUser.id, otherUser.id)
                                            }
                                            className="px-2.5 py-1 rounded-lg bg-[#A8FFDB] text-[#0D0D12] text-[11px] font-extrabold"
                                          >
                                            강제 승인
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => handleAdminForceRemoveFriend(rel.id)}
                                          className="px-2.5 py-1 rounded-lg bg-[#FFB2D0]/20 text-[#FFB2D0] border border-[#FFB2D0]/40 text-[11px] font-extrabold hover:bg-[#FFB2D0] hover:text-[#0D0D12] transition"
                                        >
                                          친구 강제삭제
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 5. 피드백 기능 탭 (<조건 3> 각 박스 우측 상단 'v' 버튼) */}
            {activeToolCategory === 'FEEDBACK' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 bg-[#151521] border border-[#A8FFDB]/35 rounded-2xl p-6 space-y-5 h-fit">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                          <MessageCircleQuestion className="w-5 h-5 text-[#A8FFDB]" />
                          건의 사항 및 서비스 개선점 제출
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">
                          제출하신 피드백은 서버에 등록되어 운영자(ADMIN)가 확인합니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('feedbackFormBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition shrink-0"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['feedbackFormBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>

                    {!collapsedBoxes['feedbackFormBox'] && (
                      <form onSubmit={handleSubmitUserFeedback} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            피드백 제목 <span className="text-[#FFB2D0]">*</span>
                          </label>
                          <input
                            type="text"
                            value={feedbackSubmissionForm.title}
                            onChange={(e) =>
                              setFeedbackSubmissionForm({
                                ...feedbackSubmissionForm,
                                title: e.target.value
                              })
                            }
                            placeholder="예: 시간표 이미지 저장 기능 건의, 학점 계산 개선 요청"
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:border-[#A8FFDB] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            건의 사항 및 개선점 상세 내용 <span className="text-[#FFB2D0]">*</span>
                          </label>
                          <textarea
                            rows={5}
                            value={feedbackSubmissionForm.content}
                            onChange={(e) =>
                              setFeedbackSubmissionForm({
                                ...feedbackSubmissionForm,
                                content: e.target.value
                              })
                            }
                            placeholder="불편했던 점이나 추가되었으면 하는 기능을 자유롭게 작성해 주세요..."
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 p-3.5 text-sm text-white focus:border-[#A8FFDB] focus:outline-none resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#A8FFDB] to-[#99E6FF] text-[#0D0D12] hover:opacity-95 transition shadow-lg flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          피드백 서버에 제출하기
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="lg:col-span-7 bg-[#151521] border border-gray-800 rounded-2xl p-6 space-y-4 h-fit">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-white">
                          내가 제출한 피드백 현황 및 답변 확인 ({mySubmittedFeedbacks.length}건)
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          진행 상태는{' '}
                          <span className="text-[#FFE699] font-bold">제출 완료</span> ·{' '}
                          <span className="text-[#D4B2FF] font-bold">검토 중</span> ·{' '}
                          <span className="text-[#A8FFDB] font-bold">검토 완료</span> 3가지로
                          표시됩니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBoxCollapse('feedbackMyListBox')}
                        className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#A8FFDB] hover:border-[#A8FFDB] flex items-center justify-center transition shrink-0"
                        title="접기/펼치기"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            collapsedBoxes['feedbackMyListBox'] ? '-rotate-90' : ''
                          }`}
                        >
                          v
                        </span>
                      </button>
                    </div>

                    {!collapsedBoxes['feedbackMyListBox'] && (
                      <>
                        {mySubmittedFeedbacks.length === 0 ? (
                          <div className="p-8 rounded-2xl bg-[#0D0D12] border border-gray-800 text-center text-xs text-gray-500">
                            아직 제출하신 피드백이 없습니다. 좌측에서 건의 사항이나 개선점을
                            제출해 보세요!
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {mySubmittedFeedbacks.map((fb) => {
                              const stepIndex = FEEDBACK_STATUS_OPTIONS.indexOf(fb.status);
                              return (
                                <div
                                  key={fb.id}
                                  className="p-4 rounded-2xl bg-[#0D0D12] border border-gray-800 space-y-3"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="space-y-0.5">
                                      <h4 className="text-sm font-extrabold text-white">
                                        {fb.title}
                                      </h4>
                                      <span className="text-[11px] text-gray-500">
                                        제출 일시: {fb.createdAt}
                                      </span>
                                    </div>

                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-extrabold border self-start sm:self-center ${
                                        fb.status === '검토 완료'
                                          ? 'bg-[#A8FFDB]/15 text-[#A8FFDB] border-[#A8FFDB]/40'
                                          : fb.status === '검토 중'
                                          ? 'bg-[#D4B2FF]/15 text-[#D4B2FF] border-[#D4B2FF]/40'
                                          : 'bg-[#FFE699]/15 text-[#FFE699] border-[#FFE699]/40'
                                      }`}
                                    >
                                      {fb.status}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 pt-1">
                                    {FEEDBACK_STATUS_OPTIONS.map((st, idx) => {
                                      const isDoneOrCurrent = idx <= stepIndex;
                                      return (
                                        <div
                                          key={st}
                                          className={`py-1.5 px-2 rounded-lg text-center text-[11px] font-extrabold border ${
                                            fb.status === st
                                              ? 'bg-[#A8FFDB] text-[#0D0D12] border-[#A8FFDB]'
                                              : isDoneOrCurrent
                                              ? 'bg-[#A8FFDB]/15 text-[#A8FFDB] border-[#A8FFDB]/30'
                                              : 'bg-[#151521] text-gray-500 border-gray-800'
                                          }`}
                                        >
                                          {idx + 1}. {st}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <p className="text-xs text-gray-200 leading-relaxed bg-[#151521] p-3 rounded-xl border border-gray-800/80">
                                    {fb.content}
                                  </p>

                                  <div
                                    className={`p-3.5 rounded-xl border ${
                                      fb.adminReply
                                        ? 'bg-[#A8FFDB]/10 border-[#A8FFDB]/40'
                                        : 'bg-[#151521]/50 border-gray-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-extrabold text-[#A8FFDB] flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4" />
                                        운영자(ADMIN) 답변
                                      </span>
                                      {fb.repliedAt && (
                                        <span className="text-[10px] text-gray-400">
                                          답변 시각: {fb.repliedAt}
                                        </span>
                                      )}
                                    </div>
                                    {fb.adminReply ? (
                                      <p className="text-xs text-white leading-relaxed">
                                        {fb.adminReply}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-gray-500">
                                        아직 운영자 답변이 등록되지 않았습니다. (현재 상태: {fb.status})
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {currentUser.role === 'ADMIN' && (
                  <div className="bg-[#151521] border border-[#FFB2D0]/45 rounded-2xl p-6 space-y-5 shadow-[0_0_30px_rgba(255,178,208,0.08)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
                      <div>
                        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-[#FFB2D0]" />
                          [ADMIN 전용] 전체 사용자 피드백 현황 체크 및 답변 관리 (
                          {userFeedbacks.length}건)
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          모든 사용자가 제출한 건의 사항을 확인하고, 진행 상태를 변경하거나 답변을
                          보낼 수 있습니다.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {['ALL', ...FEEDBACK_STATUS_OPTIONS].map((filterKey) => (
                          <button
                            key={filterKey}
                            type="button"
                            onClick={() => setAdminFeedbackStatusFilter(filterKey)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                              adminFeedbackStatusFilter === filterKey
                                ? 'bg-[#FFB2D0] text-[#0D0D12]'
                                : 'bg-[#0D0D12] text-gray-400 hover:text-white border border-gray-800'
                            }`}
                          >
                            {filterKey === 'ALL' ? `전체 (${userFeedbacks.length})` : filterKey}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => toggleBoxCollapse('feedbackAdminBox')}
                          className="w-7 h-7 rounded-lg bg-[#0D0D12] border border-gray-700 text-xs font-extrabold text-gray-300 hover:text-[#FFB2D0] hover:border-[#FFB2D0] flex items-center justify-center transition"
                          title="접기/펼치기"
                        >
                          <span
                            className={`inline-block transition-transform duration-200 ${
                              collapsedBoxes['feedbackAdminBox'] ? '-rotate-90' : ''
                            }`}
                          >
                            v
                          </span>
                        </button>
                      </div>
                    </div>

                    {!collapsedBoxes['feedbackAdminBox'] && (
                      <div className="space-y-4">
                        {userFeedbacks
                          .filter(
                            (fb) =>
                              adminFeedbackStatusFilter === 'ALL' ||
                              fb.status === adminFeedbackStatusFilter
                          )
                          .map((fb) => {
                            const draft = adminFeedbackDrafts[fb.id] || {
                              status: fb.status,
                              adminReply: fb.adminReply || ''
                            };

                            return (
                              <div
                                key={fb.id}
                                className="p-5 rounded-2xl bg-[#0D0D12] border border-gray-800 space-y-3.5"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#99E6FF]/15 text-[#99E6FF]">
                                      {fb.department}
                                    </span>
                                    <span className="text-sm font-extrabold text-white">
                                      {fb.authorName}
                                    </span>
                                    <span className="text-xs font-mono text-gray-400">
                                      ({fb.studentId})
                                    </span>
                                    <span className="text-[11px] text-gray-500">
                                      · {fb.createdAt}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {FEEDBACK_STATUS_OPTIONS.map((statusOption) => (
                                      <button
                                        key={statusOption}
                                        type="button"
                                        onClick={() => {
                                          setAdminFeedbackDrafts((prev) => ({
                                            ...prev,
                                            [fb.id]: { ...draft, status: statusOption }
                                          }));
                                          handleAdminUpdateFeedbackItem(
                                            fb.id,
                                            statusOption,
                                            draft.adminReply
                                          );
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition border ${
                                          fb.status === statusOption
                                            ? 'bg-[#A8FFDB] text-[#0D0D12] border-[#A8FFDB]'
                                            : 'bg-[#151521] text-gray-400 hover:text-white border-gray-700'
                                        }`}
                                      >
                                        {statusOption}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-extrabold text-[#FFE699]">
                                    📌 {fb.title}
                                  </h4>
                                  <p className="text-xs text-gray-200 mt-1 leading-relaxed bg-[#151521] p-3 rounded-xl border border-gray-800">
                                    {fb.content}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-gray-800/80 space-y-2">
                                  <label className="block text-xs font-extrabold text-[#FFB2D0]">
                                    ✍️ 작성자({fb.authorName})에게 보낼 답변 작성
                                  </label>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                      type="text"
                                      value={draft.adminReply}
                                      onChange={(e) =>
                                        setAdminFeedbackDrafts((prev) => ({
                                          ...prev,
                                          [fb.id]: {
                                            status: draft.status || fb.status,
                                            adminReply: e.target.value
                                          }
                                        }))
                                      }
                                      placeholder="피드백에 대한 답변을 입력해 주세요..."
                                      className="flex-1 rounded-xl bg-[#151521] border border-gray-700 px-3.5 py-2 text-xs text-white focus:border-[#FFB2D0] focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAdminUpdateFeedbackItem(
                                          fb.id,
                                          draft.status || fb.status,
                                          draft.adminReply
                                        )
                                      }
                                      className="px-4 py-2 rounded-xl bg-[#FFB2D0] text-[#0D0D12] text-xs font-extrabold hover:opacity-90 transition shrink-0"
                                    >
                                      답변 및 현황 저장
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* <조건 4, 5> 화면 상단의 이름·학번·학과 클릭 시 열리는 개인정보 수정(학번 제외) 및 로그아웃·탈퇴 팝업창 */}
        {isProfilePopupOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#151521] border border-[#A8FFDB]/40 rounded-3xl p-6 space-y-5 shadow-[0_0_40px_rgba(168,255,219,0.12)]">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#A8FFDB]" />
                  <h3 className="text-base font-extrabold text-white">
                    내 개인정보 수정 (학번 변경 불가)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfilePopupOpen(false)}
                  className="p-1.5 rounded-xl bg-[#0D0D12] border border-gray-700 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      학번 (고정)
                    </label>
                    <input
                      type="text"
                      value={currentUser.studentId}
                      disabled
                      className="w-full rounded-xl bg-[#0D0D12]/60 border border-gray-800 px-3 py-2 text-xs font-mono text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      학과
                    </label>
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, department: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3 py-2 text-xs text-white focus:border-[#A8FFDB] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      이름
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3 py-2 text-xs text-white focus:border-[#A8FFDB] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    친구에게 보여줄 상태메시지
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={profileForm.statusMessage}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, statusMessage: e.target.value })
                    }
                    placeholder="상태메시지를 입력하세요..."
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3.5 py-2 text-xs text-white focus:border-[#A8FFDB] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      현재 수강 년도
                    </label>
                    <input
                      type="number"
                      min={1980}
                      max={2050}
                      value={profileForm.currentYear}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, currentYear: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3 py-2 text-xs text-white focus:border-[#D4B2FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      현재 수강 학기
                    </label>
                    <select
                      value={profileForm.currentSemester}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, currentSemester: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#0D0D12] border border-gray-700 px-3 py-2 text-xs text-white focus:border-[#D4B2FF] focus:outline-none"
                    >
                      {SEMESTER_OPTIONS.map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfilePopupOpen(false);
                        setCurrentUser(null);
                        setAuthToken('');
                        localStorage.removeItem('seoultech_auth_token_v6');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#1E1E2E] hover:bg-gray-800 text-xs font-bold text-gray-200 border border-gray-700 flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" /> 로그아웃
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfilePopupOpen(false);
                        setIsDeleteAccountModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#FFB2D0]/15 hover:bg-[#FFB2D0]/25 text-xs font-bold text-[#FFB2D0] border border-[#FFB2D0]/40 flex items-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" /> 회원탈퇴
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#A8FFDB] text-[#0D0D12] font-extrabold text-xs hover:bg-[#8ef5c8] transition"
                  >
                    개인정보 저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 회원탈퇴 확인 모달 */}
        {isDeleteAccountModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#151521] border border-[#FFB2D0] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#FFB2D0] flex items-center gap-2">
                  <UserX className="w-5 h-5" /> 회원탈퇴 확인
                </h3>
                <button onClick={() => setIsDeleteAccountModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                정말로 <strong>{currentUser.name}({currentUser.studentId})</strong> 계정을
                탈퇴하시겠습니까? 탈퇴 시 등록된 모든 과목 및 성적 데이터가 삭제됩니다.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-800 text-gray-300"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAccount}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#FFB2D0] text-[#0D0D12]"
                >
                  회원탈퇴 완료
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 서버 설정 모달 */}
        {isServerModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#151521] border border-[#A8FFDB]/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#A8FFDB]" /> 백엔드 서버 주소 설정
                </h3>
                <button onClick={() => setIsServerModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Render 등으로 배포한 백엔드 API 주소(예: <code>https://team04-backend.onrender.com/api</code>)를 입력하면 PC·모바일 어디서든 클라우드 DB와 실시간 동기화됩니다.
              </p>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Node.js 백엔드 API 주소
                </label>
                <input
                  type="text"
                  value={serverConfig.apiUrl}
                  onChange={(e) =>
                    setServerConfig((prev) => ({ ...prev, apiUrl: e.target.value }))
                  }
                  placeholder="https://your-backend.onrender.com/api"
                  className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-xs text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsServerModalOpen(false)}
                className="w-full py-2.5 rounded-xl font-extrabold text-xs bg-[#A8FFDB] text-[#0D0D12]"
              >
                연결 설정 저장 및 동기화
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}