const Setting = require('../models/Setting');

const getHeroSetting = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: 'heroVideoUrl' });
    res.json({ heroVideoUrl: setting ? setting.value : '' });
  } catch (error) {
    next(error);
  }
};

const updateHeroSetting = async (req, res, next) => {
  try {
    const { heroVideoUrl } = req.body;
    
    if (typeof heroVideoUrl !== 'string') {
      return res.status(400).json({ message: 'Invalid hero video URL.' });
    }

    const setting = await Setting.findOneAndUpdate(
      { key: 'heroVideoUrl' },
      { value: heroVideoUrl },
      { upsert: true, new: true }
    );

    res.json({ heroVideoUrl: setting.value });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHeroSetting,
  updateHeroSetting,
};
