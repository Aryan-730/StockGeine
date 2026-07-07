import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Supplier } from "../models/Supplier";
import { AuthRequest } from "../middleware/auth";

export const createSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const supplier = await Supplier.create({ ...req.body, business: req.user!.businessId });
  sendSuccess(res, supplier, "Supplier created", 201);
});

export const listSuppliers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const suppliers = await Supplier.find({ business: req.user!.businessId }).sort({ name: 1 });
  sendSuccess(res, suppliers);
});

export const updateSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const supplier = await Supplier.findOneAndUpdate(
    { _id: req.params.id, business: req.user!.businessId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!supplier) throw ApiError.notFound("Supplier not found");
  sendSuccess(res, supplier, "Supplier updated");
});

export const deleteSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const supplier = await Supplier.findOneAndDelete({
    _id: req.params.id,
    business: req.user!.businessId,
  });
  if (!supplier) throw ApiError.notFound("Supplier not found");
  sendSuccess(res, null, "Supplier deleted");
});
