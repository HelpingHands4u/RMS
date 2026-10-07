import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/rail/bits";
import { Ticket, TicketActions } from "@/components/rail/Ticket";
import { useTicket } from "@/hooks/useTicket";
import { toUserMessage } from "@/utils/errors";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/booking/success/$pnr")({
  head: () => pageHead("Booking confirmed", "Your simulated booking is confirmed."),
  component: Success,
});

function Success() {
  const { pnr } = Route.useParams();
  const q = useTicket(pnr);
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState message={toUserMessage(q.error, "Ticket not found.")} />;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="no-print flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
        <CheckCircle2 className="h-8 w-8 text-success" />
        <div>
          <div className="font-display text-lg font-bold">Booking confirmed</div>
          <div className="text-sm text-muted-foreground">PNR <span className="font-mono font-semibold">{pnr}</span> · Simulated payment successful</div>
        </div>
      </div>
      <Ticket reservation={q.data.reservation} passengers={q.data.passengers} />
      <div className="no-print flex flex-wrap gap-2">
        <TicketActions pnr={pnr} />
        <Button asChild><Link to="/bookings">View My Bookings</Link></Button>
      </div>
    </div>
  );
}
