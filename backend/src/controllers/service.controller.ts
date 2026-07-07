import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Service } from "../models/Service";
import { AuthRequest } from "../middleware/auth";

export const createService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const service = await Service.create({ ...req.body, business: req.user!.businessId });
  sendSuccess(res, service, "Service created", 201);
});

export const listServices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const services = await Service.find({
    business: req.user!.businessId,
    isActive: true,
  }).sort({ name: 1 });
  sendSuccess(res, services);
});

export const updateService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, business: req.user!.businessId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!service) throw ApiError.notFound("Service not found");
  sendSuccess(res, service, "Service updated");
});

export const deleteService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, business: req.user!.businessId },
    { isActive: false },
    { new: true }
  );
  if (!service) throw ApiError.notFound("Service not found");
  sendSuccess(res, null, "Service removed");
});
