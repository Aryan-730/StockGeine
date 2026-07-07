import { Router } from "express";
import { adjustStock, listMovements } from "../controllers/stock.controller";
import { protect } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { stockAdjustSchema } from "../validations/product.validation";

const router = Router();

router.use(protect);
router.get("/movements", listMovements);
router.post("/adjust", authorize("owner", "manager"), validate(stockAdjustSchema), adjustStock);

export default router;
