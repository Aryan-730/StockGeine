import { z } from "zod";

export const nameOnlySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  }),
});

export const supplierSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    leadTimeDays: z.number().nonnegative().optional(),
  }),
});

export const customerSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
  }),
});

export const serviceSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().nonnegative(),
    durationMinutes: z.number().positive().optional(),
  }),
});
