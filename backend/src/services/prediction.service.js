// 표준정규분포 누적분포함수(CDF) 근사식 (Abramowitz & Stegun 알고리즘 - 오차 < 7.5e-8)
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

/**
 * <조건 2, 3, 4, 5> 성적 예측 계산 엔진
 * - 총 환산 점수(100점 만점): 시험·출석·과제 등 모든 항목의 (점수/만점)*반영비율 합산
 * - <조건 5> 시험 평균과 표준편차가 제공된 경우: 오직 '시험(EXAM)' 항목들만의 가중 Z-score를 바탕으로 사용자의 예상 상위 백분위(%)를 계산
 * - 예상 등수 및 등급: 수강 인원(기본 50명) 및 사용자 입력 성적 비율(A+, A, B+ 등 누적 상위 %)과 비교해 산출
 */
exports.calculatePredictionResult = ({
  totalStudents = 50,
  evaluationItems = [],
  gradeCutoffs = {}
}) => {
  const numStudents = Math.max(1, Number(totalStudents) || 50);

  let totalWeightedScore = 0;
  let totalWeightSum = 0;

  // <조건 5> 시험(EXAM) 항목 중 평균(mean)과 표준편차(stdDev > 0)가 입력된 항목 추출
  let examWeightedZSum = 0;
  let examWeightForZ = 0;
  let examNormalizedSum = 0;
  let examWeightTotal = 0;

  evaluationItems.forEach((item) => {
    const score = Number(item.score) || 0;
    const maxScore = Math.max(1, Number(item.maxScore) || 100);
    const weight = Math.max(0, Number(item.weight) || 0);
    const ratio = Math.min(1, Math.max(0, score / maxScore));

    totalWeightedScore += ratio * weight;
    totalWeightSum += weight;

    if (item.category === 'EXAM') {
      examNormalizedSum += ratio * weight;
      examWeightTotal += weight;

      const hasMean = item.mean !== undefined && item.mean !== null && String(item.mean).trim() !== '';
      const hasStd = item.stdDev !== undefined && item.stdDev !== null && String(item.stdDev).trim() !== '';
      const meanVal = Number(item.mean);
      const stdVal = Number(item.stdDev);

      if (hasMean && hasStd && !Number.isNaN(meanVal) && !Number.isNaN(stdVal) && stdVal > 0 && weight > 0) {
        const z = (score - meanVal) / stdVal;
        examWeightedZSum += z * weight;
        examWeightForZ += weight;
      }
    }
  });

  const calculatedTotalScore = Math.round(totalWeightedScore * 100) / 100;

  // <조건 5> 시험 평균·표준편차 제공 시 오직 시험 성적만으로 상위 백분위 계산
  let examOnlyTopPercentile = null;
  let usedExamStat = false;

  if (examWeightForZ > 0) {
    usedExamStat = true;
    const compositeZ = examWeightedZSum / examWeightForZ;
    const cumulativeProb = standardNormalCDF(compositeZ); // 하위 백분위 (0~1)
    const topPercent = (1 - cumulativeProb) * 100;
    examOnlyTopPercentile = Math.min(99.9, Math.max(0.1, Math.round(topPercent * 100) / 100));
  } else if (examWeightTotal > 0) {
    // 평균/표준편차 미입력 시 시험 득점률 기반으로 추정 백분위 보조 산출
    const examRate = (examNormalizedSum / examWeightTotal) * 100;
    examOnlyTopPercentile = Math.min(99.9, Math.max(0.1, Math.round((100 - examRate * 0.9) * 100) / 100));
  } else {
    const overallRate = totalWeightSum > 0 ? (totalWeightedScore / totalWeightSum) * 100 : 0;
    examOnlyTopPercentile = Math.min(99.9, Math.max(0.1, Math.round((100 - overallRate * 0.9) * 100) / 100));
  }

  // 수강 인원(기본 50명) 대비 예상 등수 계산
  const estimatedRank = Math.max(
    1,
    Math.min(numStudents, Math.round((examOnlyTopPercentile / 100) * numStudents))
  );

  // <조건 3> 사용자가 설정한 성적 비율(상위 누적 %)에 따른 예상 성적 등급 판정
  const orderedGrades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D'];
  let predictedGrade = 'F';

  for (const g of orderedGrades) {
    const cutoffLimit = Number(gradeCutoffs[g]);
    if (!Number.isNaN(cutoffLimit) && examOnlyTopPercentile <= cutoffLimit) {
      predictedGrade = g;
      break;
    }
  }

  return {
    calculatedTotalScore,
    totalWeightSum,
    examOnlyTopPercentile,
    usedExamStat,
    estimatedRank,
    totalStudents: numStudents,
    predictedGrade
  };
};