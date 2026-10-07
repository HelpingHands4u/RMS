import type { ReactNode } from "react";
import { Logo } from "./bits";

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
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

