import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);
router.get("/", getDashboard);

export default router;
