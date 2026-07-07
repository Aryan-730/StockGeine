import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Wrench,
  Package,
  Download,
  CheckCircle2,
} from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { Product, Service, Customer, PaginatedResponse, Sale } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarcodeScannerModal } from "@/components/shared/BarcodeScannerModal";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import { cn, formatCurrency } from "@/lib/utils";

interface CartLine {
  itemType: "product" | "service";
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  maxQuantity?: number;
}

export default function POS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"products" | "services">("products");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "other">("cash");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const { data: productsData } = useQuery({
    queryKey: ["pos-products", debouncedSearch],
    queryFn: async () =>
      (
        await api.get<PaginatedResponse<Product>>("/products", {
          params: { search: debouncedSearch, limit: 30 },
        })
      ).data.data,
    enabled: tab === "products",
  });

  const { data: servicesData } = useQuery({
    queryKey: ["pos-services"],
    queryFn: async () => (await api.get<{ data: Service[] }>("/services")).data.data,
    enabled: tab === "services",
  });

  const { data: customers } = useQuery({
    queryKey: ["customers", ""],
    queryFn: async () => (await api.get<{ data: Customer[] }>("/customers")).data.data,
  });

  function addToCart(line: CartLine) {
    setCart((prev) => {
      const existing = prev.find((l) => l.itemId === line.itemId && l.itemType === line.itemType);
      if (existing) {
        return prev.map((l) =>
          l.itemId === line.itemId && l.itemType === line.itemType
            ? { ...l, quantity: l.quantity + 1 }
            : l
        );
      }
      return [...prev, line];
    });
  }

  function updateQuantity(itemId: string, itemType: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.itemId === itemId && l.itemType === itemType
            ? { ...l, quantity: Math.max(1, l.quantity + delta) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(itemId: string, itemType: string) {
    setCart((prev) => prev.filter((l) => !(l.itemId === itemId && l.itemType === itemType)));
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [cart]
  );
  const total = Math.max(0, subtotal - discount + tax);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: Sale }>("/sales", {
        customerId: customerId || undefined,
        items: cart.map((l) => ({ itemType: l.itemType, itemId: l.itemId, quantity: l.quantity })),
        discount,
        tax,
        paymentMethod,
      });
      return res.data.data;
    },
    onSuccess: (sale) => {
      toast("Sale completed!", "success");
      setCompletedSale(sale);
      setCart([]);
      setDiscount(0);
      setTax(0);
      setCustomerId("");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  async function downloadReceipt(saleId: string, invoiceNumber: string) {
    try {
      const res = await api.get(`/sales/${saleId}/receipt`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast(getErrorMessage(error), "error");
    }
  }

  async function handleBarcodeDetected(code: string) {
    try {
      const res = await api.get<{ data: Product }>(`/products/barcode/${code}`);
      const product = res.data.data;
      addToCart({
        itemType: "product",
        itemId: product._id,
        name: product.name,
        unitPrice: product.sellingPrice,
        quantity: 1,
        maxQuantity: product.quantity,
      });
      toast(`Added ${product.name}`, "success");
    } catch {
      toast("No product found for that barcode", "error");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex rounded-lg border border-border bg-surface p-1">
            <button
              onClick={() => setTab("products")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                tab === "products" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <Package className="h-4 w-4" /> Products
            </button>
            <button
              onClick={() => setTab("services")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                tab === "services" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <Wrench className="h-4 w-4" /> Services
            </button>
          </div>

          {tab === "products" && (
            <>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setScannerOpen(true)}>
                <ScanBarcode className="h-4 w-4" /> Scan
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tab === "products" &&
            productsData?.map((p) => (
              <Card
                key={p._id}
                onClick={() =>
                  p.quantity > 0
                    ? addToCart({
                        itemType: "product",
                        itemId: p._id,
                        name: p.name,
                        unitPrice: p.sellingPrice,
                        quantity: 1,
                        maxQuantity: p.quantity,
                      })
                    : toast("Out of stock", "error")
                }
                className={cn(
                  "cursor-pointer p-3 transition-transform hover:-translate-y-0.5 hover:shadow-glow",
                  p.quantity <= 0 && "opacity-50"
                )}
              >
                <p className="text-sm font-medium leading-tight">{p.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-display text-sm font-bold">{formatCurrency(p.sellingPrice)}</p>
                  <Badge variant={p.quantity <= p.lowStockThreshold ? "warning" : "default"}>
                    {p.quantity} left
                  </Badge>
                </div>
              </Card>
            ))}

          {tab === "services" &&
            servicesData?.map((s) => (
              <Card
                key={s._id}
                onClick={() =>
                  addToCart({
                    itemType: "service",
                    itemId: s._id,
                    name: s.name,
                    unitPrice: s.price,
                    quantity: 1,
                  })
                }
                className="cursor-pointer p-3 transition-transform hover:-translate-y-0.5 hover:shadow-glow"
              >
                <p className="text-sm font-medium leading-tight">{s.name}</p>
                <p className="mt-2 font-display text-sm font-bold">{formatCurrency(s.price)}</p>
              </Card>
            ))}
        </div>
      </div>

      <div>
        <Card className="sticky top-6 flex max-h-[calc(100vh-8rem)] flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold">Current sale</h3>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tap a product or service to add it here.
              </p>
            ) : (
              cart.map((l) => (
                <div key={`${l.itemType}-${l.itemId}`} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(l.unitPrice)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(l.itemId, l.itemType, -1)}
                      className="rounded-md border border-border p-1 hover:bg-muted"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{l.quantity}</span>
                    <button
                      onClick={() => updateQuantity(l.itemId, l.itemType, 1)}
                      className="rounded-md border border-border p-1 hover:bg-muted"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeLine(l.itemId, l.itemType)}
                      className="ml-1 rounded-md p-1 text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {customers?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Discount"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
              <Input
                type="number"
                placeholder="Tax"
                value={tax || ""}
                onChange={(e) => setTax(Number(e.target.value) || 0)}
              />
            </div>

            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="other">Other</option>
            </Select>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between font-display text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={cart.length === 0}
              isLoading={checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
            >
              Complete sale
            </Button>
          </div>
        </Card>
      </div>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />

      <Modal open={!!completedSale} onClose={() => setCompletedSale(null)} title="Sale completed">
        {completedSale && (
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="mb-2 h-12 w-12 text-success" />
            <p className="font-display text-lg font-semibold">{completedSale.invoiceNumber}</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(completedSale.total)}</p>
            <Button
              className="mt-4"
              onClick={() => downloadReceipt(completedSale._id, completedSale.invoiceNumber)}
            >
              <Download className="h-4 w-4" /> Download receipt
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
