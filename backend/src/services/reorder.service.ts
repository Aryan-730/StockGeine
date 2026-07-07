import { Types } from "mongoose";
import { StockMovement } from "../models/StockMovement";
import { Product, IProduct } from "../models/Product";
import { Supplier } from "../models/Supplier";

export interface ReorderCalculation {
  productId: string;
  productName: string;
  currentQuantity: number;
  analysisPeriodDays: number;
  totalUnitsSold: number;
  averageDailySales: number;
  salesVelocity: number; // units/day, smoothed
  demandTrend: "increasing" | "decreasing" | "stable";
  demandTrendPercent: number;
  daysUntilStockOut: number | null;
  leadTimeDays: number;
  safetyStock: number;
  recommendedQuantity: number;
  urgency: "critical" | "high" | "medium" | "low" | "none";
}

const ANALYSIS_WINDOW_DAYS = 30;
const SERVICE_LEVEL_Z = 1.65; // ~95% service level

function stdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Pulls raw sales movement data and computes all reorder analytics
 * for a single product using deterministic math — no AI involved here.
 */
export async function calculateReorderMetrics(
  productId: string,
  businessId: string
): Promise<ReorderCalculation> {
  const product = await Product.findOne({ _id: productId, business: businessId });
  if (!product) {
    throw new Error("Product not found");
  }

  const since = new Date();
  since.setDate(since.getDate() - ANALYSIS_WINDOW_DAYS);

  const movements = await StockMovement.find({
    business: businessId,
    product: productId,
    type: "sale",
    createdAt: { $gte: since },
  }).sort({ createdAt: 1 });

  // Bucket sales by calendar day so gaps (no-sale days) count as zero.
  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < ANALYSIS_WINDOW_DAYS; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    dayBuckets.set(d.toISOString().slice(0, 10), 0);
  }
  let totalUnitsSold = 0;
  for (const m of movements) {
    const key = m.createdAt.toISOString().slice(0, 10);
    const qty = Math.abs(m.quantity);
    dayBuckets.set(key, (dayBuckets.get(key) || 0) + qty);
    totalUnitsSold += qty;
  }

  const dailyValues = Array.from(dayBuckets.values());
  const averageDailySales = totalUnitsSold / ANALYSIS_WINDOW_DAYS;

  // Trend: compare second half vs first half of the window
  const mid = Math.floor(dailyValues.length / 2);
  const firstHalf = dailyValues.slice(0, mid);
  const secondHalf = dailyValues.slice(mid);
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);

  let demandTrend: ReorderCalculation["demandTrend"] = "stable";
  let demandTrendPercent = 0;
  if (firstAvg === 0 && secondAvg === 0) {
    demandTrend = "stable";
    demandTrendPercent = 0;
  } else {
    demandTrendPercent = firstAvg === 0 ? 100 : ((secondAvg - firstAvg) / firstAvg) * 100;
    if (demandTrendPercent > 10) demandTrend = "increasing";
    else if (demandTrendPercent < -10) demandTrend = "decreasing";
    else demandTrend = "stable";
  }

  // Sales velocity: exponentially-weighted recent average (last 7 days weighted higher)
  const last7 = dailyValues.slice(-7);
  const salesVelocity = last7.reduce((a, b) => a + b, 0) / (last7.length || 1);

  const supplier = product.supplier
    ? await Supplier.findById(product.supplier)
    : null;
  const leadTimeDays = supplier?.leadTimeDays ?? 3;

  const demandStdDev = stdDev(dailyValues, averageDailySales);
  const calculatedSafetyStock = Math.ceil(
    SERVICE_LEVEL_Z * demandStdDev * Math.sqrt(leadTimeDays)
  );
  const safetyStock = Math.max(product.safetyStock || 0, calculatedSafetyStock);

  const daysUntilStockOut =
    averageDailySales > 0 ? product.quantity / averageDailySales : null;

  const demandDuringLeadTime = averageDailySales * leadTimeDays;
  const targetStockLevel = demandDuringLeadTime + safetyStock;
  const recommendedQuantity = Math.max(
    0,
    Math.ceil(targetStockLevel - product.quantity)
  );

  let urgency: ReorderCalculation["urgency"] = "none";
  if (daysUntilStockOut !== null) {
    if (product.quantity <= 0) urgency = "critical";
    else if (daysUntilStockOut <= leadTimeDays) urgency = "critical";
    else if (daysUntilStockOut <= leadTimeDays * 1.5) urgency = "high";
    else if (daysUntilStockOut <= leadTimeDays * 3) urgency = "medium";
    else urgency = "low";
  } else if (product.quantity <= product.lowStockThreshold) {
    urgency = "medium";
  }

  return {
    productId: String(product._id),
    productName: product.name,
    currentQuantity: product.quantity,
    analysisPeriodDays: ANALYSIS_WINDOW_DAYS,
    totalUnitsSold,
    averageDailySales: Number(averageDailySales.toFixed(2)),
    salesVelocity: Number(salesVelocity.toFixed(2)),
    demandTrend,
    demandTrendPercent: Number(demandTrendPercent.toFixed(1)),
    daysUntilStockOut: daysUntilStockOut !== null ? Number(daysUntilStockOut.toFixed(1)) : null,
    leadTimeDays,
    safetyStock,
    recommendedQuantity,
    urgency,
  };
}

export async function calculateReorderMetricsForAllLowStock(
  businessId: string
): Promise<ReorderCalculation[]> {
  const products = await Product.find({
    business: businessId,
    isActive: true,
  });

  const results: ReorderCalculation[] = [];
  for (const p of products as IProduct[]) {
    const metrics = await calculateReorderMetrics(String(p._id), businessId);
    if (
      metrics.urgency !== "none" ||
      p.quantity <= p.lowStockThreshold ||
      metrics.recommendedQuantity > 0
    ) {
      results.push(metrics);
    }
  }

  return results.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
    return order[a.urgency] - order[b.urgency];
  });
}

export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}
