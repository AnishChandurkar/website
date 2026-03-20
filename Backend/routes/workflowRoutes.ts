import express from "express";
import auth from "../middleware/auth";
import projectRole from "../middleware/projectRole";
import { getProjectWorkflows, addWorkflow, deleteWorkflow } from "../controllers/workflowController";

const router = express.Router({ mergeParams: true });

//get api for all allowed workFlows
router.get("/:projectId/workflows", auth, getProjectWorkflows);

router.post("/:projectId/workflows", auth, projectRole("Project Admin"), addWorkflow);

//to deletea transition

router.delete("/:projectId/workflows/:workflowId", auth, projectRole("Project Admin"), deleteWorkflow);

export default router;