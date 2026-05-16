const express = require('express');
const { loginAdmin } = require('../controllers/adminController');
const { createProject, getProjects, reorderProjects } = require('../controllers/projectController');
const { requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', loginAdmin);
router.get('/projects', requireAdminAuth, getProjects);
router.post('/projects', requireAdminAuth, createProject);
router.patch('/projects/reorder', requireAdminAuth, reorderProjects);

module.exports = router;
