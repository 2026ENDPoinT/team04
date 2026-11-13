const VALID_SEMESTERS = ['1학기', '2학기', '여름계절학기', '겨울계절학기'];
const VALID_GRADES = ['현재 이수 중', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
const VALID_DAYS = ['월', '화', '수', '목', '금'];

const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return NaN;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return NaN;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
};

exports.validateCourseInput = (req, res, next) => {
  const { year, semester, courseName, credits, grade, schedules } = req.body;

  const numYear = Number(year);
  if (!Number.isInteger(numYear) || numYear < 1980 || numYear > 2050) {
    return res.status(400).json({
      success: false,
      message: '수강 년도는 1980년부터 2050년 사이의 값이어야 합니다.'
    });
  }

  if (!VALID_SEMESTERS.includes(semester)) {
    return res.status(400).json({
      success: false,
      message: '수강 학기는 [1학기, 2학기, 여름계절학기, 겨울계절학기] 중 하나여야 합니다.'
    });
  }

  if (!courseName || String(courseName).trim() === '') {
    return res.status(400).json({
      success: false,
      message: '과목명을 입력해 주세요.'
    });
  }

  const numCredits = Number(credits);
  if (!Number.isInteger(numCredits) || numCredits < 1 || numCredits > 4) {
    return res.status(400).json({
      success: false,
      message: '학점은 1학점부터 4학점 사이의 정수여야 합니다.'
    });
  }

  if (!VALID_GRADES.includes(grade)) {
    return res.status(400).json({
      success: false,
      message: '올바른 성적 등급을 선택해 주세요.'
    });
  }

  if (schedules !== undefined) {
    if (!Array.isArray(schedules)) {
      return res.status(400).json({
        success: false,
        message: '수업 시간 정보 형식이 올바르지 않습니다.'
      });
    }

    for (let i = 0; i < schedules.length; i++) {
      const slot = schedules[i];
      if (!VALID_DAYS.includes(slot.day)) {
        return res.status(400).json({
          success: false,
          message: `${i + 1}번째 수업 시간의 요일(월~금)을 올바르게 선택해 주세요.`
        });
      }

      const startMin = timeToMinutes(slot.startTime);
      const endMin = timeToMinutes(slot.endTime);

      if (Number.isNaN(startMin) || Number.isNaN(endMin)) {
        return res.status(400).json({
          success: false,
          message: `${i + 1}번째 수업 시간의 시작/종료 시간을 올바르게 선택해 주세요.`
        });
      }

      if (startMin < 540 || endMin > 1260 || startMin % 30 !== 0 || endMin % 30 !== 0) {
        return res.status(400).json({
          success: false,
          message: '수업 시간은 09:00부터 21:00 사이에서 30분 단위로만 설정할 수 있습니다.'
        });
      }

      if (endMin <= startMin) {
        return res.status(400).json({
          success: false,
          message: `[시간 설정 오류] ${i + 1}번째 수업(${slot.day}요일)의 종료 시간(${slot.endTime})이 시작 시간(${slot.startTime})보다 빠르거나 같습니다.`
        });
      }

      for (let j = i + 1; j < schedules.length; j++) {
        const other = schedules[j];
        if (slot.day === other.day) {
          const otherStart = timeToMinutes(other.startTime);
          const otherEnd = timeToMinutes(other.endTime);
          if (startMin < otherEnd && endMin > otherStart) {
            return res.status(400).json({
              success: false,
              message: `동일 과목 내에 겹치는 수업 시간(${slot.day}요일)이 존재합니다.`
            });
          }
        }
      }
    }
  }

  req.body.year = numYear;
  req.body.courseName = String(courseName).trim();
  req.body.credits = numCredits;
  req.body.schedules = schedules || [];

  next();
};