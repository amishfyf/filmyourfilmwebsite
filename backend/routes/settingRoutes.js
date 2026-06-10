const express = require('express');
const { getHeroSetting } = require('../controllers/settingController');

const router = express.Router();

router.get('/hero', getHeroSetting);

module.exports = router;
