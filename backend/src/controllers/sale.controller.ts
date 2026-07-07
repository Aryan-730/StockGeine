import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Product } from "../models/Product";
import { Service } from "../models/Service";
import { Sale, ISaleItem } from "../models/Sale";
import { StockMovement } from "../models/StockMovement";
import { Customer } from "../models/Customer";
import { Business } from "../models/Business";
import { AuthRequest } from "../middleware/auth";
import { streamReceiptPdf } from "../services/pdf.service";

async function generateInvoiceNumber(businessId: string): Promise<string> {
  const count = await Sale.countDocuments({ business: businessId });
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${datePart}-${String(count + 1).padStart(4, "0")}`;
}

export const createSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { customerId, items, discount, tax, paymentMethod, notes } = req.body as {
    customerId?: string;
    items: { itemType: "product" | "service"; itemId: string; quantity: number }[];
    discount: number;
    tax: number;
    paymentMethod: "cash" | "card" | "upi" | "other";
    notes?: string;
  };

  const businessId = req.user!.businessId;
  const saleItems: ISaleItem[] = [];
  let subtotal = 0;

  for (const line of items) {
    if (line.itemType === "product") {
      const product = await Product.findOne({ _id: line.itemId, business: businessId });
      if (!product) throw ApiError.notFound(`Product not found: ${line.itemId}`);
      if (product.quantity < line.quantity) {
        throw ApiError.badRequest(`Insufficient stock for ${product.name}`);
      }
      const itemSubtotal = product.sellingPrice * line.quantity;
      saleItems.push({
        itemType: "product",
        product: product._id as any,
        name: product.name,
        quantity: line.quantity,
        unitPrice: product.sellingPrice,
        subtotal: itemSubtotal,
      });
      subtotal += itemSubtotal;

      product.quantity -= line.quantity;
      await product.save();

      await StockMovement.create({
        business: businessId,
        product: product._id,
        type: "sale",
        quantity: line.quantity,
        reason: "Point of Sale",
        performedBy: req.user!.userId,
      });
    } else {
      const service = await Service.findOne({ _id: line.itemId, business: businessId });
      if (!service) throw ApiError.notFound(`Service not found: ${line.itemId}`);
      const itemSubtotal = service.price * line.quantity;
      saleItems.push({
        itemType: "service",
        service: service._id as any,
        name: service.name,
        quantity: line.quantity,
        unitPrice: service.price,
        subtotal: itemSubtotal,
      });
      subtotal += itemSubtotal;
    }
  }

  const total = Math.max(0, subtotal - (discount || 0) + (tax || 0));
  const invoiceNumber = await generateInvoiceNumber(businessId);

  const sale = await Sale.create({
    business: businessId,
    invoiceNumber,
    customer: customerId || undefined,
    items: saleItems,
    subtotal,
    discount: discount || 0,
    tax: tax || 0,
    total,
    paymentMethod,
    cashier: req.user!.userId,
    notes,
  });

  if (customerId) {
    await Customer.findByIdAndUpdate(customerId, { $inc: { totalSpent: total } });
  }

  sendSuccess(res, sale, "Sale completed successfully", 201);
});

export const listSales = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "20", 10);

  const [items, total] = await Promise.all([
    Sale.find({ business: req.user!.businessId })
      .populate("customer", "name phone")
      .populate("cashier", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Sale.countDocuments({ business: req.user!.businessId }),
  ]);

  sendPaginated(res, items, total, page, limit);
});

export const getSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sale = await Sale.findOne({ _id: req.params.id, business: req.user!.businessId })
    .populate("customer", "name phone email")
    .populate("cashier", "name");
  if (!sale) throw ApiError.notFound("Sale not found");
  sendSuccess(res, sale);
});

export const downloadReceipt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sale = await Sale.findOne({ _id: req.params.id, business: req.user!.businessId }).populate(
    "customer",
    "name"
  );
  if (!sale) throw ApiError.notFound("Sale not found");

  const business = await Business.findById(req.user!.businessId);
  if (!business) throw ApiError.notFound("Business not found");

  const customerName = (sale.customer as any)?.name as string | undefined;
  streamReceiptPdf(res, sale, business, customerName);
});
