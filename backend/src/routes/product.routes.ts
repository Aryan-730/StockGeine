import { Router } from "express";
import {
  createProduct,
  listProducts,
  getProduct,
  findByBarcode,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { protect } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { createProductSchema, updateProductSchema } from "../validations/product.validation";

const router = Router();

router.use(protect);
router.get("/", listProducts);
router.get("/barcode/:barcode", findByBarcode);
router.get("/:id", getProduct);
router.post("/", authorize("owner", "manager"), validate(createProductSchema), createProduct);
router.put("/:id", authorize("owner", "manager"), validate(updateProductSchema), updateProduct);
router.delete("/:id", authorize("owner", "manager"), deleteProduct);

export default router;
