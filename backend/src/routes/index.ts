import { Router } from "express";
import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import categoryRoutes from "./category.routes";
import supplierRoutes from "./supplier.routes";
import stockRoutes from "./stock.routes";
import saleRoutes from "./sale.routes";
import serviceRoutes from "./service.routes";
import customerRoutes from "./customer.routes";
import dashboardRoutes from "./dashboard.routes";
import reorderRoutes from "./reorder.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, message: "StockGenie API is running" }));

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/stock", stockRoutes);
router.use("/sales", saleRoutes);
router.use("/services", serviceRoutes);
router.use("/customers", customerRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reorder", reorderRoutes);
router.use("/upload", uploadRoutes);

export default router;
