import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Ban, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/rail/bits";
import { Ticket, TicketActions } from "@/components/rail/Ticket";
import { CancelTicketDialog } from "@/components/rail/CancelTicketDialog";
import { useTicket } from "@/hooks/useTicket";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR } from "@/utils/fare";
import { fmtDateTime } from "@/utils/time";
import { toUserMessage } from "@/utils/errors";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/bookings/$pnr")({
  head: () => pageHead("Ticket", "View, print or cancel your ticket."),
  component: TicketPage,
});

function TicketPage() {
  const { pnr } = Route.useParams();
  const { isAdmin, user } = useAuth();
  const [cancelOpen, setCancelOpen] = useState(false);
  const q = useTicket(pnr, isAdmin);
  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState message={toUserMessage(q.error, "Unable to load ticket.")} />;
  if (!q.data) return <EmptyState title="Ticket not found" description={`No reservation exists with PNR ${pnr}.`} />;
  const { reservation: r, passengers, cancellation } = q.data;
  const asAdmin = isAdmin && r.userId !== user?.uid;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="no-print"><PageHeader title="Ticket" subtitle={r.pnr} actions={
        <>
          <TicketActions pnr={r.pnr} />
          {r.bookingStatus === "PENDING" && !asAdmin && <Button asChild><Link to="/payment/$reservationId" params={{ reservationId: r.id }}><CreditCard className="mr-1 h-4 w-4" />Complete payment</Link></Button>}
          {r.bookingStatus !== "CANCELLED" && <Button variant="destructive" onClick={() => setCancelOpen(true)}><Ban className="mr-1 h-4 w-4" />Cancel Ticket</Button>}
        </>
      } /></div>
      <Ticket reservation={r} passengers={passengers} />
      {cancellation && (
        <Card className="no-print">
          <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Cancellation & refund</h2><StatusBadge status={cancellation.refundStatus} /></div>
          <div className="grid gap-3 text-sm sm:grid-cols-4">
            <div><div className="text-xs text-muted-foreground">Original fare</div>{formatINR(cancellation.originalFare)}</div>
            <div><div className="text-xs text-muted-foreground">Refund %</div>{cancellation.refundPercent}%</div>
            <div><div className="text-xs text-muted-foreground">Refund amount</div><span className="font-semibold">{formatINR(cancellation.refundAmount)}</span></div>
            <div><div className="text-xs text-muted-foreground">Cancelled</div>{fmtDateTime(cancellation.cancelledAt)}</div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Reason: {cancellation.reason}</p>
        </Card>
      )}
      <CancelTicketDialog reservation={r} open={cancelOpen} onOpenChange={setCancelOpen} asAdmin={asAdmin} />
    </div>
  );
}
