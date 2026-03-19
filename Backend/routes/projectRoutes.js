const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const projectRole = require('../middleware/projectRole');

const {
    getProjects,
    getProjectById,
    getArchivedProjects,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    toggleStar
} = require('../controllers/projectController');

router.get('/', auth, getProjects);
router.get('/archived', auth, getArchivedProjects);
router.post('/', auth, createProject);
router.get('/:id', auth, projectRole(), getProjectById);
router.put('/:id', auth, projectRole('Project Admin'), updateProject);
router.put('/:id/archive', auth, projectRole('Project Admin'), archiveProject);
router.delete('/:id', auth, projectRole('Project Admin'), deleteProject);
router.put('/:id/star', auth, projectRole(), toggleStar);

module.exports = router;