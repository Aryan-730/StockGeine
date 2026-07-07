import { Router } from "express";
import { register, login, getMe, inviteTeamMember, listTeam } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, inviteUserSchema } from "../validations/auth.validation";
import { protect } from "../middleware/auth";
import { authorize } from "../middleware/rbac";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, getMe);
router.post(
  "/team",
  protect,
  authorize("owner", "manager"),
  validate(inviteUserSchema),
  inviteTeamMember
);
router.get("/team", protect, authorize("owner", "manager"), listTeam);

export default router;
