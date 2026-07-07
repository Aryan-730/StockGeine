import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Suppliers from "@/pages/Suppliers";
import Stock from "@/pages/Stock";
import Services from "@/pages/Services";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import POS from "@/pages/POS";
import Reorder from "@/pages/Reorder";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/pos" element={<POS />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/stock" element={<Stock />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/:id" element={<CustomerDetail />} />
                    <Route path="/reorder" element={<Reorder />} />

                    <Route element={<ProtectedRoute allowedRoles={["owner", "manager"]} />}>
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
                      <Route path="/settings" element={<Settings />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
