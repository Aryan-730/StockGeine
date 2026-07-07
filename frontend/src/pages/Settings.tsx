import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, UserPlus } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/utils";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "cashier";
  isActive: boolean;
}

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["manager", "cashier"]),
});
type FormData = z.infer<typeof schema>;

export default function Settings() {
  const { business } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: team, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => (await api.get<{ data: TeamMember[] }>("/auth/team")).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "cashier" },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => api.post("/auth/team", data),
    onSuccess: () => {
      toast("Team member added", "success");
      queryClient.invalidateQueries({ queryKey: ["team"] });
      setModalOpen(false);
      reset({ name: "", email: "", password: "", role: "cashier" });
    },
    onError: (error) => toast(getErrorMessage(error), "error"),
  });

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your business profile and team members."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>Basic information about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{business?.name}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{business?.type}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Currency</span>
              <span className="font-medium">{business?.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Default low stock threshold</span>
              <span className="font-medium">{business?.lowStockThresholdDefault} units</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Team members</CardTitle>
              <CardDescription>Owner, Manager, and Cashier roles</CardDescription>
            </div>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <UserPlus className="h-4 w-4" /> Invite
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <PageSpinner />
            ) : (
              <div className="space-y-3">
                {team?.map((member) => (
                  <div key={member._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {initials(member.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="primary" className="capitalize">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Invite team member">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...register("name")} error={errors.name?.message} />
          </div>
          <div>
            <Label>Email</Label>
            <Input {...register("email")} error={errors.email?.message} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" {...register("password")} error={errors.password?.message} />
          </div>
          <div>
            <Label>Role</Label>
            <Select {...register("role")}>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
              <Plus className="h-4 w-4" /> Add member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
