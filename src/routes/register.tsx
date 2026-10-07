import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { FirebaseSetupNotice } from "@/components/rail/FirebaseSetupNotice";
import { toUserMessage } from "@/utils/errors";
import { AuthFrame } from "@/components/rail/AuthFrame";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — RailReserve" },
      { name: "description", content: "Register a passenger account on RailReserve, the academic railway reservation system." },
      { property: "og:title", content: "Create account — RailReserve" },
      { property: "og:description", content: "Register a passenger account on RailReserve." },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  password: z.string().min(6, "At least 6 characters").max(64),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

function RegisterPage() {
  const { register, user, loading, configured } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && !busy) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, busy, navigate]);

  if (!configured) return <div className="flex min-h-screen items-center p-6"><FirebaseSetupNotice /></div>;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await register({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, password: parsed.data.password });
      toast.success("Account created. Welcome aboard!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(toUserMessage(err, "Unable to create account."));
    } finally {
      setBusy(false);
    }
  };

  const field = (k: keyof typeof form, label: string, type = "text", auto?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} value={form[k]} onChange={set(k)} autoComplete={auto} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <AuthFrame title="Create your account" subtitle="New accounts are passenger accounts.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {field("name", "Full name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("phone", "Mobile number", "tel", "tel")}
        {field("password", "Password", "password", "new-password")}
        {field("confirm", "Confirm password", "password", "new-password")}
        <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </AuthFrame>
  );
}
