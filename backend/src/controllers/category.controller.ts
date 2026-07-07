import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Category } from "../models/Category";
import { AuthRequest } from "../middleware/auth";

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await Category.create({ ...req.body, business: req.user!.businessId });
  sendSuccess(res, category, "Category created", 201);
});

export const listCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const categories = await Category.find({ business: req.user!.businessId }).sort({ name: 1 });
  sendSuccess(res, categories);
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, business: req.user!.businessId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!category) throw ApiError.notFound("Category not found");
  sendSuccess(res, category, "Category updated");
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await Category.findOneAndDelete({
    _id: req.params.id,
    business: req.user!.businessId,
  });
  if (!category) throw ApiError.notFound("Category not found");
  sendSuccess(res, null, "Category deleted");
});
