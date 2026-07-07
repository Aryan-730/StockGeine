import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Product } from "../models/Product";
import { AuthRequest } from "../middleware/auth";

export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.create({ ...req.body, business: req.user!.businessId });
  sendSuccess(res, product, "Product created", 201);
});

export const listProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "20", 10);
  const search = (req.query.search as string) || "";
  const category = req.query.category as string | undefined;
  const lowStockOnly = req.query.lowStockOnly === "true";

  const filter: Record<string, unknown> = {
    business: req.user!.businessId,
    isActive: true,
  };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }
  if (category) filter.category = category;
  if (lowStockOnly) filter.$expr = { $lte: ["$quantity", "$lowStockThreshold"] };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name")
      .populate("supplier", "name leadTimeDays")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  sendPaginated(res, items, total, page, limit);
});

export const getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findOne({
    _id: req.params.id,
    business: req.user!.businessId,
  })
    .populate("category", "name")
    .populate("supplier", "name leadTimeDays");
  if (!product) throw ApiError.notFound("Product not found");
  sendSuccess(res, product);
});

export const findByBarcode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findOne({
    barcode: req.params.barcode,
    business: req.user!.businessId,
    isActive: true,
  });
  if (!product) throw ApiError.notFound("No product found for this barcode");
  sendSuccess(res, product);
});

export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, business: req.user!.businessId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!product) throw ApiError.notFound("Product not found");
  sendSuccess(res, product, "Product updated");
});

export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, business: req.user!.businessId },
    { isActive: false },
    { new: true }
  );
  if (!product) throw ApiError.notFound("Product not found");
  sendSuccess(res, null, "Product removed");
});
