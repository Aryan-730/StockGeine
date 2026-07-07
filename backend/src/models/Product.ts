import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  sku: string;
  barcode?: string;
  business: Types.ObjectId;
  category?: Types.ObjectId;
  supplier?: Types.ObjectId;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  safetyStock: number;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    unit: { type: String, default: "pcs" },
    lowStockThreshold: { type: Number, default: 10 },
    safetyStock: { type: Number, default: 5 },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ business: 1, sku: 1 }, { unique: true });
productSchema.index({ business: 1, barcode: 1 });
productSchema.index({ name: "text" });

export const Product = model<IProduct>("Product", productSchema);
