import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, ShieldAlert, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <TrainFront className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className={cn("font-display text-base font-extrabold tracking-wider", light ? "text-sidebar-foreground" : "text-primary")}>RAILRESERVE</div>
        <div className={cn("text-[10px] uppercase tracking-widest", light ? "text-sidebar-foreground/60" : "text-muted-foreground")}>University Railway Reservation</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-success/12 text-success border-success/30",
  CONFIRMED: "bg-success/12 text-success border-success/30",
  SUCCESS: "bg-success/12 text-success border-success/30",
  SCHEDULED: "bg-info/12 text-info border-info/30",
  PROCESSED: "bg-success/12 text-success border-success/30",
  PENDING: "bg-warning/20 text-warning-foreground border-warning/40",
  REFUNDED: "bg-info/12 text-info border-info/30",
  COMPLETED: "bg-muted text-muted-foreground border-border",
  NOT_APPLICABLE: "bg-muted text-muted-foreground border-border",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
  FAILED: "bg-destructive/10 text-destructive border-destructive/30",
  ADMIN: "bg-primary/10 text-primary border-primary/30",
  PASSENGER: "bg-secondary text-secondary-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide", STATUS_STYLES[status] ?? "bg-muted text-muted-foreground")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <div className="mb-3 text-muted-foreground">{icon ?? <Inbox className="h-10 w-10" />}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <AlertTriangle className="mb-2 h-8 w-8 text-destructive" />
      <p className="font-medium text-destructive">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline">Try again</button>
      )}
    </div>
  );
}

export function UnauthorizedState() {
  return <EmptyState icon={<ShieldAlert className="h-10 w-10" />} title="Access denied" description="You do not have permission to view this page." />;
}

export function StatCard({ label, value, icon, hint }: { label: string; value: ReactNode; icon: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function SimulationNotice({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/15 px-3 py-2 text-xs font-medium text-warning-foreground", className)}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children ?? "Academic Simulation — No real money is processed."}</span>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}>{children}</div>;
}
