import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Truck, Pencil, Trash2 } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { Supplier } from "@/types";
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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  leadTimeDays: z.coerce.number().nonnegative().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Suppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => (await api.get<{ data: Supplier[] }>("/suppliers")).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function openCreate() {
    setEditing(null);
    reset({ name: "", contactPerson: "", phone: "", email: "", address: "", leadTimeDays: 3 });
    setModalOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    reset({
      name: s.name,
      contactPerson: s.contactPerson || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      leadTimeDays: s.leadTimeDays,
    });
    setModalOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) =>
      editing ? api.put(`/suppliers/${editing._id}`, data) : api.post("/suppliers", data),
    onSuccess: () => {
      toast(editing ? "Supplier updated" : "Supplier created", "success");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setModalOpen(false);
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      toast("Supplier deleted", "success");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setDeleting(null);
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Manage supplier contacts and delivery lead times — used by the AI reorder engine."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add supplier
          </Button>
        }
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Truck className="h-8 w-8" />} title="No suppliers yet" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Lead time</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s._id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.contactPerson || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                  <td className="px-4 py-3">{s.leadTimeDays} days</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(s)}>
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit supplier" : "Add supplier"}>
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...register("name")} error={errors.name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact person</Label>
              <Input {...register("contactPerson")} />
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
              <Label>Lead time (days)</Label>
              <Input type="number" {...register("leadTimeDays")} />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input {...register("address")} />
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
        title="Delete supplier"
        description={`Delete "${deleting?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
