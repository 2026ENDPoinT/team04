import React, { useState, useEffect } from 'react';
import {
  Terminal, UserCheck, ShieldAlert, LogOut, Calendar,
  LayoutGrid, Sparkles, CheckCircle2, AlertCircle, Building2,
  CreditCard, User as UserIcon, RefreshCw
} from 'lucide-react';

// 초기 시드 데이터: 조건 3에 따른 기본 운영자 계정 1개 + 샘플 학생 계정
const INITIAL_USERS_DB = [
  {
    id: 1,
    department: '컴퓨터공학과',
    studentId: 'ADMIN',
    name: '운영자',
    role: 'ADMIN',
    currentSemesterCredits: 0,
    totalCredits: 0,
    gpa: 4.50,
    preferredMainView: 'DASHBOARD'
  },
  {
    id: 2,
    department: '컴퓨터공학과',
    studentId: '21101234',
    name: '김과기',
    role: 'STUDENT',
    currentSemesterCredits: 18,
    totalCredits: 72,
    gpa: 4.15,
    preferredMainView: 'TIMETABLE'
  }
];

export default function App() {
  // 서버 DB 시뮬레이션 상태 (실제 배포 시 백엔드 /api/auth 와 연동되며, 프리뷰에서 즉시 테스트 가능하도록 구성)
  const [usersDb, setUsersDb] = useState(() => {
    try {
      const saved = localStorage.getItem('seoultech_users_db');
      return saved ? JSON.parse(saved) : INITIAL_USERS_DB;
    } catch (e) {
      return INITIAL_USERS_DB;
    }
  });

  // 현재 로그인한 사용자 상태
  const [currentUser, setCurrentUser] = useState(null);
  const [activeMainView, setActiveMainView] = useState('TIMETABLE'); // 'TIMETABLE' | 'DASHBOARD'

  // 로그인 / 회원가입 폼 상태
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  const [department, setDepartment] = useState('컴퓨터공학과'); // 조건 2: 기본값 컴퓨터공학과, 수정 가능
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [autoLogin, setAutoLogin] = useState(true);

  // 피드백 알림 상태
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [tempDept, setTempDept] = useState('');

  // DB 변경 시 로컬 스토리지 동기화
  useEffect(() => {
    try {
      localStorage.setItem('seoultech_users_db', JSON.stringify(usersDb));
    } catch (e) {
      console.error('Storage sync error:', e);
    }
  }, [usersDb]);

  // [동작 흐름 1] 초기 접속 시 자동 로그인 세션 확인
  useEffect(() => {
    try {
      const savedSession =
        localStorage.getItem('seoultech_auth_session') ||
        sessionStorage.getItem('seoultech_auth_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const latestUser = usersDb.find((u) => u.studentId === parsed.studentId);
        if (latestUser) {
          setCurrentUser(latestUser);
          setActiveMainView(latestUser.preferredMainView || 'TIMETABLE');
          setFeedback({
            type: 'success',
            message: `자동 로그인되었습니다. (${latestUser.department} / ${latestUser.name})`
          });
        }
      }
    } catch (e) {
      localStorage.removeItem('seoultech_auth_session');
    }
  }, []);

  // [필수 5] 입력값 검증 및 회원가입/로그인 처리
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const cleanDept = department.trim() || '컴퓨터공학과';
    const cleanStudentId = studentId.trim();
    const cleanName = name.trim();

    // 기본 예외 처리 (학번 자릿수 제한은 없으나 빈 값은 차단)
    if (!cleanStudentId) {
      setFeedback({
        type: 'error',
        message: '[예외 처리] 학번을 입력해 주세요. (자릿수 무관)'
      });
      return;
    }
    if (!cleanName) {
      setFeedback({
        type: 'error',
        message: '[예외 처리] 이름을 입력해 주세요.'
      });
      return;
    }

    if (authMode === 'REGISTER') {
      // 중복 학번 체크
      const exists = usersDb.find(
        (u) => u.studentId.toLowerCase() === cleanStudentId.toLowerCase()
      );
      if (exists) {
        setFeedback({
          type: 'error',
          message: `이미 가입된 학번(${cleanStudentId})입니다. 로그인 탭에서 접속해 주세요.`
        });
        return;
      }

      const newUser = {
        id: Date.now(),
        department: cleanDept,
        studentId: cleanStudentId,
        name: cleanName,
        role: cleanStudentId.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT',
        currentSemesterCredits: 0,
        totalCredits: 0,
        gpa: 0.0,
        preferredMainView: 'TIMETABLE'
      };

      const updatedDb = [...usersDb, newUser];
      setUsersDb(updatedDb);
      setCurrentUser(newUser);
      setActiveMainView(newUser.preferredMainView);

      if (autoLogin) {
        localStorage.setItem('seoultech_auth_session', JSON.stringify(newUser));
      } else {
        sessionStorage.setItem('seoultech_auth_session', JSON.stringify(newUser));
      }

      setFeedback({
        type: 'success',
        message: `${newUser.department} ${newUser.name}님 회원가입 및 로그인이 완료되었습니다!`
      });
    } else {
      // 로그인 처리: 학과 + 학번 + 이름 일치 여부 확인
      const foundUser = usersDb.find(
        (u) => u.studentId.toLowerCase() === cleanStudentId.toLowerCase()
      );

      if (!foundUser) {
        setFeedback({
          type: 'error',
          message: '등록되지 않은 학번입니다. 회원가입을 먼저 진행하거나 학번을 확인해 주세요.'
        });
        return;
      }

      if (foundUser.department !== cleanDept || foundUser.name !== cleanName) {
        setFeedback({
          type: 'error',
          message: `학번(${foundUser.studentId})에 등록된 학과(${foundUser.department}) 또는 이름이 일치하지 않습니다.`
        });
        return;
      }

      setCurrentUser(foundUser);
      setActiveMainView(foundUser.preferredMainView || 'TIMETABLE');

      if (autoLogin) {
        localStorage.setItem('seoultech_auth_session', JSON.stringify(foundUser));
      } else {
        sessionStorage.setItem('seoultech_auth_session', JSON.stringify(foundUser));
      }

      setFeedback({
        type: 'success',
        message: `${foundUser.name}님 환영합니다! 서버에서 최신 성적 및 시간표 설정을 불러왔습니다.`
      });
    }
  };

  // 빠른 계정 채우기 (테스터 편의용: 운영자 계정 / 샘플 학생 계정)
  const fillQuickAccount = (account) => {
    setAuthMode('LOGIN');
    setDepartment(account.department);
    setStudentId(account.studentId);
    setName(account.name);
    setFeedback({
      type: 'info',
      message: `[테스터 프리셋] ${account.name}(${account.studentId}) 계정 정보가 입력되었습니다. 하단 로그인 버튼을 눌러주세요.`
    });
  };

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem('seoultech_auth_session');
    sessionStorage.removeItem('seoultech_auth_session');
    setCurrentUser(null);
    setStudentId('');
    setName('');
    setDepartment('컴퓨터공학과');
    setFeedback({ type: 'info', message: '안전하게 로그아웃되었습니다.' });
  };

  // 메인 화면 선호도 변경 및 서버(DB) 저장
  const handleMainViewChange = (viewType) => {
    setActiveMainView(viewType);
    if (!currentUser) return;

    const updatedUser = { ...currentUser, preferredMainView: viewType };
    setCurrentUser(updatedUser);
    setUsersDb((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    if (localStorage.getItem('seoultech_auth_session')) {
      localStorage.setItem('seoultech_auth_session', JSON.stringify(updatedUser));
    }
  };

  // 로그인 후 상단 바에서 학과 직접 수정 저장
  const handleSaveDepartment = () => {
    if (!tempDept.trim()) return;
    const updatedUser = { ...currentUser, department: tempDept.trim() };
    setCurrentUser(updatedUser);
    setUsersDb((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (localStorage.getItem('seoultech_auth_session')) {
      localStorage.setItem('seoultech_auth_session', JSON.stringify(updatedUser));
    }
    setIsEditingDept(false);
    setFeedback({
      type: 'success',
      message: `소속 학과가 '${updatedUser.department}'(으)로 변경되었습니다.`
    });
  };

  return (
    /* 요구사항 2: 외곽 20px 여백 (p-[20px]), 컴퓨터공학과 스타일 블랙 & 파스텔 네온 테마 */
    <div className="min-h-screen bg-[#0B0C10] text-slate-100 p-[20px] font-sans selection:bg-[#A8FFDB] selection:text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 상단 헤더: 로그인 여부에 따라 사용자 학과/학번/이름 및 GPA 표시 */}
        <header className="bg-[#14161F] border border-[#A8FFDB]/30 rounded-2xl p-4 sm:p-5 shadow-[0_0_25px_rgba(168,255,219,0.07)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#A8FFDB]/10 border border-[#A8FFDB]/40 flex items-center justify-center text-[#A8FFDB] shadow-[0_0_15px_rgba(168,255,219,0.2)]">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4B2FF]/15 text-[#D4B2FF] border border-[#D4B2FF]/30">
                  SEOULTECH CSE
                </span>
                {currentUser?.role === 'ADMIN' && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FFB2D0]/20 text-[#FFB2D0] border border-[#FFB2D0]/40 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> ADMIN 계정
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                서울과기대 성적 & 시간표 관리 시스템
              </h1>
            </div>
          </div>

          {/* 로그인 상태일 때 상단 학과/학번/이름 및 평점평균(GPA) 출력 */}
          {currentUser ? (
            <div className="w-full md:w-auto flex flex-wrap items-center justify-between md:justify-end gap-3 sm:gap-5 bg-[#1B1E2B] px-4 py-2.5 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs">학과</span>
                  {isEditingDept ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempDept}
                        onChange={(e) => setTempDept(e.target.value)}
                        className="bg-[#0B0C10] border border-[#A8FFDB] rounded px-2 py-0.5 text-xs text-white w-28 focus:outline-none"
                      />
                      <button
                        onClick={handleSaveDepartment}
                        className="text-xs px-2 py-0.5 bg-[#A8FFDB] text-slate-900 rounded font-semibold"
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTempDept(currentUser.department);
                        setIsEditingDept(true);
                      }}
                      title="클릭하여 학과 수정"
                      className="font-semibold text-[#A8FFDB] hover:underline flex items-center gap-1"
                    >
                      {currentUser.department}
                    </button>
                  )}
                </div>
                <span className="text-slate-700">|</span>
                <div>
                  <span className="text-slate-400 text-xs mr-1.5">학번</span>
                  <span className="font-mono font-semibold text-white">{currentUser.studentId}</span>
                </div>
                <span className="text-slate-700">|</span>
                <div>
                  <span className="text-slate-400 text-xs mr-1.5">이름</span>
                  <span className="font-semibold text-white">{currentUser.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-lg bg-[#D4B2FF]/15 border border-[#D4B2FF]/40 text-right">
                  <span className="text-[11px] text-[#D4B2FF] block leading-none">평점평균 (GPA)</span>
                  <span className="font-mono text-base font-bold text-white">
                    {Number(currentUser.gpa || 0).toFixed(2)}{' '}
                    <span className="text-xs text-slate-400">/ 4.5</span>
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-[#FFB2D0]/20 text-slate-300 hover:text-[#FFB2D0] border border-slate-700 hover:border-[#FFB2D0]/40 transition"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A8FFDB] animate-pulse" />
              Step 1: 인증 모듈 활성화됨 (학과/학번/이름 인증)
            </div>
          )}
        </header>

        {/* 알림 메시지 배너 */}
        {feedback.message && (
          <div
            className={`px-4 py-3 rounded-xl border flex items-center justify-between text-sm transition-all ${
              feedback.type === 'error'
                ? 'bg-[#FFB2D0]/10 border-[#FFB2D0]/40 text-[#FFB2D0]'
                : feedback.type === 'success'
                ? 'bg-[#A8FFDB]/10 border-[#A8FFDB]/40 text-[#A8FFDB]'
                : 'bg-[#D4B2FF]/10 border-[#D4B2FF]/40 text-[#D4B2FF]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback({ type: '', message: '' })}
              className="text-xs opacity-70 hover:opacity-100 ml-4"
            >
              닫기
            </button>
          </div>
        )}

        {/* 비로그인 상태: 회원가입 / 로그인 화면 */}
        {!currentUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 좌측: 인증 폼 카드 */}
            <div className="lg:col-span-7 bg-[#14161F] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex gap-2 p-1 bg-[#0B0C10] rounded-xl border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setFeedback({ type: '', message: '' });
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                    authMode === 'LOGIN'
                      ? 'bg-[#A8FFDB] text-slate-950 shadow-[0_0_15px_rgba(168,255,219,0.3)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('REGISTER');
                    setFeedback({ type: '', message: '' });
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                    authMode === 'REGISTER'
                      ? 'bg-[#D4B2FF] text-slate-950 shadow-[0_0_15px_rgba(212,178,255,0.3)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  신규 회원가입
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* 조건 2: 학과 기본값 '컴퓨터공학과' + 자유 수정 가능 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#A8FFDB]" />
                      학과 (기본값: 컴퓨터공학과 / 직접 수정 가능)
                    </label>
                    {department !== '컴퓨터공학과' && (
                      <button
                        type="button"
                        onClick={() => setDepartment('컴퓨터공학과')}
                        className="text-[11px] text-[#A8FFDB] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> 기본값 복원
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="학과명을 입력하세요 (예: 컴퓨터공학과, 인공지능응용학과)"
                    className="w-full bg-[#0B0C10] border border-slate-700 focus:border-[#A8FFDB] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition"
                  />
                </div>

                {/* 조건 3: 학번 자릿수 제한 해제 */}
                <div>
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#D4B2FF]" />
                    학번 (자릿수 제한 없음 / 운영자는 ADMIN 입력)
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="학번을 입력하세요 (예: 21101234, 24학번, ADMIN 등)"
                    className="w-full bg-[#0B0C10] border border-slate-700 focus:border-[#D4B2FF] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none transition"
                  />
                </div>

                {/* 이름 입력 */}
                <div>
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-[#FFB2D0]" />
                    이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="w-full bg-[#0B0C10] border border-slate-700 focus:border-[#FFB2D0] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition"
                  />
                </div>

                {/* 자동 로그인 체크박스 */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={autoLogin}
                      onChange={(e) => setAutoLogin(e.target.checked)}
                      className="rounded border-slate-700 bg-[#0B0C10] text-[#A8FFDB] focus:ring-0"
                    />
                    <span>자동 로그인 유지 (기기 재접속 시 즉시 동기화)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                    authMode === 'LOGIN'
                      ? 'bg-[#A8FFDB] hover:bg-[#8ef5c8] text-slate-950 shadow-[0_0_20px_rgba(168,255,219,0.25)]'
                      : 'bg-[#D4B2FF] hover:bg-[#c399ff] text-slate-950 shadow-[0_0_20px_rgba(212,178,255,0.25)]'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  {authMode === 'LOGIN' ? '학과 / 학번 / 이름으로 로그인' : '입력한 정보로 회원가입 완료'}
                </button>
              </form>
            </div>

            {/* 우측: 테스터 검증용 계정 목록 (운영자 계정 포함) */}
            <div className="lg:col-span-5 bg-[#14161F] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#A8FFDB] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  서버 등록 계정 목록 (원클릭 테스트)
                </h2>
                <span className="text-xs font-mono text-slate-400">총 {usersDb.length}명</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                아래 계정을 클릭하면 좌측 로그인 폼에 학과/학번/이름이 자동으로 채워집니다. 조건 3에 따라{' '}
                <strong className="text-white">운영자 계정(ADMIN)</strong>이 기본 생성되어 있습니다.
              </p>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {usersDb.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => fillQuickAccount(acc)}
                    className="p-3.5 rounded-xl bg-[#0B0C10] border border-slate-800 hover:border-[#A8FFDB]/60 cursor-pointer transition group flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white group-hover:text-[#A8FFDB] transition">
                          {acc.name}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          학번: {acc.studentId}
                        </span>
                        {acc.role === 'ADMIN' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FFB2D0]/20 text-[#FFB2D0] border border-[#FFB2D0]/40">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        소속 학과: <span className="text-slate-300">{acc.department}</span> · GPA{' '}
                        {Number(acc.gpa || 0).toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs text-[#A8FFDB] opacity-0 group-hover:opacity-100 transition font-mono">
                      선택 →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 로그인 완료 후: 메인 화면 전환 바 (1번 주간 시간표 화면 vs 2번 기능성 화면) */
          <div className="space-y-5">
            <div className="bg-[#14161F] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  메인 화면 모드 선택 (서버에 선호 화면 자동 저장)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  원하는 화면을 기본 메인 화면으로 선택할 수 있으며 다음 로그인 시에도 동일하게 유지됩니다.
                </p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleMainViewChange('TIMETABLE')}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                    activeMainView === 'TIMETABLE'
                      ? 'bg-[#A8FFDB] text-slate-950 shadow-[0_0_15px_rgba(168,255,219,0.3)]'
                      : 'bg-[#0B0C10] text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  1. 주간 시간표 확인 화면
                </button>
                <button
                  onClick={() => handleMainViewChange('DASHBOARD')}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                    activeMainView === 'DASHBOARD'
                      ? 'bg-[#D4B2FF] text-slate-950 shadow-[0_0_15px_rgba(212,178,255,0.3)]'
                      : 'bg-[#0B0C10] text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  2. 성적/과목 기능성 화면
                </button>
              </div>
            </div>

            {/* 선택된 메인 화면 프리뷰 영역 (Step 2에서 본격 구현될 영역 안내) */}
            <div className="bg-[#14161F] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-[#A8FFDB]/10 text-[#A8FFDB] border border-[#A8FFDB]/30">
                {activeMainView === 'TIMETABLE' ? (
                  <Calendar className="w-7 h-7" />
                ) : (
                  <LayoutGrid className="w-7 h-7" />
                )}
              </div>
              <h3 className="text-lg font-bold text-white">
                {activeMainView === 'TIMETABLE'
                  ? '[화면 1] 등록 수강 과목 기반 일주일 시간표 화면'
                  : '[화면 2] 카테고리별 과목/성적 입력 및 관리 기능성 화면'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                현재{' '}
                <strong className="text-[#A8FFDB]">
                  {currentUser.department} {currentUser.name}({currentUser.studentId})
                </strong>{' '}
                계정으로 정상 로그인되어 있습니다.
                <br />
                다음 단계(Step 2: 1번 과목 및 성적 등록 / 2번 과목 조회 및 관리) 조건 확인 후 이 영역에 실제 시간표와 성적 관리 모듈이 탑재됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}