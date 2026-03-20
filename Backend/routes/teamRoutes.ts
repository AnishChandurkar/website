import express from "express";
import auth from "../middleware/auth";
import projectRole from "../middleware/projectRole";
import { getMembers, addMember, removeMember } from "../controllers/teamController";

const router = express.Router();

router.get('/:projectId/members', auth, projectRole(), getMembers);
router.post('/:projectId/members', auth, projectRole('Project Admin'), addMember);
router.delete('/:projectId/members/:userId', auth, projectRole('Project Admin'), removeMember);

export default router;
