import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    businessName: z.string().min(2, "Business name is required"),
    businessType: z.enum(["inventory", "service", "hybrid"]).default("hybrid"),
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Valid email is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const inviteUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["manager", "cashier"]),
  }),
});
