import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Wrench, Pencil, Trash2 } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { Service } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  durationMinutes: z.coerce.number().positive().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Services() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get<{ data: Service[] }>("/services")).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function openCreate() {
    setEditing(null);
    reset({ name: "", description: "", price: 0, durationMinutes: undefined });
    setModalOpen(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    reset({
      name: s.name,
      description: s.description || "",
      price: s.price,
      durationMinutes: s.durationMinutes,
    });
    setModalOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) =>
      editing ? api.put(`/services/${editing._id}`, data) : api.post("/services", data),
    onSuccess: () => {
      toast(editing ? "Service updated" : "Service created", "success");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setModalOpen(false);
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      toast("Service removed", "success");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setDeleting(null);
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  return (
    <div>
      <PageHeader
        title="Services"
        description="Manage bookable services and their pricing for service billing."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add service
          </Button>
        }
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Wrench className="h-8 w-8" />} title="No services yet" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <Card key={s._id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-semibold">{s.name}</p>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(s)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-display text-lg font-bold">{formatCurrency(s.price)}</p>
                {s.durationMinutes && (
                  <p className="text-xs text-muted-foreground">{s.durationMinutes} min</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit service" : "Add service"}>
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...register("name")} error={errors.name?.message} />
          </div>
          <div>
            <Label>Description</Label>
            <Input {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price</Label>
              <Input type="number" step="0.01" {...register("price")} error={errors.price?.message} />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" {...register("durationMinutes")} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || saveMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        title="Remove service"
        description={`Remove "${deleting?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
