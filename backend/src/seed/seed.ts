import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { Business } from "../models/Business";
import { User } from "../models/User";
import { Category } from "../models/Category";
import { Supplier } from "../models/Supplier";
import { Product } from "../models/Product";
import { Service } from "../models/Service";
import { Customer } from "../models/Customer";
import { Sale } from "../models/Sale";
import { StockMovement } from "../models/StockMovement";

async function seed() {
  await mongoose.connect(env.MONGO_URI);
  logger.info("Connected to MongoDB for seeding");

  await Promise.all([
    Business.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
    Supplier.deleteMany({}),
    Product.deleteMany({}),
    Service.deleteMany({}),
    Customer.deleteMany({}),
    Sale.deleteMany({}),
    StockMovement.deleteMany({}),
  ]);
  logger.info("Cleared existing data");

  const business = await Business.create({
    name: "Sharma General Store",
    type: "hybrid",
    address: "MG Road, Bhiwandi, Maharashtra",
    phone: "+91 98765 43210",
    currency: "INR",
    lowStockThresholdDefault: 10,
  });

  const owner = await User.create({
    name: "Rohit Sharma",
    email: "owner@stockgenie.com",
    password: "password123",
    role: "owner",
    business: business._id,
  });
  business.owner = owner._id as any;
  await business.save();

  const manager = await User.create({
    name: "Priya Verma",
    email: "manager@stockgenie.com",
    password: "password123",
    role: "manager",
    business: business._id,
  });

  const cashier = await User.create({
    name: "Aman Khan",
    email: "cashier@stockgenie.com",
    password: "password123",
    role: "cashier",
    business: business._id,
  });

  const categories = await Category.insertMany([
    { name: "Beverages", business: business._id },
    { name: "Snacks", business: business._id },
    { name: "Groceries", business: business._id },
    { name: "Household", business: business._id },
    { name: "Stationery", business: business._id },
  ]);

  const suppliers = await Supplier.insertMany([
    {
      name: "Metro Wholesale Distributors",
      business: business._id,
      contactPerson: "Vikram Singh",
      phone: "+91 90000 11111",
      email: "vikram@metrowholesale.com",
      leadTimeDays: 2,
    },
    {
      name: "National FMCG Supplies",
      business: business._id,
      contactPerson: "Neha Kapoor",
      phone: "+91 90000 22222",
      email: "neha@nationalfmcg.com",
      leadTimeDays: 5,
    },
    {
      name: "Local Stationery Hub",
      business: business._id,
      contactPerson: "Rajesh Gupta",
      phone: "+91 90000 33333",
      leadTimeDays: 1,
    },
  ]);

  const productSeeds = [
    { name: "Coca-Cola 500ml", sku: "BEV-001", barcode: "8901234500017", category: categories[0]._id, supplier: suppliers[0]._id, costPrice: 25, sellingPrice: 40, quantity: 120, lowStockThreshold: 30, safetyStock: 15 },
    { name: "Amul Milk 1L", sku: "BEV-002", barcode: "8901234500024", category: categories[0]._id, supplier: suppliers[1]._id, costPrice: 48, sellingPrice: 58, quantity: 8, lowStockThreshold: 20, safetyStock: 10 },
    { name: "Lays Classic 52g", sku: "SNK-001", barcode: "8901234500031", category: categories[1]._id, supplier: suppliers[0]._id, costPrice: 15, sellingPrice: 20, quantity: 200, lowStockThreshold: 50, safetyStock: 20 },
    { name: "Britannia Good Day 100g", sku: "SNK-002", barcode: "8901234500048", category: categories[1]._id, supplier: suppliers[1]._id, costPrice: 22, sellingPrice: 30, quantity: 5, lowStockThreshold: 25, safetyStock: 10 },
    { name: "Tata Salt 1kg", sku: "GRO-001", barcode: "8901234500055", category: categories[2]._id, supplier: suppliers[1]._id, costPrice: 20, sellingPrice: 28, quantity: 90, lowStockThreshold: 20, safetyStock: 10 },
    { name: "Aashirvaad Atta 5kg", sku: "GRO-002", barcode: "8901234500062", category: categories[2]._id, supplier: suppliers[1]._id, costPrice: 210, sellingPrice: 255, quantity: 3, lowStockThreshold: 10, safetyStock: 5 },
    { name: "Surf Excel 1kg", sku: "HH-001", barcode: "8901234500079", category: categories[3]._id, supplier: suppliers[0]._id, costPrice: 110, sellingPrice: 140, quantity: 40, lowStockThreshold: 15, safetyStock: 8 },
    { name: "Harpic Toilet Cleaner", sku: "HH-002", barcode: "8901234500086", category: categories[3]._id, supplier: suppliers[0]._id, costPrice: 60, sellingPrice: 85, quantity: 25, lowStockThreshold: 15, safetyStock: 8 },
    { name: "Classmate Notebook 200pg", sku: "STA-001", barcode: "8901234500093", category: categories[4]._id, supplier: suppliers[2]._id, costPrice: 30, sellingPrice: 45, quantity: 60, lowStockThreshold: 20, safetyStock: 10 },
    { name: "Reynolds Ball Pen (Pack of 5)", sku: "STA-002", barcode: "8901234500109", category: categories[4]._id, supplier: suppliers[2]._id, costPrice: 25, sellingPrice: 40, quantity: 4, lowStockThreshold: 15, safetyStock: 8 },
  ];

  const products = await Product.insertMany(
    productSeeds.map((p) => ({ ...p, business: business._id, unit: "pcs", isActive: true }))
  );

  const services = await Service.insertMany([
    { name: "Mobile Screen Repair", business: business._id, description: "Screen replacement for smartphones", price: 899, durationMinutes: 60 },
    { name: "Home Delivery", business: business._id, description: "Delivery within 5km radius", price: 30, durationMinutes: 30 },
    { name: "Gift Wrapping", business: business._id, description: "Premium gift wrap service", price: 20, durationMinutes: 10 },
  ]);

  const customers = await Customer.insertMany([
    { name: "Ankit Joshi", business: business._id, phone: "+91 91234 56780", totalSpent: 0 },
    { name: "Sneha Reddy", business: business._id, phone: "+91 91234 56781", totalSpent: 0 },
    { name: "Walk-in Customer", business: business._id, phone: "", totalSpent: 0 },
  ]);

  // Generate 30 days of realistic-ish sale history so the AI reorder
  // engine has real velocity/trend data to compute against.
  const now = new Date();
  let invoiceCounter = 1;
  const salesToInsert: any[] = [];
  const movementsToInsert: any[] = [];

  for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);

    const salesPerDay = 2 + Math.floor(Math.random() * 4);
    for (let s = 0; s < salesPerDay; s++) {
      const numItems = 1 + Math.floor(Math.random() * 3);
      const items = [];
      let subtotal = 0;

      for (let i = 0; i < numItems; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        // Bias higher demand toward fast movers to create a believable trend
        const isFastMover = ["BEV-001", "SNK-001", "GRO-001"].includes(product.sku);
        const qty = isFastMover
          ? 1 + Math.floor(Math.random() * 5)
          : 1 + Math.floor(Math.random() * 2);
        const lineSubtotal = product.sellingPrice * qty;
        items.push({
          itemType: "product",
          product: product._id,
          name: product.name,
          quantity: qty,
          unitPrice: product.sellingPrice,
          subtotal: lineSubtotal,
        });
        subtotal += lineSubtotal;

        movementsToInsert.push({
          business: business._id,
          product: product._id,
          type: "sale",
          quantity: qty,
          reason: "Point of Sale",
          performedBy: cashier._id,
          createdAt: day,
        });
      }

      const saleTime = new Date(day);
      saleTime.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

      salesToInsert.push({
        business: business._id,
        invoiceNumber: `INV-${day.toISOString().slice(0, 10).replace(/-/g, "")}-${String(
          invoiceCounter++
        ).padStart(4, "0")}`,
        customer: customers[Math.floor(Math.random() * customers.length)]._id,
        items,
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        paymentMethod: ["cash", "card", "upi"][Math.floor(Math.random() * 3)],
        cashier: cashier._id,
        createdAt: saleTime,
      });
    }
  }

  await Sale.insertMany(salesToInsert);
  await StockMovement.insertMany(movementsToInsert);

  logger.info("Seed data created successfully");
  logger.info("-----------------------------------------");
  logger.info("Login credentials:");
  logger.info("  Owner:   owner@stockgenie.com / password123");
  logger.info("  Manager: manager@stockgenie.com / password123");
  logger.info("  Cashier: cashier@stockgenie.com / password123");
  logger.info("-----------------------------------------");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  logger.error("Seeding failed", { error: (error as Error).message });
  process.exit(1);
});
