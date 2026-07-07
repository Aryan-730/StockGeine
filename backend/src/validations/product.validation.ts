import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    barcode: z.string().optional(),
    category: z.string().optional(),
    supplier: z.string().optional(),
    costPrice: z.number().nonnegative(),
    sellingPrice: z.number().nonnegative(),
    quantity: z.number().nonnegative().default(0),
    unit: z.string().optional(),
    lowStockThreshold: z.number().nonnegative().optional(),
    safetyStock: z.number().nonnegative().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial(),
});

export const stockAdjustSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    quantity: z.number().positive(),
    type: z.enum(["in", "out", "adjustment"]),
    reason: z.string().optional(),
    reference: z.string().optional(),
  }),
});
