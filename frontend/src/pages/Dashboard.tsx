import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  IndianRupee,
  Package,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { DashboardAnalytics } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { business } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardAnalytics }>("/dashboard");
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  if (isLoading || !data) return <PageSpinner />;

  const currency = business?.currency || "INR";

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A live view of revenue, inventory, and what needs attention today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (30 days)"
          value={formatCurrency(data.revenue.last30Days, currency)}
          icon={<IndianRupee className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(data.revenue.today, currency)}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          label="Inventory Value"
          value={formatCurrency(data.inventory.totalValue, currency)}
          icon={<Boxes className="h-5 w-5" />}
          accent="genie"
        />
        <StatCard
          label="Low Stock Items"
          value={String(data.lowStockProducts.length)}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="warning"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales trend (last 7 days)</CardTitle>
            <CardDescription>Revenue collected per day across all channels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.salesTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => formatCurrency(value, currency)}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Low stock</CardTitle>
              <CardDescription>Needs a reorder soon</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">All products are well stocked.</p>
            ) : (
              <div className="space-y-3">
                {data.lowStockProducts.map((p) => (
                  <div key={p._id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                    <Badge variant="warning">{p.quantity} left</Badge>
                  </div>
                ))}
              </div>
            )}
            <Link
              to="/reorder"
              className="mt-4 flex items-center gap-1.5 text-sm font-medium text-genie hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              View AI reorder recommendations
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top products (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <EmptyState icon={<Package className="h-8 w-8" />} title="No sales yet" />
            ) : (
              <div className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <div key={p._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {i + 1}
                      </span>
                      <p className="text-sm font-medium">{p.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(p.revenue, currency)}</p>
                      <p className="text-xs text-muted-foreground">{p.unitsSold} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSales.length === 0 ? (
              <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="No sales yet" />
            ) : (
              <div className="space-y-3">
                {data.recentSales.slice(0, 6).map((s) => (
                  <div key={s._id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(s.createdAt)}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(s.total, currency)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
