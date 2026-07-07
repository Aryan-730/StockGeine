import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Tags, Pencil, Trash2 } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { Category } from "@/types";
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
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Categories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<{ data: Category[] }>("/categories")).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function openCreate() {
    setEditing(null);
    reset({ name: "", description: "" });
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    reset({ name: cat.name, description: cat.description || "" });
    setModalOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) =>
      editing ? api.put(`/categories/${editing._id}`, data) : api.post("/categories", data),
    onSuccess: () => {
      toast(editing ? "Category updated" : "Category created", "success");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setModalOpen(false);
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast("Category deleted", "success");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleting(null);
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your products into logical groups."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add category
          </Button>
        }
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Tags className="h-8 w-8" />} title="No categories yet" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c._id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.description || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(c)}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit category" : "Add category"}>
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...register("name")} error={errors.name?.message} />
          </div>
          <div>
            <Label>Description</Label>
            <Input {...register("description")} />
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
        title="Delete category"
        description={`Delete "${deleting?.name}"? Products in this category will keep their data but lose the category link.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
