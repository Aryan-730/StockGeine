import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  icon,
  trend,
  accent = "primary",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  accent?: "primary" | "success" | "warning" | "danger" | "genie";
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</p>
              {trend && (
                <div
                  className={cn(
                    "mt-2 flex items-center gap-1 text-xs font-medium",
                    trend.positive ? "text-success" : "text-danger"
                  )}
                >
                  {trend.positive ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {Math.abs(trend.value)}%
                </div>
              )}
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                accent === "primary" && "bg-primary/10 text-primary",
                accent === "success" && "bg-success/10 text-success",
                accent === "warning" && "bg-warning/10 text-warning",
                accent === "danger" && "bg-danger/10 text-danger",
                accent === "genie" && "bg-genie/10 text-genie"
              )}
            >
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
