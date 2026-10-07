import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AuthFrame } from "@/components/rail/AuthFrame";
import { FirebaseSetupNotice } from "@/components/rail/FirebaseSetupNotice";
import { toUserMessage } from "@/utils/errors";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — RailReserve" },
      { name: "description", content: "Sign in to RailReserve to search trains and manage your bookings." },
      { property: "og:title", content: "Sign in — RailReserve" },
      { property: "og:description", content: "Sign in to RailReserve to search trains and manage your bookings." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(6, "Password must be at least 6 characters") });

function LoginPage() {
  const { login, user, configured, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  if (!configured) return <div className="flex min-h-screen items-center p-6"><FirebaseSetupNotice /></div>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(toUserMessage(err, "Unable to sign in."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="Sign in" subtitle="Access your journeys and tickets.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to RailReserve? <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link>
      </p>
    </AuthFrame>
  );
}
