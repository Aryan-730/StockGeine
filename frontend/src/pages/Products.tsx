import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, ScanBarcode, Pencil, Trash2, Package } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { Product, Category, Supplier, PaginatedResponse } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { BarcodeScannerModal } from "@/components/shared/BarcodeScannerModal";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  costPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().nonnegative(),
  unit: z.string().optional(),
  lowStockThreshold: z.coerce.number().nonnegative().optional(),
  safetyStock: z.coerce.number().nonnegative().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

export default function Products() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canManage = user?.role === "owner" || user?.role === "manager";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", debouncedSearch],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Product>>("/products", {
        params: { search: debouncedSearch, limit: 50 },
      });
      return res.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<{ data: Category[] }>("/categories")).data.data,
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => (await api.get<{ data: Supplier[] }>("/suppliers")).data.data,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({ resolver: zodResolver(productSchema) });

  function openCreate() {
    setEditing(null);
    reset({
      name: "",
      sku: "",
      barcode: "",
      category: "",
      supplier: "",
      costPrice: 0,
      sellingPrice: 0,
      quantity: 0,
      unit: "pcs",
      lowStockThreshold: 10,
      safetyStock: 5,
    });
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    reset({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      category: typeof product.category === "object" ? product.category?._id : product.category || "",
      supplier: typeof product.supplier === "object" ? product.supplier?._id : product.supplier || "",
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      unit: product.unit,
      lowStockThreshold: product.lowStockThreshold,
      safetyStock: product.safetyStock,
    });
    setModalOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const payload = {
        ...data,
        category: data.category || undefined,
        supplier: data.supplier || undefined,
        barcode: data.barcode || undefined,
      };
      if (editing) {
        return api.put(`/products/${editing._id}`, payload);
      }
      return api.post("/products", payload);
    },
    onSuccess: () => {
      toast(editing ? "Product updated" : "Product created", "success");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast("Product removed", "success");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleting(null);
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  const products = productsData?.data || [];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your catalog, pricing, and stock levels."
        action={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add product
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, barcode..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setScannerOpen(true)}>
          <ScanBarcode className="h-4 w-4" /> Scan barcode
        </Button>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No products yet"
          description="Add your first product to start tracking inventory."
          action={canManage && <Button onClick={openCreate}>Add product</Button>}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof p.category === "object" ? p.category?.name : "—"}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-4 py-3">
                    {p.quantity <= p.lowStockThreshold ? (
                      <Badge variant="warning">{p.quantity} {p.unit}</Badge>
                    ) : (
                      <span>{p.quantity} {p.unit}</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(p)}>
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit product" : "Add product"}
      >
        <form
          onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Name</Label>
              <Input {...register("name")} error={errors.name?.message} />
            </div>
            <div>
              <Label>SKU</Label>
              <Input {...register("sku")} error={errors.sku?.message} />
            </div>
            <div>
              <Label>Barcode</Label>
              <div className="flex gap-1">
                <Input {...register("barcode")} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setScannerOpen(true)}
                >
                  <ScanBarcode className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select {...register("category")}>
                <option value="">None</option>
                {categories?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Supplier</Label>
              <Select {...register("supplier")}>
                <option value="">None</option>
                {suppliers?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Cost price</Label>
              <Input type="number" step="0.01" {...register("costPrice")} error={errors.costPrice?.message} />
            </div>
            <div>
              <Label>Selling price</Label>
              <Input type="number" step="0.01" {...register("sellingPrice")} error={errors.sellingPrice?.message} />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" {...register("quantity")} />
            </div>
            <div>
              <Label>Unit</Label>
              <Input {...register("unit")} placeholder="pcs" />
            </div>
            <div>
              <Label>Low stock threshold</Label>
              <Input type="number" {...register("lowStockThreshold")} />
            </div>
            <div>
              <Label>Safety stock</Label>
              <Input type="number" {...register("safetyStock")} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || saveMutation.isPending}>
              {editing ? "Save changes" : "Create product"}
            </Button>
          </div>
        </form>
      </Modal>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          setValue("barcode", code);
          if (!modalOpen) setModalOpen(true);
          toast(`Barcode scanned: ${code}`, "success");
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        title="Remove product"
        description={`Are you sure you want to remove "${deleting?.name}"? This won't delete past sales history.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
