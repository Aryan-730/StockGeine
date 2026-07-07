import { Schema, model, Document, Types } from "mongoose";

export type BusinessType = "inventory" | "service" | "hybrid";

export interface IBusiness extends Document {
  name: string;
  type: BusinessType;
  owner?: Types.ObjectId;
  address?: string;
  phone?: string;
  currency: string;
  lowStockThresholdDefault: number;
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["inventory", "service", "hybrid"], default: "hybrid" },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    address: { type: String },
    phone: { type: String },
    currency: { type: String, default: "INR" },
    lowStockThresholdDefault: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export const Business = model<IBusiness>("Business", businessSchema);
