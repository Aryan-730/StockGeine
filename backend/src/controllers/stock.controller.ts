import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Product } from "../models/Product";
import { StockMovement } from "../models/StockMovement";
import { AuthRequest } from "../middleware/auth";

export const adjustStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, quantity, type, reason, reference } = req.body;

  const product = await Product.findOne({ _id: productId, business: req.user!.businessId });
  if (!product) throw ApiError.notFound("Product not found");

  if (type === "in") {
    product.quantity += quantity;
  } else if (type === "out") {
    if (product.quantity < quantity) {
      throw ApiError.badRequest("Insufficient stock for this operation");
    }
    product.quantity -= quantity;
  } else if (type === "adjustment") {
    product.quantity = quantity;
  }

  await product.save();

  const movement = await StockMovement.create({
    business: req.user!.businessId,
    product: productId,
    type,
    quantity,
    reason,
    reference,
    performedBy: req.user!.userId,
  });

  sendSuccess(res, { product, movement }, "Stock updated successfully");
});

export const listMovements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const productId = req.query.productId as string | undefined;
  const filter: Record<string, unknown> = { business: req.user!.businessId };
  if (productId) filter.product = productId;

  const movements = await StockMovement.find(filter)
    .populate("product", "name sku")
    .populate("performedBy", "name")
    .sort({ createdAt: -1 })
    .limit(100);

  sendSuccess(res, movements);
});
