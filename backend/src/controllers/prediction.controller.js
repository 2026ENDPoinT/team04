const path = require('path');
const GradePrediction = require(path.join(__dirname, '../models/prediction.model'));
const { calculatePredictionResult } = require(path.join(__dirname, '../services/prediction.service'));

exports.getPredictions = async (req, res) => {
  try {
    const list = await GradePrediction.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      predictions: list
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '성적 예측 내역을 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.savePrediction = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      id,
      courseId,
      courseName,
      credits,
      totalStudents = 50,
      evaluationItems = [],
      gradeCutoffs = {}
    } = req.body;

    if (!courseName || String(courseName).trim() === '') {
      return res.status(400).json({
        success: false,
        message: '성적을 예측할 과목명을 입력하거나 선택해 주세요.'
      });
    }

    const calc = calculatePredictionResult({
      totalStudents,
      evaluationItems,
      gradeCutoffs
    });

    if (id) {
      const existing = await GradePrediction.findOne({ where: { id, userId } });
      if (existing) {
        existing.courseId = courseId || null;
        existing.courseName = String(courseName).trim();
        existing.credits = Number(credits) || 3;
        existing.totalStudents = calc.totalStudents;
        existing.evaluationItems = evaluationItems;
        existing.gradeCutoffs = gradeCutoffs;
        existing.calculatedTotalScore = calc.calculatedTotalScore;
        existing.examOnlyTopPercentile = calc.examOnlyTopPercentile;
        existing.estimatedRank = calc.estimatedRank;
        existing.predictedGrade = calc.predictedGrade;
        await existing.save();

        return res.status(200).json({
          success: true,
          message: `'${existing.courseName}' 성적 예측 결과가 업데이트 및 저장되었습니다.`,
          prediction: existing,
          calculation: calc
        });
      }
    }

    const created = await GradePrediction.create({
      userId,
      courseId: courseId || null,
      courseName: String(courseName).trim(),
      credits: Number(credits) || 3,
      totalStudents: calc.totalStudents,
      evaluationItems,
      gradeCutoffs,
      calculatedTotalScore: calc.calculatedTotalScore,
      examOnlyTopPercentile: calc.examOnlyTopPercentile,
      estimatedRank: calc.estimatedRank,
      predictedGrade: calc.predictedGrade
    });

    return res.status(201).json({
      success: true,
      message: `'${created.courseName}' 성적 예측 결과가 데이터베이스에 저장되었습니다!`,
      prediction: created,
      calculation: calc
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '성적 예측 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.deletePrediction = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await GradePrediction.findOne({
      where: { id, userId: req.user.id }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: '삭제할 성적 예측 내역을 찾을 수 없습니다.'
      });
    }

    const name = item.courseName;
    await item.destroy();

    return res.status(200).json({
      success: true,
      message: `'${name}' 성적 예측 기록이 삭제되었습니다.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '성적 예측 삭제 중 오류가 발생했습니다.'
    });
  }
};