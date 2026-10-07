import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Ban, CreditCard, Eye, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/rail/bits";
import { CancelTicketDialog } from "@/components/rail/CancelTicketDialog";
import { useMyReservations } from "@/hooks/useMasterData";
import { formatINR } from "@/utils/fare";
import { fmtDate, fmtDateTime } from "@/utils/time";
import { toUserMessage } from "@/utils/errors";
import { pageHead } from "@/lib/seo";
import type { Reservation } from "@/types";

export const Route = createFileRoute("/_authenticated/bookings/")({
  head: () => pageHead("My bookings", "All your reservations, tickets and cancellations."),
  component: Bookings,
});

type Filter = "ALL" | "UPCOMING" | "CONFIRMED" | "CANCELLED";

function Bookings() {
  const q = useMyReservations();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const now = new Date().toISOString();
  const rows = (q.data ?? []).filter((r) =>
    filter === "ALL" ? true
      : filter === "UPCOMING" ? r.bookingStatus === "CONFIRMED" && r.departureDateTime > now
        : r.bookingStatus === filter);

  return (
    <div>
      <PageHeader title="My bookings" actions={<Button asChild><Link to="/search">Book a ticket</Link></Button>} />
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-4">
        <TabsList><TabsTrigger value="ALL">All</TabsTrigger><TabsTrigger value="UPCOMING">Upcoming</TabsTrigger><TabsTrigger value="CONFIRMED">Confirmed</TabsTrigger><TabsTrigger value="CANCELLED">Cancelled</TabsTrigger></TabsList>
      </Tabs>
      {q.isLoading && <LoadingState />}
      {q.isError && <ErrorState message={toUserMessage(q.error, "Unable to load bookings.")} onRetry={() => q.refetch()} />}
      {q.data && rows.length === 0 && <EmptyState icon={<TicketIcon className="h-10 w-10" />} title={filter === "ALL" ? "No bookings yet." : "No bookings match this filter."} action={<Button asChild variant="outline"><Link to="/search">Search trains</Link></Button>} />}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3">PNR</th><th>Train</th><th>Journey</th><th>Pax</th><th>Class</th><th>Seats</th><th>Fare</th><th>Payment</th><th>Booking</th><th>Booked</th><th className="px-4 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{r.pnr}</td>
                  <td>{r.trainNumber}<div className="text-xs text-muted-foreground">{r.trainName}</div></td>
                  <td>{r.sourceName.split(" (")[0]} → {r.destinationName.split(" (")[0]}<div className="text-xs text-muted-foreground">{fmtDate(r.journeyDate)}</div></td>
                  <td>{r.passengerCount}</td><td>{r.classType}</td>
                  <td className="font-mono text-xs">{r.seatLabels.join(", ")}</td>
                  <td>{formatINR(r.totalFare)}</td>
                  <td><StatusBadge status={r.paymentStatus} /></td>
                  <td><StatusBadge status={r.bookingStatus} /></td>
                  <td className="text-xs text-muted-foreground">{fmtDateTime(r.bookingTime)}</td>
                  <td className="px-4">
                    <div className="flex justify-end gap-1">
                      {r.bookingStatus === "PENDING" && <Button asChild size="sm"><Link to="/payment/$reservationId" params={{ reservationId: r.id }}><CreditCard className="mr-1 h-3.5 w-3.5" />Pay</Link></Button>}
                      <Button asChild size="sm" variant="outline"><Link to="/bookings/$pnr" params={{ pnr: r.pnr }}><Eye className="mr-1 h-3.5 w-3.5" />Ticket</Link></Button>
                      {r.bookingStatus !== "CANCELLED" && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setCancelling(r)}><Ban className="mr-1 h-3.5 w-3.5" />Cancel</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CancelTicketDialog reservation={cancelling} open={!!cancelling} onOpenChange={(o) => !o && setCancelling(null)} />
    </div>
  );
}
