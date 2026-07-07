import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { AuthRequest } from "../middleware/auth";
import {
  calculateReorderMetrics,
  calculateReorderMetricsForAllLowStock,
} from "../services/reorder.service";
import { explainReorderRecommendation } from "../services/ai.service";

export const getReorderRecommendations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const metricsList = await calculateReorderMetricsForAllLowStock(req.user!.businessId);

    const withExplanations = await Promise.all(
      metricsList.map(async (metrics) => ({
        ...metrics,
        explanation: await explainReorderRecommendation(metrics),
      }))
    );

    sendSuccess(res, withExplanations);
  }
);

export const getReorderRecommendationForProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const metrics = await calculateReorderMetrics(req.params.productId, req.user!.businessId).catch(
      () => {
        throw ApiError.notFound("Product not found");
      }
    );

    const explanation = await explainReorderRecommendation(metrics);

    sendSuccess(res, { ...metrics, explanation });
  }
);
