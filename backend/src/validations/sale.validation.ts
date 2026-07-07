import { z } from "zod";

const saleItemSchema = z.object({
  itemType: z.enum(["product", "service"]),
  itemId: z.string().min(1),
  quantity: z.number().positive(),
});

export const createSaleSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    items: z.array(saleItemSchema).min(1),
    discount: z.number().nonnegative().default(0),
    tax: z.number().nonnegative().default(0),
    paymentMethod: z.enum(["cash", "card", "upi", "other"]).default("cash"),
    notes: z.string().optional(),
  }),
});
