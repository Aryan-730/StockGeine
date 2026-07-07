import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";

const schema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessType: z.enum(["inventory", "service", "hybrid"]),
  name: z.string().min(2, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const { register: registerAccount } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { businessType: "hybrid" },
  });

  async function onSubmit(data: FormData) {
    try {
      await registerAccount(data);
      navigate("/dashboard");
    } catch (error) {
      toast(getErrorMessage(error), "error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-genie to-genie-glow text-white shadow-glow">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold">Set up your shop</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your StockGenie workspace
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              placeholder="Sharma General Store"
              error={errors.businessName?.message}
              {...register("businessName")}
            />
          </div>
          <div>
            <Label htmlFor="businessType">Business type</Label>
            <Select id="businessType" {...register("businessType")}>
              <option value="inventory">Inventory-based</option>
              <option value="service">Service-based</option>
              <option value="hybrid">Both</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              placeholder="Rohit Sharma"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@business.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
