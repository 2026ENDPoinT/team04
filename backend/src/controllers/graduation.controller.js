const path = require('path');
const GraduationProfile = require(path.join(__dirname, '../models/graduation.model'));
const Course = require(path.join(__dirname, '../models/course.model'));
const { GRADE_POINTS_MAP } = require(path.join(__dirname, '../services/gpa.service'));

// <조건 1> 학번(맨앞 2자리 입학년도) 및 재학생/편입생 여부에 따른 총 졸업 이수학점 & EPiC folio 기준 점수 자동 산출
const calculateRequirementStandards = (studentId, admissionType = 'REGULAR') => {
  const sidStr = String(studentId || '').trim();
  const prefix2 = parseInt(sidStr.slice(0, 2), 10);
  const entryYear = !Number.isNaN(prefix2)
    ? prefix2 >= 80
      ? 1900 + prefix2
      : 2000 + prefix2
    : 2026;

  // 학번(입학년도)별 서울과기대 졸업 기준 학점 차등 적용
  // - 2020학번 이전: 140학점 / 2021~2022학번: 136학점 / 2023학번 이후: 132학점
  let requiredTotalCredits = 132;
  if (entryYear <= 2020) {
    requiredTotalCredits = 140;
  } else if (entryYear <= 2022) {
    requiredTotalCredits = 136;
  }

  // EPiC folio 졸업인증 기준 점수
  // - 신입학(재학생): 입학년도 기준 700점 (2020학번 이전은 600점)
  // - 편입생(TRANSFER): 신입학 기준의 50% 감면 (350점 / 300점)
  const baseEpicScore = entryYear <= 2020 ? 600 : 700;
  const requiredEpicScore =
    admissionType === 'TRANSFER' ? Math.round(baseEpicScore * 0.5) : baseEpicScore;

  return {
    entryYear,
    admissionType,
    requiredTotalCredits,
    requiredEpicScore
  };
};

// <조건 1> 학기가 끝나고 평점이 나온 과목(현재 이수 중 제외, F 제외, 수강포기 제외, 재수강 중복 제외)의 총 학점 합산
const calculateCompletedGradedCredits = async (userId) => {
  const courses = await Course.findAll({ where: { userId } });
  const grouped = new Map();

  for (const c of courses) {
    if (c.isWithdrawn) continue;
    if (c.grade === '현재 이수 중' || c.grade === 'F' || GRADE_POINTS_MAP[c.grade] === undefined) {
      continue;
    }
    const key = String(c.courseName).trim().toLowerCase();
    grouped.set(key, Number(c.credits) || 0);
  }

  let sum = 0;
  for (const cr of grouped.values()) {
    sum += cr;
  }
  return sum;
};

exports.getGraduationOverview = async (req, res) => {
  try {
    const user = req.user;
    let [profile] = await GraduationProfile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        admissionType: 'REGULAR',
        selectedEpicItems: []
      }
    });

    const standards = calculateRequirementStandards(user.studentId, profile.admissionType);
    const earnedCredits = await calculateCompletedGradedCredits(user.id);

    const items = Array.isArray(profile.selectedEpicItems) ? profile.selectedEpicItems : [];
    const currentEpicScore = items
      .filter((it) => it.status === 'COMPLETED')
      .reduce((acc, cur) => acc + (Number(cur.points) || 0), 0);

    const wishEpicScore = items
      .filter((it) => it.status === 'WISH')
      .reduce((acc, cur) => acc + (Number(cur.points) || 0), 0);

    return res.status(200).json({
      success: true,
      standards,
      earnedCredits,
      currentEpicScore,
      wishEpicScore,
      projectedEpicScore: currentEpicScore + wishEpicScore,
      profile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '졸업요건 정보를 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.saveGraduationProfile = async (req, res) => {
  try {
    const user = req.user;
    const { admissionType, selectedEpicItems } = req.body;

    let [profile] = await GraduationProfile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        admissionType: 'REGULAR',
        selectedEpicItems: []
      }
    });

    if (admissionType && ['REGULAR', 'TRANSFER'].includes(admissionType)) {
      profile.admissionType = admissionType;
    }
    if (Array.isArray(selectedEpicItems)) {
      profile.selectedEpicItems = selectedEpicItems;
    }

    await profile.save();

    const standards = calculateRequirementStandards(user.studentId, profile.admissionType);
    const earnedCredits = await calculateCompletedGradedCredits(user.id);

    return res.status(200).json({
      success: true,
      message: '졸업요건 및 EPiC folio 활동 내역이 저장되었습니다.',
      standards,
      earnedCredits,
      profile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '졸업요건 저장 중 오류가 발생했습니다.'
    });
  }
};