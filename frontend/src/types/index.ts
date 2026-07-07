export type UserRole = "owner" | "manager" | "cashier";
export type BusinessType = "inventory" | "service" | "hybrid";

export interface Business {
  _id: string;
  name: string;
  type: BusinessType;
  address?: string;
  phone?: string;
  currency: string;
  lowStockThresholdDefault: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  leadTimeDays: number;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category?: { _id: string; name: string } | string;
  supplier?: { _id: string; name: string; leadTimeDays: number } | string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  safetyStock: number;
  image?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Service {
  _id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes?: number;
  isActive: boolean;
}

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalSpent: number;
  createdAt: string;
}

export interface SaleItem {
  itemType: "product" | "service";
  product?: string;
  service?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  invoiceNumber: string;
  customer?: { _id: string; name: string; phone?: string } | string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "upi" | "other";
  cashier: { _id: string; name: string } | string;
  notes?: string;
  createdAt: string;
}

export interface StockMovement {
  _id: string;
  product: { _id: string; name: string; sku: string } | string;
  type: "in" | "out" | "adjustment" | "sale" | "return";
  quantity: number;
  reason?: string;
  reference?: string;
  performedBy: { _id: string; name: string } | string;
  createdAt: string;
}

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  currentQuantity: number;
  analysisPeriodDays: number;
  totalUnitsSold: number;
  averageDailySales: number;
  salesVelocity: number;
  demandTrend: "increasing" | "decreasing" | "stable";
  demandTrendPercent: number;
  daysUntilStockOut: number | null;
  leadTimeDays: number;
  safetyStock: number;
  recommendedQuantity: number;
  urgency: "critical" | "high" | "medium" | "low" | "none";
  explanation: string;
}

export interface DashboardAnalytics {
  revenue: {
    last30Days: number;
    last30DaysOrders: number;
    today: number;
    todayOrders: number;
  };
  salesTrend: { date: string; total: number; count: number }[];
  inventory: {
    totalValue: number;
    totalUnits: number;
    activeProductCount: number;
    activeServiceCount: number;
  };
  lowStockProducts: { _id: string; name: string; sku: string; quantity: number; lowStockThreshold: number }[];
  topProducts: { _id: string; name: string; unitsSold: number; revenue: number }[];
  topServices: { _id: string; name: string; timesBooked: number; revenue: number }[];
  recentSales: Sale[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
