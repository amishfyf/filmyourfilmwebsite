const express = require('express');
const { getProjects } = require('../controllers/projectController');

const router = express.Router();

router.route('/').get(getProjects);

module.exports = router;
