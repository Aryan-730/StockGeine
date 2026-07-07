import { Schema, model, Document, Types } from "mongoose";

export type StockMovementType = "in" | "out" | "adjustment" | "sale" | "return";

export interface IStockMovement extends Document {
  business: Types.ObjectId;
  product: Types.ObjectId;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    type: { type: String, enum: ["in", "out", "adjustment", "sale", "return"], required: true },
    quantity: { type: Number, required: true },
    reason: { type: String },
    reference: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockMovementSchema.index({ business: 1, product: 1, createdAt: -1 });

export const StockMovement = model<IStockMovement>("StockMovement", stockMovementSchema);
