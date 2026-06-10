const express = require('express');
const { loginAdmin } = require('../controllers/adminController');
const { createProject, getProjects, reorderProjects, updateProject, deleteProject } = require('../controllers/projectController');
const { updateHeroSetting } = require('../controllers/settingController');
const { requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', loginAdmin);
router.get('/projects', requireAdminAuth, getProjects);
router.post('/projects', requireAdminAuth, createProject);
router.patch('/projects/reorder', requireAdminAuth, reorderProjects);
router.patch('/projects/:id', requireAdminAuth, updateProject);
router.delete('/projects/:id', requireAdminAuth, deleteProject);
router.patch('/settings/hero', requireAdminAuth, updateHeroSetting);

module.exports = router;
