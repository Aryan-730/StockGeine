import { Router } from "express";
import {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { protect } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { nameOnlySchema } from "../validations/common.validation";

const router = Router();

router.use(protect);
router.get("/", listCategories);
router.post("/", authorize("owner", "manager"), validate(nameOnlySchema), createCategory);
router.put("/:id", authorize("owner", "manager"), updateCategory);
router.delete("/:id", authorize("owner", "manager"), deleteCategory);

export default router;
