import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Customer } from "../models/Customer";
import { Sale } from "../models/Sale";
import { AuthRequest } from "../middleware/auth";

export const createCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await Customer.create({ ...req.body, business: req.user!.businessId });
  sendSuccess(res, customer, "Customer created", 201);
});

export const listCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const search = (req.query.search as string) || "";
  const filter: Record<string, unknown> = { business: req.user!.businessId };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }
  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  sendSuccess(res, customers);
});

export const getCustomerHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    business: req.user!.businessId,
  });
  if (!customer) throw ApiError.notFound("Customer not found");

  const sales = await Sale.find({
    business: req.user!.businessId,
    customer: req.params.id,
  }).sort({ createdAt: -1 });

  sendSuccess(res, { customer, sales });
});

export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, business: req.user!.businessId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!customer) throw ApiError.notFound("Customer not found");
  sendSuccess(res, customer, "Customer updated");
});
