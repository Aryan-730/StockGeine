import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { ReorderCalculation } from "./reorder.service";

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI | null {
  if (!env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return client;
}

/**
 * IMPORTANT: Gemini never decides WHAT or HOW MUCH to reorder.
 * All numbers (average daily sales, velocity, trend, days until stock-out,
 * safety stock, recommended quantity) are computed deterministically in
 * reorder.service.ts. Gemini's only job is to translate those numbers into
 * a clear, human-friendly explanation for a shop owner.
 */
export async function explainReorderRecommendation(
  metrics: ReorderCalculation
): Promise<string> {
  const genAI = getClient();

  if (!genAI) {
    return buildFallbackExplanation(metrics);
  }

  try {
    const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

    const prompt = `You are an assistant that explains inventory reorder recommendations to a small shop owner in simple, plain English (2-4 short sentences, no jargon, no markdown headers).

Here are pre-calculated facts about one product. Do NOT change or recalculate any numbers — only explain them:

- Product: ${metrics.productName}
- Current stock: ${metrics.currentQuantity} units
- Average daily sales (last ${metrics.analysisPeriodDays} days): ${metrics.averageDailySales} units/day
- Recent sales velocity (last 7 days): ${metrics.salesVelocity} units/day
- Demand trend: ${metrics.demandTrend} (${metrics.demandTrendPercent}% change)
- Estimated days until stock-out: ${metrics.daysUntilStockOut ?? "N/A"}
- Supplier lead time: ${metrics.leadTimeDays} days
- Safety stock buffer: ${metrics.safetyStock} units
- Recommended reorder quantity: ${metrics.recommendedQuantity} units
- Urgency: ${metrics.urgency}

Explain in simple English why this product should (or should not) be reordered now, referencing the trend and days-until-stock-out. Keep it friendly and actionable. Do not invent numbers not listed above.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text || buildFallbackExplanation(metrics);
  } catch (error) {
    logger.error("Gemini explanation failed, using fallback", {
      error: (error as Error).message,
    });
    return buildFallbackExplanation(metrics);
  }
}

function buildFallbackExplanation(metrics: ReorderCalculation): string {
  const trendText =
    metrics.demandTrend === "increasing"
      ? "demand has been picking up"
      : metrics.demandTrend === "decreasing"
      ? "demand has been slowing down"
      : "demand has stayed fairly steady";

  if (metrics.recommendedQuantity <= 0) {
    return `${metrics.productName} has enough stock for now. You're selling about ${metrics.averageDailySales} units a day and ${trendText}, so no reorder is needed yet.`;
  }

  const daysText =
    metrics.daysUntilStockOut !== null
      ? `at this rate you'll run out in about ${metrics.daysUntilStockOut} days`
      : "there isn't enough recent sales history to predict a stock-out date";

  return `${metrics.productName} is selling at roughly ${metrics.averageDailySales} units a day and ${trendText}. Your supplier takes about ${metrics.leadTimeDays} days to deliver, and ${daysText}, so we recommend ordering ${metrics.recommendedQuantity} more units now to stay safely stocked.`;
}
