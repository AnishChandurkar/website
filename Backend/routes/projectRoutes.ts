import express from "express";
import auth from "../middleware/auth";
import projectRole from "../middleware/projectRole";
import {
  getProjects,
  getProjectById,
  getArchivedProjects,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
  toggleStar
} from "../controllers/projectController";

const router = express.Router();

router.get('/', auth, getProjects);
router.get('/archived', auth, getArchivedProjects);
router.post('/', auth, createProject);
router.get('/:id', auth, projectRole(), getProjectById);
router.put('/:id', auth, projectRole('Project Admin'), updateProject);
router.put('/:id/archive', auth, projectRole('Project Admin'), archiveProject);
router.delete('/:id', auth, projectRole('Project Admin'), deleteProject);
router.put('/:id/star', auth, projectRole(), toggleStar);

export default router;
