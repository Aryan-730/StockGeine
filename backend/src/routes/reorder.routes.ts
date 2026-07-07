import { Router } from "express";
import {
  getReorderRecommendations,
  getReorderRecommendationForProduct,
} from "../controllers/reorder.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);
router.get("/", getReorderRecommendations);
router.get("/:productId", getReorderRecommendationForProduct);

export default router;
