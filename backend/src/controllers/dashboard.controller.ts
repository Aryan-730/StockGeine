import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AuthRequest } from "../middleware/auth";
import { getDashboardAnalytics } from "../services/analytics.service";

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const analytics = await getDashboardAnalytics(req.user!.businessId);
  sendSuccess(res, analytics);
});
