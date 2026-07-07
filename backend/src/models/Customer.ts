import { Schema, model, Document, Types } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  business: Types.ObjectId;
  phone?: string;
  email?: string;
  address?: string;
  totalSpent: number;
  createdAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

customerSchema.index({ business: 1, phone: 1 });

export const Customer = model<ICustomer>("Customer", customerSchema);
