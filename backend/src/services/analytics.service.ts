import { Sale } from "../models/Sale";
import { Product } from "../models/Product";
import { Service } from "../models/Service";
import { Types } from "mongoose";

export async function getDashboardAnalytics(businessId: string) {
  const bizId = new Types.ObjectId(businessId);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const [
    revenueAgg,
    todayRevenueAgg,
    salesLast30,
    inventoryValueAgg,
    lowStockProducts,
    topProducts,
    topServices,
    recentSales,
  ] = await Promise.all([
    Sale.aggregate([
      { $match: { business: bizId, createdAt: { $gte: last30Days } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { business: bizId, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { business: bizId, createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.aggregate([
      { $match: { business: bizId, isActive: true } },
      {
        $group: {
          _id: null,
          value: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
          totalUnits: { $sum: "$quantity" },
        },
      },
    ]),
    Product.find({
      business: bizId,
      isActive: true,
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
    })
      .select("name sku quantity lowStockThreshold")
      .limit(10),
    Sale.aggregate([
      { $match: { business: bizId, createdAt: { $gte: last30Days } } },
      { $unwind: "$items" },
      { $match: { "items.itemType": "product" } },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]),
    Sale.aggregate([
      { $match: { business: bizId, createdAt: { $gte: last30Days } } },
      { $unwind: "$items" },
      { $match: { "items.itemType": "service" } },
      {
        $group: {
          _id: "$items.service",
          name: { $first: "$items.name" },
          timesBooked: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Sale.find({ business: bizId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("customer", "name")
      .populate("cashier", "name"),
  ]);

  const activeServiceCount = await Service.countDocuments({
    business: bizId,
    isActive: true,
  });
  const activeProductCount = await Product.countDocuments({
    business: bizId,
    isActive: true,
  });

  return {
    revenue: {
      last30Days: revenueAgg[0]?.total || 0,
      last30DaysOrders: revenueAgg[0]?.count || 0,
      today: todayRevenueAgg[0]?.total || 0,
      todayOrders: todayRevenueAgg[0]?.count || 0,
    },
    salesTrend: salesLast30.map((s) => ({
      date: s._id,
      total: s.total,
      count: s.count,
    })),
    inventory: {
      totalValue: inventoryValueAgg[0]?.value || 0,
      totalUnits: inventoryValueAgg[0]?.totalUnits || 0,
      activeProductCount,
      activeServiceCount,
    },
    lowStockProducts,
    topProducts,
    topServices,
    recentSales,
  };
}
