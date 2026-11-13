const path = require('path');
const CustomActivity = require(path.join(__dirname, '../models/activity.model'));

exports.getMyActivities = async (req, res) => {
  try {
    const activities = await CustomActivity.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      activities
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '기타 활동 목록을 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.saveActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      id,
      title,
      category,
      description,
      link,
      startDate,
      endDate,
      schedules,
      color,
      isPrivate
    } = req.body;

    if (!title || String(title).trim() === '') {
      return res.status(400).json({
        success: false,
        message: '기타 활동명을 입력해 주세요.'
      });
    }

    if (id) {
      const existing = await CustomActivity.findOne({ where: { id, userId } });
      if (existing) {
        existing.title = String(title).trim();
        existing.category = String(category || '일반').trim();
        existing.description = String(description || '').trim();
        existing.link = String(link || '').trim();
        existing.startDate = startDate || '2026-03-02';
        existing.endDate = endDate || '2026-06-21';
        existing.schedules = Array.isArray(schedules) ? schedules : [];
        if (color) existing.color = color;
        existing.isPrivate = Boolean(isPrivate);
        await existing.save();

        return res.status(200).json({
          success: true,
          message: `'${existing.title}' 기타 활동 세부정보가 수정되었습니다.`,
          activity: existing
        });
      }
    }

    const created = await CustomActivity.create({
      userId,
      title: String(title).trim(),
      category: String(category || '일반').trim(),
      description: String(description || '').trim(),
      link: String(link || '').trim(),
      startDate: startDate || '2026-03-02',
      endDate: endDate || '2026-06-21',
      schedules: Array.isArray(schedules) ? schedules : [],
      color: color || '#FFE699',
      isPrivate: Boolean(isPrivate)
    });

    return res.status(201).json({
      success: true,
      message: `'${created.title}' 기타 활동이 등록되었습니다.`,
      activity: created
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '기타 활동 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await CustomActivity.findOne({
      where: { id, userId: req.user.id }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: '삭제할 기타 활동을 찾을 수 없습니다.'
      });
    }

    const title = item.title;
    await item.destroy();

    return res.status(200).json({
      success: true,
      message: `'${title}' 기타 활동이 삭제되었습니다.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '기타 활동 삭제 중 오류가 발생했습니다.'
    });
  }
};