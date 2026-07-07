import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, TrendingDown, Minus, Clock, Truck, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { ReorderRecommendation } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const urgencyVariant: Record<ReorderRecommendation["urgency"], "danger" | "warning" | "primary" | "default"> = {
  critical: "danger",
  high: "warning",
  medium: "primary",
  low: "default",
  none: "default",
};

const trendIcon = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
};

export default function Reorder() {
  const { data, isLoading } = useQuery({
    queryKey: ["reorder"],
    queryFn: async () =>
      (await api.get<{ data: ReorderRecommendation[] }>("/reorder")).data.data,
  });

  return (
    <div>
      <PageHeader
        title="AI Reorder Genie"
        description="Every number below is calculated first — average daily sales, velocity, trend, and safety stock. Gemini only explains what the math already found."
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title="Nothing needs reordering right now"
          description="All your products have healthy stock levels based on recent sales velocity."
        />
      ) : (
        <div className="space-y-4">
          {data.map((rec) => {
            const TrendIcon = trendIcon[rec.demandTrend];
            return (
              <Card key={rec.productId} className="overflow-hidden">
                <CardContent className="grid grid-cols-1 gap-6 pt-5 lg:grid-cols-3">
                  {/* Calculated facts — crisp, mono, data-forward */}
                  <div className="lg:col-span-2">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{rec.productName}</h3>
                      <Badge variant={urgencyVariant[rec.urgency]}>{rec.urgency} priority</Badge>
                      <Badge variant="default" className="gap-1">
                        <TrendIcon className="h-3 w-3" />
                        {rec.demandTrend} ({rec.demandTrendPercent > 0 ? "+" : ""}
                        {rec.demandTrendPercent}%)
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 font-mono text-sm sm:grid-cols-4">
                      <Metric label="Current stock" value={rec.currentQuantity} />
                      <Metric label="Avg daily sales" value={rec.averageDailySales} />
                      <Metric label="7-day velocity" value={rec.salesVelocity} />
                      <Metric
                        label="Days to stock-out"
                        value={rec.daysUntilStockOut ?? "—"}
                        icon={<Clock className="h-3.5 w-3.5" />}
                      />
                      <Metric
                        label="Supplier lead time"
                        value={`${rec.leadTimeDays}d`}
                        icon={<Truck className="h-3.5 w-3.5" />}
                      />
                      <Metric
                        label="Safety stock"
                        value={rec.safetyStock}
                        icon={<ShieldCheck className="h-3.5 w-3.5" />}
                      />
                      <Metric
                        label="Recommended qty"
                        value={rec.recommendedQuantity}
                        highlight
                      />
                    </div>
                  </div>

                  {/* AI explanation — glowing, distinct from the raw numbers */}
                  <div
                    className={cn(
                      "genie-glow-border relative rounded-xl bg-genie/5 p-4"
                    )}
                  >
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-genie">
                      <Sparkles className="h-3.5 w-3.5" />
                      Gemini explains
                    </div>
                    <p className="text-sm leading-relaxed">{rec.explanation}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 font-body text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className={cn("mt-0.5 text-base font-semibold", highlight && "text-primary")}>{value}</p>
    </div>
  );
}
