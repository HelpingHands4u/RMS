import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/rail/bits";
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

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <Logo light />
        <div>
          <p className="font-display text-4xl font-extrabold leading-tight">Every seat, accounted for.</p>
          <p className="mt-3 max-w-sm text-sidebar-foreground/70">Search routes, see real seat availability, book and cancel — all backed by a live database.</p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Academic Simulation • Not connected to IRCTC</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

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
