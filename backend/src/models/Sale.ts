import { Schema, model, Document, Types } from "mongoose";

export type SaleItemType = "product" | "service";
export type PaymentMethod = "cash" | "card" | "upi" | "other";

export interface ISaleItem {
  itemType: SaleItemType;
  product?: Types.ObjectId;
  service?: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ISale extends Document {
  business: Types.ObjectId;
  invoiceNumber: string;
  customer?: Types.ObjectId;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashier: Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    itemType: { type: String, enum: ["product", "service"], required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    service: { type: Schema.Types.ObjectId, ref: "Service" },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const saleSchema = new Schema<ISale>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    invoiceNumber: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    items: { type: [saleItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cash", "card", "upi", "other"], default: "cash" },
    cashier: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

saleSchema.index({ business: 1, invoiceNumber: 1 }, { unique: true });
saleSchema.index({ business: 1, createdAt: -1 });

export const Sale = model<ISale>("Sale", saleSchema);
