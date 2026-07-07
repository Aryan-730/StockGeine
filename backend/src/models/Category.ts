import { Schema, model, Document, Types } from "mongoose";

export interface ICategory extends Document {
  name: string;
  business: Types.ObjectId;
  description?: string;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    description: { type: String },
  },
  { timestamps: true }
);

categorySchema.index({ business: 1, name: 1 }, { unique: true });

export const Category = model<ICategory>("Category", categorySchema);
