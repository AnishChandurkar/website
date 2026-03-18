const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
    getProjects,
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
router.put('/:id', auth, updateProject);
router.put('/:id/archive', auth, archiveProject);
router.put('/:id/star', auth, toggleStar);
router.delete('/:id', auth, deleteProject);

module.exports = router;