import { Schema, model, Document, Types } from "mongoose";

export interface IService extends Document {
  name: string;
  business: Types.ObjectId;
  description?: string;
  price: number;
  durationMinutes?: number;
  isActive: boolean;
  createdAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Service = model<IService>("Service", serviceSchema);
