import { Router } from "express";
import {
  createSupplier,
  listSuppliers,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplier.controller";
import { protect } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { supplierSchema } from "../validations/common.validation";

const router = Router();

router.use(protect);
router.get("/", listSuppliers);
router.post("/", authorize("owner", "manager"), validate(supplierSchema), createSupplier);
router.put("/:id", authorize("owner", "manager"), updateSupplier);
router.delete("/:id", authorize("owner", "manager"), deleteSupplier);

export default router;
