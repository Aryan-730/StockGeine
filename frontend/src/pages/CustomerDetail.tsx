import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { Customer, Sale } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function CustomerDetail() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["customer-history", id],
    queryFn: async () =>
      (await api.get<{ data: { customer: Customer; sales: Sale[] } }>(`/customers/${id}/history`))
        .data.data,
  });

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-semibold">{data.customer.name}</h2>
          <p className="text-sm text-muted-foreground">{data.customer.phone || "No phone on file"}</p>
        </div>
        <Card className="px-5 py-3">
          <p className="text-xs text-muted-foreground">Lifetime spend</p>
          <p className="font-display text-xl font-bold">{formatCurrency(data.customer.totalSpent)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
        </CardHeader>
        <CardContent>
          {data.sales.length === 0 ? (
            <EmptyState icon={<Receipt className="h-8 w-8" />} title="No purchases yet" />
          ) : (
            <div className="divide-y divide-border">
              {data.sales.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{sale.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(sale.createdAt)} · {sale.items.length} item(s)
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(sale.total)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
