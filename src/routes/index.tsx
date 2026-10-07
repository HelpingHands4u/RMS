import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Armchair, Ban, CreditCard, Search, ShieldCheck, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/rail/bits";
import { useAuth } from "@/contexts/AuthContext";
import hero from "@/assets/hero-train.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RailReserve — University Railway Reservation System" },
      { name: "description", content: "Search trains, check live seat availability, book tickets with simulated payment and manage cancellations. An academic project." },
      { property: "og:title", content: "RailReserve — University Railway Reservation System" },
      { property: "og:description", content: "Database-driven train search, seat selection, booking and cancellation — academic simulation." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Search, title: "Route-aware search", text: "Finds trains where your boarding station comes before your destination on the route." },
  { icon: Armchair, title: "Real seat maps", text: "Availability is computed from actual reservations — never a made-up number." },
  { icon: ShieldCheck, title: "No double booking", text: "Seats are locked inside a database transaction at the moment of booking." },
  { icon: CreditCard, title: "Simulated payment", text: "UPI, card and net-banking flows for demonstration. No real money moves." },
  { icon: Ticket, title: "Printable tickets", text: "Unique PNR, passenger snapshots, print or download your ticket." },
  { icon: Ban, title: "Fair cancellations", text: "Time-based refund rule, seats released instantly for other passengers." },
];

function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="rounded-lg bg-card/90 px-3 py-2 backdrop-blur"><Logo /></div>
        <div className="flex gap-2">
          {user ? (
            <Button asChild><Link to="/dashboard">Open dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="secondary"><Link to="/login">Sign in</Link></Button>
              <Button asChild className="hidden sm:inline-flex"><Link to="/register">Register</Link></Button>
            </>
          )}
        </div>
      </header>

      <section className="relative flex min-h-[86vh] items-end overflow-hidden">
        <img src={hero} alt="Express train curving through countryside at sunset" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 sm:px-10">
          <p className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-foreground">Academic Simulation • Not connected to IRCTC</p>
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.05] text-primary-foreground sm:text-6xl">
            Plan the journey. Pick the berth. Hold the ticket.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-primary-foreground/85">
            A database-driven railway reservation system covering trains, routes, schedules, coaches, seats, bookings, payments and cancellations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to={user ? "/search" : "/register"}>Search trains <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            {!user && <Button asChild size="lg" variant="secondary"><Link to="/login">I have an account</Link></Button>}
          </div>
        </div>
      </section>
      <div className="rail-stripe" />

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
        <h2 className="text-2xl font-bold sm:text-3xl">How the system works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        RailReserve is an academic simulation and is not connected to IRCTC or any real railway reservation/payment infrastructure.
      </footer>
    </div>
  );
}
