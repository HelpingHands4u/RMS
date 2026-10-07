import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Search, Ticket, Users, UserCircle, LogOut, Menu, Shield, TrainFront, MapPin, Route as RouteIcon,
  CalendarClock, Armchair, Rows3, ClipboardList, CreditCard, Ban, BarChart3, UserSquare,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "./bits";

type NavItem = { to: string; label: string; icon: ReactNode; exact?: boolean };

const PASSENGER_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/search", label: "Search Trains", icon: <Search className="h-4 w-4" /> },
  { to: "/bookings", label: "My Bookings", icon: <Ticket className="h-4 w-4" /> },
  { to: "/passengers", label: "Passengers", icon: <Users className="h-4 w-4" /> },
  { to: "/profile", label: "Profile", icon: <UserCircle className="h-4 w-4" /> },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: <Shield className="h-4 w-4" />, exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/admin/trains", label: "Trains", icon: <TrainFront className="h-4 w-4" /> },
  { to: "/admin/stations", label: "Stations", icon: <MapPin className="h-4 w-4" /> },
  { to: "/admin/routes", label: "Routes & Stops", icon: <RouteIcon className="h-4 w-4" /> },
  { to: "/admin/schedules", label: "Schedules", icon: <CalendarClock className="h-4 w-4" /> },
  { to: "/admin/coaches", label: "Coaches", icon: <Rows3 className="h-4 w-4" /> },
  { to: "/admin/seats", label: "Seats", icon: <Armchair className="h-4 w-4" /> },
  { to: "/admin/reservations", label: "Reservations", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/admin/passengers", label: "Passengers", icon: <UserSquare className="h-4 w-4" /> },
  { to: "/admin/payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { to: "/admin/cancellations", label: "Cancellations", icon: <Ban className="h-4 w-4" /> },
];

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="space-y-0.5">
      {items.map((i) => (
        <Link
          key={i.to}
          to={i.to}
          onClick={onNavigate}
          activeOptions={{ exact: i.exact ?? false }}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent !text-sidebar-primary font-semibold" }}
        >
          {i.icon} {i.label}
        </Link>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await logout();
    navigate({ to: "/login", replace: true });
  };
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-5"><Logo light /></div>
      <div className="rail-stripe mx-5 opacity-70" />
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <div>
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">Passenger</div>
          <NavList items={PASSENGER_NAV} onNavigate={onNavigate} />
        </div>
        {isAdmin && (
          <div>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">Administration</div>
            <NavList items={ADMIN_NAV} onNavigate={onNavigate} />
          </div>
        )}
      </div>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 truncate text-sm">
          <div className="font-semibold">{profile?.name ?? "User"}</div>
          <div className="truncate text-xs text-sidebar-foreground/60">{profile?.email} · {profile?.role}</div>
        </div>
        <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
        <p className="mt-3 text-[10px] leading-snug text-sidebar-foreground/45">Academic Simulation • Not connected to IRCTC</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 lg:block"><SidebarContent /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-2 hover:bg-muted"><Menu className="h-5 w-5" /></button>
          <Logo />
          <span className="w-9" />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
