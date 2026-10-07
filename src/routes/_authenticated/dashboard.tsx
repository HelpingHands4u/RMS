import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Ban, CalendarClock, Search, Ticket, TicketCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader, StatCard, StatusBadge } from "@/components/rail/bits";
import { useAuth } from "@/contexts/AuthContext";
import { useMyReservations } from "@/hooks/useMasterData";
import { formatINR } from "@/utils/fare";
import { fmtDate, fmtDateTime, fmtTime } from "@/utils/time";
import { toUserMessage } from "@/utils/errors";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Dashboard", "Your journeys at a glance."),
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useAuth();
  const q = useMyReservations();
  const list = q.data ?? [];
  const now = new Date().toISOString();
  const active = list.filter((r) => r.bookingStatus === "CONFIRMED" && r.departureDateTime > now);
  const upcoming = [...active].sort((a, b) => a.departureDateTime.localeCompare(b.departureDateTime))[0];
  const latest = list[0];

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${profile?.name?.split(" ")[0] ?? "traveller"}`} subtitle="Where are we going next?" />
      {q.isLoading && <LoadingState />}
      {q.isError && <ErrorState message={toUserMessage(q.error, "Unable to load your bookings.")} onRetry={() => q.refetch()} />}
      {q.data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Bookings" value={list.length} icon={<Ticket className="h-4 w-4" />} />
            <StatCard label="Active tickets" value={active.length} icon={<TicketCheck className="h-4 w-4" />} />
            <StatCard label="Cancelled" value={list.filter((r) => r.bookingStatus === "CANCELLED").length} icon={<Ban className="h-4 w-4" />} />
            <StatCard label="Awaiting payment" value={list.filter((r) => r.bookingStatus === "PENDING").length} icon={<CalendarClock className="h-4 w-4" />} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="overflow-hidden rounded-xl border bg-primary text-primary-foreground shadow-sm">
              <div className="p-5">
                <div className="text-xs uppercase tracking-widest opacity-70">Upcoming journey</div>
                {upcoming ? (
                  <>
                    <div className="mt-2 font-display text-xl font-bold">{upcoming.trainNumber} · {upcoming.trainName}</div>
                    <div className="mt-4 flex items-center gap-4">
                      <div><div className="font-display text-3xl font-extrabold">{fmtTime(upcoming.departureDateTime)}</div><div className="text-sm opacity-80">{upcoming.sourceName}</div></div>
                      <ArrowRight className="h-5 w-5 opacity-60" />
                      <div><div className="font-display text-3xl font-extrabold">{fmtTime(upcoming.arrivalDateTime)}</div><div className="text-sm opacity-80">{upcoming.destinationName}</div></div>
                    </div>
                    <div className="mt-3 text-sm opacity-80">{fmtDate(upcoming.departureDateTime)} · Seats {upcoming.seatLabels.join(", ")}</div>
                    <Button asChild variant="secondary" size="sm" className="mt-4"><Link to="/bookings/$pnr" params={{ pnr: upcoming.pnr }}>View ticket</Link></Button>
                  </>
                ) : <p className="mt-2 opacity-80">No upcoming journeys. Time to plan one.</p>}
              </div>
              <div className="rail-stripe" />
            </div>
            <Card>
              <h2 className="mb-3 font-semibold">Quick actions</h2>
              <div className="grid gap-2">
                <Button asChild variant="outline" className="justify-start"><Link to="/search"><Search className="mr-2 h-4 w-4" />Search Trains</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link to="/bookings"><Ticket className="mr-2 h-4 w-4" />My Bookings</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link to="/passengers"><Users className="mr-2 h-4 w-4" />Passengers</Link></Button>
              </div>
              {latest && <p className="mt-4 text-xs text-muted-foreground">Latest booking: <span className="font-mono">{latest.pnr}</span> · {fmtDateTime(latest.bookingTime)}</p>}
            </Card>
          </div>
          <Card>
            <h2 className="mb-3 font-semibold">Recent bookings</h2>
            {list.length === 0 ? <EmptyState title="No bookings yet." action={<Button asChild><Link to="/search">Search trains</Link></Button>} /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">PNR</th><th>Train</th><th>Journey</th><th>Fare</th><th>Status</th></tr></thead>
                  <tbody>{list.slice(0, 5).map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2"><Link to="/bookings/$pnr" params={{ pnr: r.pnr }} className="font-mono text-xs font-semibold text-primary hover:underline">{r.pnr}</Link></td>
                      <td>{r.trainNumber} {r.trainName}</td><td>{fmtDate(r.journeyDate)}</td><td>{formatINR(r.totalFare)}</td><td><StatusBadge status={r.bookingStatus} /></td>
                    </tr>))}</tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
