const path = require('path');
const { Op } = require('sequelize');
const Course = require(path.join(__dirname, '../models/course.model'));
const { getGradePoint, recalculateUserGpa } = require(path.join(__dirname, '../services/gpa.service'));

const PASTEL_NEON_COLORS = [
  '#A8FFDB',
  '#D4B2FF',
  '#FFB2D0',
  '#99E6FF',
  '#FFE699',
  '#B8FF99'
];

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { userId: req.user.id },
      order: [
        ['year', 'DESC'],
        ['semester', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });

    const stats = await recalculateUserGpa(req.user.id);

    return res.status(200).json({
      success: true,
      courses,
      stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '과목 목록을 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const {
      year,
      semester,
      courseName,
      credits,
      grade,
      schedules,
      color,
      isRetake,
      isWithdrawn
    } = req.body;
    const userId = req.user.id;

    const duplicateInSameSemester = await Course.findOne({
      where: {
        userId,
        year,
        semester,
        courseName
      }
    });

    if (duplicateInSameSemester) {
      return res.status(409).json({
        success: false,
        message: `${year}년 ${semester}에 이미 '${courseName}' 과목이 등록되어 있습니다.`
      });
    }

    const count = await Course.count({ where: { userId } });
    const assignedColor = color || PASTEL_NEON_COLORS[count % PASTEL_NEON_COLORS.length];

    const newCourse = await Course.create({
      userId,
      year,
      semester,
      courseName,
      credits,
      grade,
      gradePoint: getGradePoint(grade),
      schedules,
      color: assignedColor,
      isRetake: Boolean(isRetake),
      isWithdrawn: Boolean(isWithdrawn)
    });

    const stats = await recalculateUserGpa(userId);

    return res.status(201).json({
      success: true,
      message: `'${courseName}' 과목이 등록되었으며 GPA가 자동 갱신되었습니다.`,
      course: newCourse,
      stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '과목 등록 중 서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      year,
      semester,
      courseName,
      credits,
      grade,
      schedules,
      color,
      isRetake,
      isWithdrawn
    } = req.body;
    const userId = req.user.id;

    const course = await Course.findOne({ where: { id, userId } });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '수정할 과목을 찾을 수 없습니다.'
      });
    }

    const duplicate = await Course.findOne({
      where: {
        userId,
        year,
        semester,
        courseName,
        id: { [Op.ne]: id }
      }
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `${year}년 ${semester}에 이미 '${courseName}' 과목이 존재합니다.`
      });
    }

    course.year = year;
    course.semester = semester;
    course.courseName = courseName;
    course.credits = credits;
    course.grade = grade;
    course.gradePoint = getGradePoint(grade);
    course.schedules = schedules;
    if (color) course.color = color;
    if (isRetake !== undefined) course.isRetake = Boolean(isRetake);
    if (isWithdrawn !== undefined) course.isWithdrawn = Boolean(isWithdrawn);

    await course.save();

    const stats = await recalculateUserGpa(userId);

    return res.status(200).json({
      success: true,
      message: `'${courseName}' 과목 정보가 수정되었습니다.`,
      course,
      stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '과목 수정 중 서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const course = await Course.findOne({ where: { id, userId } });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '삭제할 과목을 찾을 수 없습니다.'
      });
    }

    const deletedName = course.courseName;
    await course.destroy();

    const stats = await recalculateUserGpa(userId);

    return res.status(200).json({
      success: true,
      message: `'${deletedName}' 과목이 삭제되었으며 GPA가 갱신되었습니다.`,
      stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '과목 삭제 중 서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};