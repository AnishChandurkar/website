const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const projectRole = require('../middleware/projectRole');
const { getMembers, addMember, removeMember } = require('../controllers/teamController');

router.get('/:projectId/members', auth, projectRole(), getMembers);
router.post('/:projectId/members', auth, projectRole('Project Admin'), addMember);
router.delete('/:projectId/members/:userId', auth, projectRole('Project Admin'), removeMember);

module.exports = router;
