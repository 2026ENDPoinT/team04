const path = require('path');
const Course = require(path.join(__dirname, '../models/course.model'));
const User = require(path.join(__dirname, '../models/user.model'));

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

exports.getGradePoint = (grade) => {
  if (Object.prototype.hasOwnProperty.call(GRADE_POINTS_MAP, grade)) {
    return GRADE_POINTS_MAP[grade];
  }
  return null;
};

exports.recalculateUserGpa = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  const courses = await Course.findAll({ where: { userId } });

  let totalWeightedPoints = 0;
  let totalGpaCredits = 0;
  let totalEarnedCredits = 0;
  let currentSemesterCredits = 0;

  for (const course of courses) {
    const credits = Number(course.credits) || 0;
    if (
      !course.isWithdrawn &&
      Number(course.year) === Number(user.currentYear) &&
      course.semester === user.currentSemester
    ) {
      currentSemesterCredits += credits;
    }
  }

  const groupedByCourseName = new Map();
  for (const course of courses) {
    if (course.isWithdrawn) continue;
    const key = String(course.courseName).trim().toLowerCase();
    if (!groupedByCourseName.has(key)) {
      groupedByCourseName.set(key, []);
    }
    groupedByCourseName.get(key).push(course);
  }

  for (const [, group] of groupedByCourseName.entries()) {
    group.sort(compareCourseChronological);

    const gradedCourses = group.filter(
      (c) => c.grade !== '현재 이수 중' && GRADE_POINTS_MAP[c.grade] !== undefined
    );

    const effectiveCourse =
      gradedCourses.length > 0
        ? gradedCourses[gradedCourses.length - 1]
        : group[group.length - 1];

    if (
      effectiveCourse &&
      effectiveCourse.grade !== '현재 이수 중' &&
      GRADE_POINTS_MAP[effectiveCourse.grade] !== undefined
    ) {
      const credits = Number(effectiveCourse.credits) || 0;
      const gp = GRADE_POINTS_MAP[effectiveCourse.grade];
      totalWeightedPoints += credits * gp;
      totalGpaCredits += credits;

      if (effectiveCourse.grade !== 'F') {
        totalEarnedCredits += credits;
      }
    }
  }

  const rawGpa = totalGpaCredits > 0 ? totalWeightedPoints / totalGpaCredits : 0.0;
  const roundedGpa = Math.round(rawGpa * 100) / 100;

  user.gpa = roundedGpa;
  user.totalCredits = totalEarnedCredits;
  user.currentSemesterCredits = currentSemesterCredits;
  await user.save();

  return {
    gpa: roundedGpa,
    totalCredits: totalEarnedCredits,
    currentSemesterCredits,
    totalGpaCredits
  };
};

exports.GRADE_POINTS_MAP = GRADE_POINTS_MAP;