import { Router } from "express";
import {
  createService,
  listServices,
  updateService,
  deleteService,
} from "../controllers/service.controller";
import { protect } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { serviceSchema } from "../validations/common.validation";

const router = Router();

router.use(protect);
router.get("/", listServices);
router.post("/", authorize("owner", "manager"), validate(serviceSchema), createService);
router.put("/:id", authorize("owner", "manager"), updateService);
router.delete("/:id", authorize("owner", "manager"), deleteService);

export default router;
