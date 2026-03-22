import express from "express";
import auth from "../middleware/auth";
import projectRole from "../middleware/projectRole";
import { getMembers, addMember, removeMember, updateMemberRole } from "../controllers/teamController";

const router = express.Router();

// fetch project members
router.get('/:projectId/members', auth, projectRole(), getMembers);
// add a member to the project
router.post('/:projectId/members', auth, projectRole('Project Admin'), addMember);
router.delete('/:projectId/members/:userId', auth, projectRole('Project Admin'), removeMember);
router.put('/:projectId/members/:userId', auth, projectRole('Project Admin'), updateMemberRole);

export default router;
