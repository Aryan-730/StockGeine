import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Plus, Users, Search } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { Customer } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Customers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch],
    queryFn: async () =>
      (await api.get<{ data: Customer[] }>("/customers", { params: { search: debouncedSearch } })).data
        .data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => api.post("/customers", data),
    onSuccess: () => {
      toast("Customer added", "success");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setModalOpen(false);
      reset({ name: "", phone: "", email: "", address: "" });
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="View customer profiles and purchase history."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add customer
          </Button>
        }
      />

      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No customers yet" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <Link key={c._id} to={`/customers/${c._id}`}>
              <Card className="p-5 transition-shadow hover:shadow-glow">
                <p className="font-display font-semibold">{c.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.phone || "No phone"}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total spent</span>
                  <span className="font-semibold">{formatCurrency(c.totalSpent)}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Customer since {formatDate(c.createdAt)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add customer">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...register("name")} error={errors.name?.message} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...register("phone")} />
          </div>
          <div>
            <Label>Email</Label>
            <Input {...register("email")} error={errors.email?.message} />
          </div>
          <div>
            <Label>Address</Label>
            <Input {...register("address")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
