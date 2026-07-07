import { Router } from "express";
import {
  createSale,
  listSales,
  getSale,
  downloadReceipt,
} from "../controllers/sale.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createSaleSchema } from "../validations/sale.validation";

const router = Router();

router.use(protect);
router.get("/", listSales);
router.get("/:id", getSale);
router.get("/:id/receipt", downloadReceipt);
router.post("/", validate(createSaleSchema), createSale);

export default router;
