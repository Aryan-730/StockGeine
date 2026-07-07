import { Schema, model, Document, Types } from "mongoose";

export interface ISupplier extends Document {
  name: string;
  business: Types.ObjectId;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  leadTimeDays: number;
  createdAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    leadTimeDays: { type: Number, default: 3 },
  },
  { timestamps: true }
);

export const Supplier = model<ISupplier>("Supplier", supplierSchema);
