import { Router } from "express";
import {
  createCustomer,
  listCustomers,
  getCustomerHistory,
  updateCustomer,
} from "../controllers/customer.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { customerSchema } from "../validations/common.validation";

const router = Router();

router.use(protect);
router.get("/", listCustomers);
router.get("/:id/history", getCustomerHistory);
router.post("/", validate(customerSchema), createCustomer);
router.put("/:id", updateCustomer);

export default router;
