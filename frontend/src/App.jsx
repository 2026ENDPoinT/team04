import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Terminal,
  UserCheck,
  ShieldAlert,
  LogOut,
  Calendar,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Building2,
  IdCard,
  User as UserIcon,
  Settings,
  Trash2,
  X,
  Lock,
  Save,
  Plus,
  Clock,
  BookOpen,
  Edit3,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Ban,
  FolderKanban,
  Cloud,
  Download,
  Upload,
  Server
} from 'lucide-react';

// 고정 스토리지 키
const STORAGE_KEYS = {
  USERS: 'seoultech_cse_users_permanent',
  COURSES: 'seoultech_cse_courses_permanent',
  TOKEN: 'seoultech_cse_auth_token',
  SERVER_CONFIG: 'seoultech_cse_server_config'
};

const YEAR_OPTIONS = Array.from({ length: 2050 - 1980 + 1 }, (_, i) => 1980 + i);
const SEMESTER_OPTIONS = ['1학기', '2학기', '여름계절학기', '겨울계절학기'];
const CREDIT_OPTIONS = [1, 2, 3, 4];
const GRADE_OPTIONS = ['현재 이수 중', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
const DAY_OPTIONS = ['월', '화', '수', '목', '금'];

const SEMESTER_ORDER = {
  '1학기': 1,
  '여름계절학기': 2,
  '2학기': 3,
  '겨울계절학기': 4
};

const compareCourseChronological = (a, b) => {
  if (Number(a.year) !== Number(b.year)) {
    return Number(a.year) - Number(b.year);
  }
  const semA = SEMESTER_ORDER[a.semester] || 0;
  const semB = SEMESTER_ORDER[b.semester] || 0;
  if (semA !== semB) {
    return semA - semB;
  }
  return (a.id || 0) - (b.id || 0);
};

const TIME_OPTIONS = [];
for (let h = 9; h <= 21; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_OPTIONS.push(`${hh}:00`);
  if (h < 21) TIME_OPTIONS.push(`${hh}:30`);
}

const GRADE_POINTS_MAP = {
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

const PASTEL_NEON_COLORS = [
  { hex: '#A8FFDB', name: '네온 민트' },
  { hex: '#D4B2FF', name: '파스텔 퍼플' },
  { hex: '#FFB2D0', name: '코랄 핑크' },
  { hex: '#99E6FF', name: '네온 스카이' },
  { hex: '#FFE699', name: '파스텔 옐로우' },
  { hex: '#B8FF99', name: '파스텔 라임' }
];

const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const INITIAL_USERS_DB = [
  {
    id: 1,
    department: '컴퓨터공학과',
    studentId: '26101232',
    name: '최준우',
    role: 'ADMIN',
    currentYear: 2026,
    currentSemester: '1학기',
    currentSemesterCredits: 0,
    totalCredits: 0,
    gpa: 0.0,
    preferredMainView: 'TIMETABLE'
  }
];

export default function App() {
  const fileInputRef = useRef(null);

  // 서버/클라우드 DB 설정 상태 (Backend API URL 또는 Supabase URL/Key 지원)
  const [serverConfig, setServerConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVER_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      apiUrl: 'http://localhost:5000/api',
      supabaseUrl: '',
      supabaseKey: ''
    };
  });

  const [dbMode, setDbMode] = useState('LOCAL'); // 'BACKEND_API' | 'SUPABASE_CLOUD' | 'LOCAL'
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  // 사용자 DB (기존 로컬 버전 데이터까지 모두 복구)
  const [usersDb, setUsersDb] = useState(() => {
    const raw =
      localStorage.getItem(STORAGE_KEYS.USERS) ||
      localStorage.getItem('seoultech_users_db_v3') ||
      localStorage.getItem('seoultech_users_db_v2');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const hasAdmin = parsed.some((u) => u.studentId === '26101232');
        return (hasAdmin ? parsed : [...INITIAL_USERS_DB, ...parsed]).map((u) => ({
          ...u,
          currentYear: u.currentYear || 2026,
          currentSemester: u.currentSemester || '1학기'
        }));
      } catch (e) {
        return INITIAL_USERS_DB;
      }
    }
    return INITIAL_USERS_DB;
  });

  // 과목 DB
  const [coursesDb, setCoursesDb] = useState(() => {
    const raw =
      localStorage.getItem(STORAGE_KEYS.COURSES) ||
      localStorage.getItem('seoultech_courses_db_v3') ||
      localStorage.getItem('seoultech_courses_db_v2');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [activeMainView, setActiveMainView] = useState('TIMETABLE');
  const [activeToolCategory, setActiveToolCategory] = useState('COURSE_MANAGER');

  // 인증 폼 상태
  const [authMode, setAuthMode] = useState('LOGIN');
  const [department, setDepartment] = useState('컴퓨터공학과');
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [autoLogin, setAutoLogin] = useState(true);

  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // 개인정보 수정 팝업 상태
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [editName, setEditName] = useState('');
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);

  // 과목 등록 폼 상태
  const [courseYear, setCourseYear] = useState(2026);
  const [courseSemester, setCourseSemester] = useState('1학기');
  const [courseName, setCourseName] = useState('');
  const [courseCredits, setCourseCredits] = useState(3);
  const [courseGrade, setCourseGrade] = useState('현재 이수 중');
  const [courseColor, setCourseColor] = useState(PASTEL_NEON_COLORS[0].hex);
  const [courseIsRetake, setCourseIsRetake] = useState(false);
  const [courseIsWithdrawn, setCourseIsWithdrawn] = useState(false);
  const [courseSchedules, setCourseSchedules] = useState([
    { day: '월', startTime: '09:00', endTime: '10:30' }
  ]);

  // 학기별 접기/펼치기 상태
  const [collapsedSemesters, setCollapsedSemesters] = useState({});
  const toggleSemesterCollapse = (key) => {
    setCollapsedSemesters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 과목 수정/삭제 모달 상태
  const [editingCourse, setEditingCourse] = useState(null);
  const [modalYear, setModalYear] = useState(2026);
  const [modalSemester, setModalSemester] = useState('1학기');
  const [modalCourseName, setModalCourseName] = useState('');
  const [modalCredits, setModalCredits] = useState(3);
  const [modalGrade, setModalGrade] = useState('현재 이수 중');
  const [modalColor, setModalColor] = useState(PASTEL_NEON_COLORS[0].hex);
  const [modalIsRetake, setModalIsRetake] = useState(false);
  const [modalIsWithdrawn, setModalIsWithdrawn] = useState(false);
  const [modalSchedules, setModalSchedules] = useState([]);
  const [modalError, setModalError] = useState('');

  // 로컬 백업 스토리지 자동 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersDb));
  }, [usersDb]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(coursesDb));
  }, [coursesDb]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVER_CONFIG, JSON.stringify(serverConfig));
  }, [serverConfig]);

  // Supabase REST 호출 헬퍼
  const supabaseFetch = async (tableAndQuery, options = {}) => {
    const cleanUrl = serverConfig.supabaseUrl.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/${tableAndQuery}`, {
      ...options,
      headers: {
        apikey: serverConfig.supabaseKey,
        Authorization: `Bearer ${serverConfig.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers || {})
      }
    });
    if (!res.ok) throw new Error('Supabase 요청 실패');
    return res.json();
  };

  // 초기 서버/클라우드 DB 동기화 및 자동 로그인 복원
  useEffect(() => {
    const checkAndSyncServer = async () => {
      // 1순위: Supabase 클라우드 DB가 입력되어 있는 경우
      if (serverConfig.supabaseUrl && serverConfig.supabaseKey) {
        try {
          const remoteUsers = await supabaseFetch('users?select=*');
          const remoteCourses = await supabaseFetch('courses?select=*');
          if (Array.isArray(remoteUsers)) setUsersDb(remoteUsers);
          if (Array.isArray(remoteCourses)) setCoursesDb(remoteCourses);
          setDbMode('SUPABASE_CLOUD');
        } catch (e) {
          setDbMode('LOCAL');
        }
      } else {
        // 2순위: Node.js 백엔드 API 서버(localhost:5000 등)가 켜져 있는지 확인
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 1200);
          const res = await fetch(`${serverConfig.apiUrl}/health`, {
            signal: controller.signal
          });
          clearTimeout(timer);
          if (res.ok) {
            setDbMode('BACKEND_API');
          } else {
            setDbMode('LOCAL');
          }
        } catch (e) {
          setDbMode('LOCAL');
        }
      }

      // 자동 로그인 세션 복원
      const savedSession =
        localStorage.getItem('seoultech_auto_login_session') ||
        sessionStorage.getItem('seoultech_temp_login_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          const found = usersDb.find(
            (u) => u.studentId === parsed.studentId && u.name === parsed.name
          );
          if (found) {
            setCurrentUser(found);
            setActiveMainView(found.preferredMainView || 'TIMETABLE');
            setCourseYear(found.currentYear || 2026);
            setCourseSemester(found.currentSemester || '1학기');
          }
        } catch (e) {}
      }
    };

    checkAndSyncServer();
  }, [serverConfig.supabaseUrl, serverConfig.supabaseKey, serverConfig.apiUrl]);

  // 현재 사용자의 과목 목록
  const userCourses = useMemo(() => {
    if (!currentUser) return [];
    return coursesDb.filter((c) => Number(c.userId) === Number(currentUser.id));
  }, [coursesDb, currentUser]);

  // 조건 4 반영: 동일 과목명 2개 이상 존재 시 나중 학기(재수강) 과목만 GPA에 산입
  const gpaCalculationResult = useMemo(() => {
    if (!currentUser) {
      return {
        gpa: 0.0,
        totalCredits: 0,
        currentSemesterCredits: 0,
        supersededCourseIds: new Set(),
        autoRetakeCourseIds: new Set()
      };
    }

    let totalWeightedPoints = 0;
    let totalGpaCredits = 0;
    let totalEarnedCredits = 0;
    let currentSemesterCredits = 0;
    const supersededCourseIds = new Set();
    const autoRetakeCourseIds = new Set();

    userCourses.forEach((c) => {
      const cr = Number(c.credits) || 0;
      if (
        !c.isWithdrawn &&
        Number(c.year) === Number(currentUser.currentYear) &&
        c.semester === currentUser.currentSemester
      ) {
        currentSemesterCredits += cr;
      }
    });

    const groupedByName = new Map();
    userCourses.forEach((c) => {
      if (c.isWithdrawn) return;
      const key = String(c.courseName).trim().toLowerCase();
      if (!groupedByName.has(key)) groupedByName.set(key, []);
      groupedByName.get(key).push(c);
    });

    groupedByName.forEach((group) => {
      const sorted = [...group].sort(compareCourseChronological);
      if (sorted.length >= 2) {
        // 두 번째 이후 수강 과목은 자동으로 재수강 배지 부여
        sorted.slice(1).forEach((laterCourse) => autoRetakeCourseIds.add(laterCourse.id));
      }

      const gradedList = sorted.filter(
        (c) => c.grade !== '현재 이수 중' && GRADE_POINTS_MAP[c.grade] !== undefined
      );

      const effectiveCourse =
        gradedList.length > 0 ? gradedList[gradedList.length - 1] : sorted[sorted.length - 1];

      sorted.forEach((item) => {
        if (effectiveCourse && item.id !== effectiveCourse.id) {
          supersededCourseIds.add(item.id);
        }
      });

      if (
        effectiveCourse &&
        effectiveCourse.grade !== '현재 이수 중' &&
        GRADE_POINTS_MAP[effectiveCourse.grade] !== undefined
      ) {
        const cr = Number(effectiveCourse.credits) || 0;
        const gp = GRADE_POINTS_MAP[effectiveCourse.grade];
        totalWeightedPoints += cr * gp;
        totalGpaCredits += cr;
        if (effectiveCourse.grade !== 'F') {
          totalEarnedCredits += cr;
        }
      }
    });

    const gpa =
      totalGpaCredits > 0 ? Math.round((totalWeightedPoints / totalGpaCredits) * 100) / 100 : 0.0;

    return {
      gpa,
      totalCredits: totalEarnedCredits,
      currentSemesterCredits,
      supersededCourseIds,
      autoRetakeCourseIds
    };
  }, [userCourses, currentUser]);

  // 현재 학기 과목 vs 다른 학기 과목 분류
  const currentSemesterCourses = useMemo(() => {
    if (!currentUser) return [];
    return userCourses.filter(
      (c) =>
        Number(c.year) === Number(currentUser.currentYear) &&
        c.semester === currentUser.currentSemester
    );
  }, [userCourses, currentUser]);

  const otherSemestersGrouped = useMemo(() => {
    if (!currentUser) return [];
    const others = userCourses.filter(
      (c) =>
        !(
          Number(c.year) === Number(currentUser.currentYear) &&
          c.semester === currentUser.currentSemester
        )
    );
    const map = new Map();
    others.forEach((c) => {
      const key = `${c.year}-${c.semester}`;
      if (!map.has(key)) {
        map.set(key, { key, year: c.year, semester: c.semester, courses: [] });
      }
      map.get(key).courses.push(c);
    });
    return Array.from(map.values()).sort((a, b) => compareCourseChronological(b, a));
  }, [userCourses, currentUser]);

  // [필수 4] JSON 파일로 데이터 백업 다운로드 & 불러오기
  const handleExportDataFile = () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      users: usersDb,
      courses: coursesDb
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seoultech_cse_backup_${currentUser?.studentId || 'all'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({
      type: 'success',
      message: '현재 성적 및 시간표 데이터가 JSON 파일로 안전하게 다운로드되었습니다.'
    });
  };

  const handleImportDataFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.users)) setUsersDb(parsed.users);
        if (Array.isArray(parsed.courses)) setCoursesDb(parsed.courses);
        setFeedback({
          type: 'success',
          message: '백업 파일에서 모든 사용자 및 과목 데이터를 성공적으로 복원했습니다!'
        });
      } catch (err) {
        setFeedback({
          type: 'error',
          message: '올바른 백업 JSON 파일이 아닙니다.'
        });
      }
    };
    reader.readAsText(file);
  };

  // 회원가입 / 로그인 처리 (백엔드 서버 또는 Supabase 클라우드 연동 포함)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const finalDept = department.trim() === '' ? '컴퓨터공학과' : department.trim();
    const finalSid = studentId.trim();
    const finalName = name.trim();

    if (!finalSid) {
      setFeedback({ type: 'error', message: '학번을 입력해 주세요.' });
      return;
    }
    if (!finalName) {
      setFeedback({ type: 'error', message: '이름을 입력해 주세요.' });
      return;
    }

    if (authMode === 'REGISTER') {
      const exists = usersDb.find((u) => u.studentId === finalSid);
      if (exists) {
        setFeedback({
          type: 'error',
          message: '이미 가입된 학번입니다. 로그인 탭에서 로그인해 주세요.'
        });
        return;
      }

      const isAdmin =
        finalSid === '26101232' && finalName === '최준우' && finalDept === '컴퓨터공학과';

      let createdUser = {
        id: Date.now(),
        department: finalDept,
        studentId: finalSid,
        name: finalName,
        role: isAdmin ? 'ADMIN' : 'STUDENT',
        currentYear: 2026,
        currentSemester: '1학기',
        currentSemesterCredits: 0,
        totalCredits: 0,
        gpa: 0.0,
        preferredMainView: 'TIMETABLE'
      };

      // Supabase 클라우드가 연결된 경우 서버 DB에 즉시 INSERT
      if (dbMode === 'SUPABASE_CLOUD') {
        try {
          const inserted = await supabaseFetch('users', {
            method: 'POST',
            body: JSON.stringify({
              department: createdUser.department,
              studentId: createdUser.studentId,
              name: createdUser.name,
              role: createdUser.role,
              currentYear: 2026,
              currentSemester: '1학기'
            })
          });
          if (inserted?.[0]) createdUser = inserted[0];
        } catch (err) {}
      } else if (dbMode === 'BACKEND_API') {
        try {
          const res = await fetch(`${serverConfig.apiUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              department: finalDept,
              studentId: finalSid,
              name: finalName,
              autoLogin
            })
          });
          const data = await res.json();
          if (data.success && data.user) {
            createdUser = data.user;
            if (data.token) localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
          }
        } catch (err) {}
      }

      setUsersDb((prev) => [...prev, createdUser]);
      setCurrentUser(createdUser);
      if (autoLogin) {
        localStorage.setItem('seoultech_auto_login_session', JSON.stringify(createdUser));
      } else {
        sessionStorage.setItem('seoultech_temp_login_session', JSON.stringify(createdUser));
      }
      setFeedback({
        type: 'success',
        message: `${createdUser.department} ${createdUser.name} 학우님, 회원가입 및 로그인이 완료되었습니다!`
      });
    } else {
      const matched = usersDb.find(
        (u) => u.studentId === finalSid && u.department === finalDept && u.name === finalName
      );
      if (!matched) {
        setFeedback({
          type: 'error',
          message: '학과, 학번, 이름 정보가 일치하는 계정이 없습니다.'
        });
        return;
      }

      if (dbMode === 'BACKEND_API') {
        try {
          const res = await fetch(`${serverConfig.apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              department: finalDept,
              studentId: finalSid,
              name: finalName,
              autoLogin
            })
          });
          const data = await res.json();
          if (data.token) localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        } catch (err) {}
      }

      setCurrentUser(matched);
      setActiveMainView(matched.preferredMainView || 'TIMETABLE');
      setCourseYear(matched.currentYear || 2026);
      setCourseSemester(matched.currentSemester || '1학기');
      if (autoLogin) {
        localStorage.setItem('seoultech_auto_login_session', JSON.stringify(matched));
      } else {
        sessionStorage.setItem('seoultech_temp_login_session', JSON.stringify(matched));
      }
      setFeedback({ type: 'success', message: `${matched.name}님 환영합니다!` });
    }
  };

  // 현재 진행 학기 변경
  const handleCurrentSemesterChange = async (newYear, newSem) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      currentYear: Number(newYear),
      currentSemester: newSem
    };
    setCurrentUser(updatedUser);
    setUsersDb((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    if (dbMode === 'SUPABASE_CLOUD') {
      try {
        await supabaseFetch(`users?id=eq.${updatedUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            currentYear: Number(newYear),
            currentSemester: newSem
          })
        });
      } catch (e) {}
    } else if (dbMode === 'BACKEND_API') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        try {
          await fetch(`${serverConfig.apiUrl}/auth/profile`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              currentYear: Number(newYear),
              currentSemester: newSem
            })
          });
        } catch (e) {}
      }
    }
  };

  // 수업 시간 슬롯 검증 (종료시간 <= 시작시간 예외 처리)
  const validateSchedules = (schedules) => {
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      const start = timeToMinutes(s.startTime);
      const end = timeToMinutes(s.endTime);
      if (end <= start) {
        return `[시간 오류] ${i + 1}번째 수업(${s.day}요일)의 종료 시간(${s.endTime})이 시작 시간(${s.startTime})보다 빠르거나 같습니다.`;
      }
      for (let j = i + 1; j < schedules.length; j++) {
        const o = schedules[j];
        if (s.day === o.day) {
          const oStart = timeToMinutes(o.startTime);
          const oEnd = timeToMinutes(o.endTime);
          if (start < oEnd && end > oStart) {
            return `동일 과목 내에 겹치는 수업 시간(${s.day}요일)이 있습니다.`;
          }
        }
      }
    }
    return null;
  };

  // 과목 등록 처리 (클라우드/백엔드 DB 즉시 저장)
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const trimmedName = courseName.trim();
    if (!trimmedName) {
      setFeedback({ type: 'error', message: '과목명을 입력해 주세요.' });
      return;
    }

    // 동일 학기 내 중복 과목명 차단 (다른 학기 재수강은 허용)
    const duplicateInSameTerm = userCourses.some(
      (c) =>
        Number(c.year) === Number(courseYear) &&
        c.semester === courseSemester &&
        c.courseName.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateInSameTerm) {
      setFeedback({
        type: 'error',
        message: `${courseYear}년 ${courseSemester}에 이미 '${trimmedName}' 과목이 등록되어 있습니다.`
      });
      return;
    }

    const scheduleError = validateSchedules(courseSchedules);
    if (scheduleError) {
      setFeedback({ type: 'error', message: scheduleError });
      return;
    }

    let newCourse = {
      id: Date.now(),
      userId: currentUser.id,
      year: Number(courseYear),
      semester: courseSemester,
      courseName: trimmedName,
      credits: Number(courseCredits),
      grade: courseGrade,
      gradePoint: GRADE_POINTS_MAP[courseGrade] ?? null,
      schedules: courseSchedules,
      color: courseColor,
      isRetake: Boolean(courseIsRetake),
      isWithdrawn: Boolean(courseIsWithdrawn)
    };

    if (dbMode === 'SUPABASE_CLOUD') {
      try {
        const inserted = await supabaseFetch('courses', {
          method: 'POST',
          body: JSON.stringify({
            userId: newCourse.userId,
            year: newCourse.year,
            semester: newCourse.semester,
            courseName: newCourse.courseName,
            credits: newCourse.credits,
            grade: newCourse.grade,
            gradePoint: newCourse.gradePoint,
            schedules: newCourse.schedules,
            color: newCourse.color,
            isRetake: newCourse.isRetake,
            isWithdrawn: newCourse.isWithdrawn
          })
        });
        if (inserted?.[0]) newCourse = inserted[0];
      } catch (err) {}
    } else if (dbMode === 'BACKEND_API') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        try {
          const res = await fetch(`${serverConfig.apiUrl}/courses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newCourse)
          });
          const data = await res.json();
          if (data.success && data.course) newCourse = data.course;
        } catch (err) {}
      }
    }

    setCoursesDb((prev) => [...prev, newCourse]);
    setCourseName('');
    setCourseIsRetake(false);
    setCourseIsWithdrawn(false);
    setCourseColor(
      PASTEL_NEON_COLORS[(userCourses.length + 1) % PASTEL_NEON_COLORS.length].hex
    );
    setFeedback({
      type: 'success',
      message: `'${trimmedName}' 과목이 저장되었으며 GPA가 자동 계산되었습니다.`
    });
  };

  // 과목 클릭 시 수정 모달 열기
  const openEditCourseModal = (course) => {
    setEditingCourse(course);
    setModalYear(course.year);
    setModalSemester(course.semester);
    setModalCourseName(course.courseName);
    setModalCredits(course.credits);
    setModalGrade(course.grade);
    setModalColor(course.color || PASTEL_NEON_COLORS[0].hex);
    setModalIsRetake(Boolean(course.isRetake));
    setModalIsWithdrawn(Boolean(course.isWithdrawn));
    setModalSchedules(
      Array.isArray(course.schedules) && course.schedules.length > 0
        ? course.schedules.map((s) => ({ ...s }))
        : []
    );
    setModalError('');
  };

  // 과목 수정 저장
  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    const trimmedName = modalCourseName.trim();
    if (!trimmedName) {
      setModalError('과목명을 입력해 주세요.');
      return;
    }

    const dup = userCourses.some(
      (c) =>
        c.id !== editingCourse.id &&
        Number(c.year) === Number(modalYear) &&
        c.semester === modalSemester &&
        c.courseName.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (dup) {
      setModalError(`${modalYear}년 ${modalSemester}에 이미 '${trimmedName}' 과목이 존재합니다.`);
      return;
    }

    const scheduleErr = validateSchedules(modalSchedules);
    if (scheduleErr) {
      setModalError(scheduleErr);
      return;
    }

    const updatedCourse = {
      ...editingCourse,
      year: Number(modalYear),
      semester: modalSemester,
      courseName: trimmedName,
      credits: Number(modalCredits),
      grade: modalGrade,
      gradePoint: GRADE_POINTS_MAP[modalGrade] ?? null,
      schedules: modalSchedules,
      color: modalColor,
      isRetake: Boolean(modalIsRetake),
      isWithdrawn: Boolean(modalIsWithdrawn)
    };

    if (dbMode === 'SUPABASE_CLOUD') {
      try {
        await supabaseFetch(`courses?id=eq.${editingCourse.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            year: updatedCourse.year,
            semester: updatedCourse.semester,
            courseName: updatedCourse.courseName,
            credits: updatedCourse.credits,
            grade: updatedCourse.grade,
            gradePoint: updatedCourse.gradePoint,
            schedules: updatedCourse.schedules,
            color: updatedCourse.color,
            isRetake: updatedCourse.isRetake,
            isWithdrawn: updatedCourse.isWithdrawn
          })
        });
      } catch (err) {}
    } else if (dbMode === 'BACKEND_API') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        try {
          await fetch(`${serverConfig.apiUrl}/courses/${editingCourse.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(updatedCourse)
          });
        } catch (err) {}
      }
    }

    setCoursesDb((prev) => prev.map((c) => (c.id === editingCourse.id ? updatedCourse : c)));
    setEditingCourse(null);
    setFeedback({
      type: 'success',
      message: `'${trimmedName}' 과목 정보가 수정되었습니다.`
    });
  };

  // 과목 삭제
  const handleDeleteCourse = async (courseId) => {
    if (dbMode === 'SUPABASE_CLOUD') {
      try {
        await supabaseFetch(`courses?id=eq.${courseId}`, { method: 'DELETE' });
      } catch (err) {}
    } else if (dbMode === 'BACKEND_API') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        try {
          await fetch(`${serverConfig.apiUrl}/courses/${courseId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {}
      }
    }

    setCoursesDb((prev) => prev.filter((c) => c.id !== courseId));
    setEditingCourse(null);
    setFeedback({ type: 'success', message: '과목이 삭제되었으며 GPA가 갱신되었습니다.' });
  };

  // 로그아웃
  const handleLogout = () => {
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    localStorage.removeItem('seoultech_auto_login_session');
    sessionStorage.removeItem('seoultech_temp_login_session');
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  };

  // 회원탈퇴
  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    if (dbMode === 'SUPABASE_CLOUD') {
      try {
        await supabaseFetch(`users?id=eq.${currentUser.id}`, { method: 'DELETE' });
      } catch (e) {}
    }
    setUsersDb((prev) => prev.filter((u) => u.id !== currentUser.id));
    setCoursesDb((prev) => prev.filter((c) => c.userId !== currentUser.id));
    handleLogout();
  };

  // 개인정보 수정 저장
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      department: editDepartment.trim() || '컴퓨터공학과',
      studentId: editStudentId.trim() || currentUser.studentId,
      name: editName.trim() || currentUser.name
    };
    setCurrentUser(updated);
    setUsersDb((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setIsProfileModalOpen(false);
    setFeedback({ type: 'success', message: '개인정보가 수정되었습니다.' });
  };

  // 과목 카드 렌더링 컴포넌트
  const renderCourseCard = (course) => {
    const isSuperseded = gpaCalculationResult.supersededCourseIds.has(course.id);
    const isAutoRetake = gpaCalculationResult.autoRetakeCourseIds.has(course.id);
    const showRetakeBadge = course.isRetake || isAutoRetake;

    return (
      <div
        key={course.id}
        onClick={() => openEditCourseModal(course)}
        className={`group cursor-pointer rounded-xl border p-4 transition-all hover:-translate-y-0.5 ${
          course.isWithdrawn
            ? 'border-gray-800 bg-[#14141d]/60 opacity-60'
            : 'border-gray-800 bg-[#151521] hover:border-[#A8FFDB]/60'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: course.color || '#A8FFDB' }}
            />
            <h4
              className={`font-bold text-sm ${
                course.isWithdrawn ? 'line-through text-gray-500' : 'text-white'
              }`}
            >
              {course.courseName}
            </h4>
            {showRetakeBadge && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#D4B2FF]/20 text-[#D4B2FF] border border-[#D4B2FF]/40 flex items-center gap-1">
                <RotateCcw className="w-2.5 h-2.5" /> 재수강
              </span>
            )}
            {course.isWithdrawn && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#FFB2D0]/20 text-[#FFB2D0] border border-[#FFB2D0]/40 flex items-center gap-1">
                <Ban className="w-2.5 h-2.5" /> 철회(W)
              </span>
            )}
          </div>
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#1E1E2E] text-[#A8FFDB] border border-[#A8FFDB]/30">
            {course.grade}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
          <span>
            {course.year}년 {course.semester} · {course.credits}학점
          </span>
          {course.schedules?.length > 0 && (
            <span className="text-gray-300">
              {course.schedules.map((s) => `${s.day} ${s.startTime}~${s.endTime}`).join(', ')}
            </span>
          )}
        </div>

        {isSuperseded && !course.isWithdrawn && (
          <p className="mt-2 text-[11px] text-[#FFB2D0] font-medium">
            • 나중 학기 재수강 과목이 존재하여 GPA 산정에서 자동 제외됨
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] text-gray-100 p-[20px] font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* 상단 헤더 바 */}
        <header className="rounded-2xl bg-[#151521] border border-[#A8FFDB]/30 p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#A8FFDB]/15 border border-[#A8FFDB]/50 flex items-center justify-center text-[#A8FFDB]">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#D4B2FF]/15 text-[#D4B2FF] border border-[#D4B2FF]/30">
                    SEOULTECH CSE
                  </span>
                  {/* 현재 DB 저장 모드 표시 배지 */}
                  <button
                    onClick={() => setIsServerModalOpen(true)}
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition ${
                      dbMode === 'SUPABASE_CLOUD' || dbMode === 'BACKEND_API'
                        ? 'bg-[#A8FFDB]/15 text-[#A8FFDB] border-[#A8FFDB]/40'
                        : 'bg-[#FFE699]/15 text-[#FFE699] border-[#FFE699]/40 hover:bg-[#FFE699]/25'
                    }`}
                  >
                    <Cloud className="w-3 h-3" />
                    {dbMode === 'SUPABASE_CLOUD'
                      ? '클라우드 DB 실시간 연동 중'
                      : dbMode === 'BACKEND_API'
                      ? '백엔드 서버 DB 연동 중'
                      : '로컬 DB 모드 (클릭하여 클라우드/백업 설정)'}
                  </button>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  서울과학기술대학교 컴퓨터공학과 성적·시간표 시스템
                </h1>
              </div>
            </div>

            {/* 로그인된 경우 사용자 학과/학번/이름 및 GPA 표시 */}
            {currentUser && (
              <div className="flex flex-wrap items-center gap-3">
                {/* 현재 진행 학기 선택기 */}
                <div className="flex items-center gap-1.5 bg-[#0D0D12] border border-gray-800 rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-[#A8FFDB]" />
                  <span className="text-xs text-gray-400 mr-1">현재 학기:</span>
                  <select
                    value={currentUser.currentYear}
                    onChange={(e) =>
                      handleCurrentSemesterChange(e.target.value, currentUser.currentSemester)
                    }
                    className="bg-transparent text-xs font-bold text-[#A8FFDB] focus:outline-none"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y} className="bg-[#151521] text-white">
                        {y}년
                      </option>
                    ))}
                  </select>
                  <select
                    value={currentUser.currentSemester}
                    onChange={(e) =>
                      handleCurrentSemesterChange(currentUser.currentYear, e.target.value)
                    }
                    className="bg-transparent text-xs font-bold text-[#A8FFDB] focus:outline-none"
                  >
                    {SEMESTER_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-[#151521] text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 평점평균(GPA) & 학점 요약 */}
                <div className="flex items-center gap-3 bg-[#0D0D12] border border-[#D4B2FF]/40 rounded-xl px-3.5 py-2">
                  <div>
                    <p className="text-[10px] text-gray-400">평점평균 (GPA)</p>
                    <p className="text-sm font-extrabold text-[#D4B2FF]">
                      {gpaCalculationResult.gpa.toFixed(2)}{' '}
                      <span className="text-[11px] font-normal text-gray-500">/ 4.50</span>
                    </p>
                  </div>
                  <div className="h-6 w-[1px] bg-gray-800" />
                  <div>
                    <p className="text-[10px] text-gray-400">현재/총 학점</p>
                    <p className="text-xs font-bold text-[#A8FFDB]">
                      {gpaCalculationResult.currentSemesterCredits} /{' '}
                      {gpaCalculationResult.totalCredits}학점
                    </p>
                  </div>
                </div>

                {/* 이름 클릭 시 개인정보 수정/로그아웃/탈퇴 팝업 */}
                <button
                  onClick={() => {
                    setEditDepartment(currentUser.department);
                    setEditStudentId(currentUser.studentId);
                    setEditName(currentUser.name);
                    setConfirmDeleteStep(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="flex items-center gap-2.5 bg-[#1E1E2E] hover:bg-[#27273A] border border-[#A8FFDB]/40 rounded-xl px-3.5 py-2 transition"
                >
                  <UserIcon className="w-4 h-4 text-[#A8FFDB]" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white flex items-center gap-1">
                      {currentUser.name}
                      {currentUser.role === 'ADMIN' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FFB2D0]/20 text-[#FFB2D0]">
                          ADMIN
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {currentUser.department} · {currentUser.studentId}
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 알림 메시지 배너 */}
        {feedback.message && (
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm ${
              feedback.type === 'error'
                ? 'bg-[#FFB2D0]/10 border-[#FFB2D0]/40 text-[#FFB2D0]'
                : 'bg-[#A8FFDB]/10 border-[#A8FFDB]/40 text-[#A8FFDB]'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback({ type: '', message: '' })}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 비로그인 상태: 로그인 / 회원가입 화면 */}
        {!currentUser ? (
          <div className="max-w-md mx-auto bg-[#151521] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex gap-2 mb-6 bg-[#0D0D12] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthMode('LOGIN')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                  authMode === 'LOGIN'
                    ? 'bg-[#A8FFDB] text-[#0D0D12]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('REGISTER')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                  authMode === 'REGISTER'
                    ? 'bg-[#D4B2FF] text-[#0D0D12]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                회원가입
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  학과 (기본값: 컴퓨터공학과, 직접 수정 가능)
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3.5 py-2.5 text-sm text-white focus:border-[#A8FFDB] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">학번</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="예: 26101232"
                  className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3.5 py-2.5 text-sm text-white focus:border-[#A8FFDB] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 최준우"
                  className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3.5 py-2.5 text-sm text-white focus:border-[#A8FFDB] focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoLogin}
                  onChange={(e) => setAutoLogin(e.target.checked)}
                  className="rounded accent-[#A8FFDB]"
                />
                자동 로그인 유지
              </label>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#A8FFDB] to-[#D4B2FF] text-[#0D0D12] hover:opacity-95 transition"
              >
                {authMode === 'LOGIN' ? '로그인하기' : '회원가입 완료'}
              </button>
            </form>
          </div>
        ) : (
          /* 로그인 후 메인 인터페이스 */
          <div className="space-y-5">
            {/* 상단 메인 화면 전환 탭 & 데이터 백업 버튼 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveMainView('TIMETABLE')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition ${
                    activeMainView === 'TIMETABLE'
                      ? 'bg-[#A8FFDB] text-[#0D0D12] border-[#A8FFDB]'
                      : 'bg-[#151521] text-gray-300 border-gray-800 hover:border-[#A8FFDB]/40'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  1. 주간 시간표 확인 화면
                </button>
                <button
                  onClick={() => setActiveMainView('DASHBOARD')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition ${
                    activeMainView === 'DASHBOARD'
                      ? 'bg-[#D4B2FF] text-[#0D0D12] border-[#D4B2FF]'
                      : 'bg-[#151521] text-gray-300 border-gray-800 hover:border-[#D4B2FF]/40'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  2. 도구
                </button>
              </div>

              {/* [필수 4] 데이터 파일 백업 / 불러오기 & 클라우드 설정 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportDataFile}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#151521] border border-gray-800 hover:border-[#A8FFDB]/50 text-[#A8FFDB]"
                >
                  <Download className="w-3.5 h-3.5" /> 데이터 백업(.json)
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#151521] border border-gray-800 hover:border-[#D4B2FF]/50 text-[#D4B2FF]"
                >
                  <Upload className="w-3.5 h-3.5" /> 데이터 불러오기
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportDataFile}
                  className="hidden"
                />
              </div>
            </div>

            {/* 화면 1: 주간 시간표 확인 화면 */}
            {activeMainView === 'TIMETABLE' && (
              <div className="bg-[#151521] border border-gray-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-white">
                      {currentUser.currentYear}년 {currentUser.currentSemester} 주간 시간표
                    </h2>
                    <p className="text-xs text-gray-400">
                      시간표의 과목 블록을 클릭하면 즉시 수정하거나 삭제할 수 있습니다. (철회 과목은 시간표에서 제외됨)
                    </p>
                  </div>
                </div>

                {/* 주간 시간표 격자 (월~금, 09:00 ~ 21:00) */}
                <div className="overflow-x-auto">
                  <div className="min-w-[680px] border border-gray-800 rounded-xl overflow-hidden bg-[#0D0D12]">
                    <div className="grid grid-cols-6 border-b border-gray-800 bg-[#151521] text-xs font-bold text-center py-2.5">
                      <div className="text-gray-500">시간</div>
                      {DAY_OPTIONS.map((d) => (
                        <div key={d} className="text-[#A8FFDB]">
                          {d}요일
                        </div>
                      ))}
                    </div>

                    <div className="relative grid grid-cols-6" style={{ height: '720px' }}>
                      {/* 좌측 시간 축 (09:00 ~ 21:00) */}
                      <div className="border-r border-gray-800/80 relative">
                        {Array.from({ length: 12 }, (_, idx) => 9 + idx).map((hour) => (
                          <div
                            key={hour}
                            className="border-b border-gray-800/40 text-[11px] text-gray-500 px-2 pt-1"
                            style={{ height: '60px' }}
                          >
                            {String(hour).padStart(2, '0')}:00
                          </div>
                        ))}
                      </div>

                      {/* 요일별 컬럼 */}
                      {DAY_OPTIONS.map((day) => (
                        <div
                          key={day}
                          className="border-r border-gray-800/50 relative"
                          style={{ height: '720px' }}
                        >
                          {Array.from({ length: 12 }, (_, idx) => idx).map((rowIdx) => (
                            <div
                              key={rowIdx}
                              className="border-b border-gray-800/30"
                              style={{ height: '60px' }}
                            />
                          ))}

                          {/* 현재 학기 과목 블록 렌더링 */}
                          {currentSemesterCourses
                            .filter((c) => !c.isWithdrawn)
                            .map((course) =>
                              (course.schedules || [])
                                .filter((s) => s.day === day)
                                .map((slot, sIdx) => {
                                  const startMin = timeToMinutes(slot.startTime);
                                  const endMin = timeToMinutes(slot.endTime);
                                  const topPx = ((startMin - 540) / 720) * 720;
                                  const heightPx = Math.max(((endMin - startMin) / 720) * 720, 28);

                                  return (
                                    <div
                                      key={`${course.id}-${sIdx}`}
                                      onClick={() => openEditCourseModal(course)}
                                      style={{
                                        top: `${topPx}px`,
                                        height: `${heightPx}px`,
                                        backgroundColor: course.color || '#A8FFDB'
                                      }}
                                      className="absolute inset-x-1 rounded-lg p-1.5 text-[#0D0D12] shadow-md cursor-pointer overflow-hidden hover:brightness-105 transition"
                                    >
                                      <p className="font-extrabold text-xs leading-tight truncate">
                                        {course.courseName}
                                      </p>
                                      <p className="text-[10px] font-semibold opacity-80">
                                        {slot.startTime}~{slot.endTime} ({course.credits}학점)
                                      </p>
                                    </div>
                                  );
                                })
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 화면 2: 도구 (카테고리 분리: 과목 등록 및 수정 / 학기별 조회) */}
            {activeMainView === 'DASHBOARD' && (
              <div className="space-y-5">
                {/* 도구 카테고리 선택 버튼 (번호 '1.' 제거 완료) */}
                <div className="bg-[#151521] border border-gray-800 rounded-2xl p-4 flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold text-gray-400 mr-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#D4B2FF]" /> 도구 카테고리:
                  </span>
                  <button
                    onClick={() => setActiveToolCategory('COURSE_MANAGER')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                      activeToolCategory === 'COURSE_MANAGER'
                        ? 'bg-[#A8FFDB] text-[#0D0D12]'
                        : 'bg-[#0D0D12] text-gray-300 border border-gray-800 hover:border-[#A8FFDB]/40'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" /> 과목 등록 및 수정
                  </button>
                  <button
                    onClick={() => setActiveToolCategory('SEMESTER_VIEW')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                      activeToolCategory === 'SEMESTER_VIEW'
                        ? 'bg-[#D4B2FF] text-[#0D0D12]'
                        : 'bg-[#0D0D12] text-gray-300 border border-gray-800 hover:border-[#D4B2FF]/40'
                    }`}
                  >
                    <FolderKanban className="w-4 h-4" /> 학기별 조회
                  </button>
                </div>

                {/* 카테고리 1: 과목 등록 및 수정 */}
                {activeToolCategory === 'COURSE_MANAGER' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* 좌측: 과목 등록 폼 */}
                    <form
                      onSubmit={handleCreateCourse}
                      className="lg:col-span-5 bg-[#151521] border border-gray-800 rounded-2xl p-5 space-y-4"
                    >
                      <h3 className="text-base font-extrabold text-[#A8FFDB] flex items-center gap-2">
                        <Plus className="w-5 h-5" /> 과목 및 성적 등록
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">수강 년도</label>
                          <select
                            value={courseYear}
                            onChange={(e) => setCourseYear(Number(e.target.value))}
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-sm text-white"
                          >
                            {YEAR_OPTIONS.map((y) => (
                              <option key={y} value={y}>
                                {y}년
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">수강 학기</label>
                          <select
                            value={courseSemester}
                            onChange={(e) => setCourseSemester(e.target.value)}
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-sm text-white"
                          >
                            {SEMESTER_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          과목명 (동일 학기 중복 불가, 타 학기 재수강 시 최신 학기 GPA 반영)
                        </label>
                        <input
                          type="text"
                          value={courseName}
                          onChange={(e) => setCourseName(e.target.value)}
                          placeholder="예: 자료구조, 운영체제"
                          className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3.5 py-2 text-sm text-white focus:border-[#A8FFDB] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">학점 (1~4학점)</label>
                          <select
                            value={courseCredits}
                            onChange={(e) => setCourseCredits(Number(e.target.value))}
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-sm text-white"
                          >
                            {CREDIT_OPTIONS.map((c) => (
                              <option key={c} value={c}>
                                {c}학점
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">성적 등급</label>
                          <select
                            value={courseGrade}
                            onChange={(e) => setCourseGrade(e.target.value)}
                            className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-sm text-white"
                          >
                            {GRADE_OPTIONS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 선택 사항: 재수강 / 수강철회(W) 체크박스 */}
                      <div className="p-3 rounded-xl bg-[#0D0D12] border border-gray-800 space-y-2">
                        <p className="text-xs font-bold text-gray-300">
                          재수강 / 철회 표시 (선택 사항 - 설정하지 않아도 등록 가능)
                        </p>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={courseIsRetake}
                              onChange={(e) => setCourseIsRetake(e.target.checked)}
                              className="accent-[#D4B2FF]"
                            />
                            재수강 과목 표시
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={courseIsWithdrawn}
                              onChange={(e) => setCourseIsWithdrawn(e.target.checked)}
                              className="accent-[#FFB2D0]"
                            />
                            수강 철회(W) 표시 (GPA 제외)
                          </label>
                        </div>
                      </div>

                      {/* 분할 수업 시간 동적 입력 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#A8FFDB]" /> 수업 요일 및 시간
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setCourseSchedules((prev) => [
                                ...prev,
                                { day: '수', startTime: '09:00', endTime: '10:30' }
                              ])
                            }
                            className="text-xs font-bold text-[#A8FFDB] hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> 시간 추가
                          </button>
                        </div>

                        {courseSchedules.map((slot, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <select
                              value={slot.day}
                              onChange={(e) =>
                                setCourseSchedules((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, day: e.target.value } : item
                                  )
                                )
                              }
                              className="rounded-lg bg-[#0D0D12] border border-gray-800 px-2.5 py-1.5 text-xs text-white"
                            >
                              {DAY_OPTIONS.map((d) => (
                                <option key={d} value={d}>
                                  {d}요일
                                </option>
                              ))}
                            </select>
                            <select
                              value={slot.startTime}
                              onChange={(e) =>
                                setCourseSchedules((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, startTime: e.target.value } : item
                                  )
                                )
                              }
                              className="rounded-lg bg-[#0D0D12] border border-gray-800 px-2.5 py-1.5 text-xs text-white"
                            >
                              {TIME_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            <span className="text-gray-500 text-xs">~</span>
                            <select
                              value={slot.endTime}
                              onChange={(e) =>
                                setCourseSchedules((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, endTime: e.target.value } : item
                                  )
                                )
                              }
                              className="rounded-lg bg-[#0D0D12] border border-gray-800 px-2.5 py-1.5 text-xs text-white"
                            >
                              {TIME_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            {courseSchedules.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setCourseSchedules((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="text-gray-500 hover:text-[#FFB2D0] p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl font-extrabold text-sm bg-[#A8FFDB] text-[#0D0D12] hover:opacity-95 transition"
                      >
                        과목 저장 및 GPA 반영
                      </button>
                    </form>

                    {/* 우측: 전체 등록 과목 빠른 목록 */}
                    <div className="lg:col-span-7 bg-[#151521] border border-gray-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-white">
                          등록된 과목 목록 ({userCourses.length}개)
                        </h3>
                        <span className="text-xs text-gray-400">
                          과목 카드를 클릭하면 수정/삭제할 수 있습니다
                        </span>
                      </div>

                      {userCourses.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-sm">
                          아직 등록된 과목이 없습니다. 좌측 폼에서 첫 과목을 등록해 보세요!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {userCourses.map((course) => renderCourseCard(course))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 카테고리 2: 학기별 조회 (현재 학기 상단 고정 + 타 학기 그룹 분류 + 접기/펼치기) */}
                {activeToolCategory === 'SEMESTER_VIEW' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#151521] border border-gray-800 rounded-2xl p-4">
                      <div>
                        <h3 className="text-base font-extrabold text-white">
                          학기별 이수 과목 조회
                        </h3>
                        <p className="text-xs text-gray-400">
                          현재 학기 과목이 상단에 고정되며, 각 학기 탭을 클릭해 목록을 접거나 펼칠 수 있습니다.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCollapsedSemesters({})}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0D0D12] text-[#A8FFDB] border border-gray-800"
                        >
                          모두 펼치기
                        </button>
                        <button
                          onClick={() => {
                            const next = { CURRENT: true };
                            otherSemestersGrouped.forEach((g) => {
                              next[g.key] = true;
                            });
                            setCollapsedSemesters(next);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0D0D12] text-gray-400 border border-gray-800"
                        >
                          모두 접기
                        </button>
                      </div>
                    </div>

                    {/* 1. 상단 고정: 현재 학기 과목 목록 */}
                    <div className="bg-[#151521] border-2 border-[#A8FFDB]/40 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleSemesterCollapse('CURRENT')}
                        className="w-full flex items-center justify-between px-5 py-4 bg-[#A8FFDB]/10 text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#A8FFDB] text-[#0D0D12]">
                            현재 학기
                          </span>
                          <span className="font-extrabold text-white text-sm sm:text-base">
                            {currentUser.currentYear}년 {currentUser.currentSemester} (
                            {currentSemesterCourses.length}과목)
                          </span>
                        </div>
                        {collapsedSemesters['CURRENT'] ? (
                          <ChevronDown className="w-5 h-5 text-[#A8FFDB]" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-[#A8FFDB]" />
                        )}
                      </button>

                      {!collapsedSemesters['CURRENT'] && (
                        <div className="p-5">
                          {currentSemesterCourses.length === 0 ? (
                            <p className="text-xs text-gray-500">
                              현재 학기({currentUser.currentYear}년 {currentUser.currentSemester})에 등록된 과목이 없습니다.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {currentSemesterCourses.map((c) => renderCourseCard(c))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. 하단: 다른 학기 이수 과목들 (학기별 아코디언) */}
                    {otherSemestersGrouped.map((group) => {
                      const isCollapsed = Boolean(collapsedSemesters[group.key]);
                      return (
                        <div
                          key={group.key}
                          className="bg-[#151521] border border-gray-800 rounded-2xl overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSemesterCollapse(group.key)}
                            className="w-full flex items-center justify-between px-5 py-3.5 bg-[#1A1A28] hover:bg-[#202032] transition text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#D4B2FF]/15 text-[#D4B2FF]">
                                이수 학기
                              </span>
                              <span className="font-bold text-white text-sm">
                                {group.year}년 {group.semester} ({group.courses.length}과목)
                              </span>
                            </div>
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            )}
                          </button>

                          {!isCollapsed && (
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {group.courses.map((c) => renderCourseCard(c))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 모달 1: 과목 수정 / 삭제 팝업 */}
        {editingCourse && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <form
              onSubmit={handleUpdateCourse}
              className="w-full max-w-lg bg-[#151521] border border-[#A8FFDB]/40 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#A8FFDB]" /> 과목 정보 수정 및 삭제
                </h3>
                <button type="button" onClick={() => setEditingCourse(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-[#FFB2D0]/10 border border-[#FFB2D0]/40 text-xs text-[#FFB2D0]">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">수강 년도</label>
                  <select
                    value={modalYear}
                    onChange={(e) => setModalYear(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-sm text-white"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y}년
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">수강 학기</label>
                  <select
                    value={modalSemester}
                    onChange={(e) => setModalSemester(e.target.value)}
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-sm text-white"
                  >
                    {SEMESTER_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">과목명</label>
                <input
                  type="text"
                  value={modalCourseName}
                  onChange={(e) => setModalCourseName(e.target.value)}
                  className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">학점</label>
                  <select
                    value={modalCredits}
                    onChange={(e) => setModalCredits(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-sm text-white"
                  >
                    {CREDIT_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}학점
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">성적 등급</label>
                  <select
                    value={modalGrade}
                    onChange={(e) => setModalGrade(e.target.value)}
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-sm text-white"
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 p-3 rounded-xl bg-[#0D0D12] border border-gray-800">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalIsRetake}
                    onChange={(e) => setModalIsRetake(e.target.checked)}
                    className="accent-[#D4B2FF]"
                  />
                  재수강 표시
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalIsWithdrawn}
                    onChange={(e) => setModalIsWithdrawn(e.target.checked)}
                    className="accent-[#FFB2D0]"
                  />
                  수강 철회(W)
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-800 gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteCourse(editingCourse.id)}
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#FFB2D0]/15 text-[#FFB2D0] border border-[#FFB2D0]/40 hover:bg-[#FFB2D0]/25"
                >
                  과목 삭제
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCourse(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-800 text-gray-300"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#A8FFDB] text-[#0D0D12]"
                  >
                    변경사항 저장
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 모달 2: 이름 클릭 시 개인정보 수정 / 로그아웃 / 회원탈퇴 팝업 */}
        {isProfileModalOpen && currentUser && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#151521] border border-[#D4B2FF]/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">개인정보 수정 및 계정 관리</h3>
                <button onClick={() => setIsProfileModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">학과</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">학번</label>
                  <input
                    type="text"
                    value={editStudentId}
                    onChange={(e) => setEditStudentId(e.target.value)}
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">이름</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-extrabold text-xs bg-[#A8FFDB] text-[#0D0D12]"
                >
                  개인정보 저장
                </button>
              </form>

              <div className="pt-4 border-t border-gray-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1E1E2E] text-gray-200 hover:bg-gray-800 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> 로그아웃
                </button>
                {!confirmDeleteStep ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteStep(true)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#FFB2D0]/15 text-[#FFB2D0] border border-[#FFB2D0]/30"
                  >
                    회원탈퇴
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-[#FFB2D0] text-[#0D0D12]"
                  >
                    정말 탈퇴하기 (확인)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 모달 3: 클라우드 DB(Supabase) 및 백엔드 서버 주소 설정 모달 */}
        {isServerModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#151521] border border-[#A8FFDB]/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#A8FFDB]" /> 클라우드 DB / 백엔드 서버 연결
                </h3>
                <button onClick={() => setIsServerModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                여러 사용자가 기기 상관없이 접속하려면 무료 <strong>Supabase</strong> URL과 Anon Key를 입력하거나 배포된 백엔드 API 주소를 입력하세요.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Supabase Project URL (선택)
                  </label>
                  <input
                    type="text"
                    value={serverConfig.supabaseUrl}
                    onChange={(e) =>
                      setServerConfig((prev) => ({ ...prev, supabaseUrl: e.target.value }))
                    }
                    placeholder="https://xxxx.supabase.co"
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Supabase Anon Public Key (선택)
                  </label>
                  <input
                    type="password"
                    value={serverConfig.supabaseKey}
                    onChange={(e) =>
                      setServerConfig((prev) => ({ ...prev, supabaseKey: e.target.value }))
                    }
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Node.js 백엔드 서버 주소 (기본: http://localhost:5000/api)
                  </label>
                  <input
                    type="text"
                    value={serverConfig.apiUrl}
                    onChange={(e) =>
                      setServerConfig((prev) => ({ ...prev, apiUrl: e.target.value }))
                    }
                    className="w-full rounded-xl bg-[#0D0D12] border border-gray-800 px-3 py-2 text-xs text-white"
                  />
                </div>
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