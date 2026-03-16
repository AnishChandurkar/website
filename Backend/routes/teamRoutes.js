const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMembers, addMember, removeMember } = require('../controllers/teamController');

router.get('/:projectId/members', auth, getMembers);
router.post('/:projectId/members', auth, addMember);
router.delete('/:projectId/members/:userId', auth, removeMember);

module.exports = router;
