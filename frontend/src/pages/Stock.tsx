import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Boxes, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { Product, StockMovement, PaginatedResponse } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/context/ToastContext";
import { formatDateTime, cn } from "@/lib/utils";

const schema = z.object({
  productId: z.string().min(1, "Select a product"),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.coerce.number().positive("Must be greater than 0"),
  reason: z.string().optional(),
  reference: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const typeMeta: Record<StockMovement["type"], { label: string; variant: "success" | "danger" | "default" | "primary" }> = {
  in: { label: "Stock In", variant: "success" },
  out: { label: "Stock Out", variant: "danger" },
  adjustment: { label: "Adjustment", variant: "default" },
  sale: { label: "Sale", variant: "primary" },
  return: { label: "Return", variant: "default" },
};

export default function Stock() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: movements, isLoading } = useQuery({
    queryKey: ["movements"],
    queryFn: async () => (await api.get<{ data: StockMovement[] }>("/stock/movements")).data.data,
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () =>
      (await api.get<PaginatedResponse<Product>>("/products", { params: { limit: 200 } })).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "in" },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => api.post("/stock/adjust", data),
    onSuccess: () => {
      toast("Stock updated", "success");
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setModalOpen(false);
      reset({ type: "in", productId: "", quantity: undefined, reason: "", reference: "" } as any);
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        description="Track every stock-in, stock-out, and manual adjustment."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Adjust stock
          </Button>
        }
      />

      {isLoading ? (
        <PageSpinner />
      ) : !movements || movements.length === 0 ? (
        <EmptyState icon={<Boxes className="h-8 w-8" />} title="No stock movements yet" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">By</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m._id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">
                    {typeof m.product === "object" ? m.product.name : m.product}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={typeMeta[m.type].variant}>
                      {m.type === "in" && <ArrowUpCircle className="h-3 w-3" />}
                      {m.type === "out" || m.type === "sale" ? <ArrowDownCircle className="h-3 w-3" /> : null}
                      {typeMeta[m.type].label}
                    </Badge>
                  </td>
                  <td className={cn("px-4 py-3 font-mono")}>{m.quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.reason || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof m.performedBy === "object" ? m.performedBy.name : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adjust stock">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Product</Label>
            <Select {...register("productId")} error={errors.productId?.message}>
              <option value="">Select a product</option>
              {productsData?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </Select>
            {errors.productId && <p className="mt-1 text-xs text-danger">{errors.productId.message}</p>}
          </div>
          <div>
            <Label>Movement type</Label>
            <Select {...register("type")}>
              <option value="in">Stock In (add)</option>
              <option value="out">Stock Out (remove)</option>
              <option value="adjustment">Adjustment (set exact quantity)</option>
            </Select>
          </div>
          <div>
            <Label>Quantity</Label>
            <Input type="number" {...register("quantity")} error={errors.quantity?.message} />
          </div>
          <div>
            <Label>Reason (optional)</Label>
            <Input {...register("reason")} placeholder="e.g. New shipment received" />
          </div>
          <div>
            <Label>Reference (optional)</Label>
            <Input {...register("reference")} placeholder="e.g. PO-1023" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
              Save movement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
