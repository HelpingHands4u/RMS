import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CreditCard, Loader2, Smartphone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, ErrorState, LoadingState, PageHeader, SimulationNotice, StatusBadge } from "@/components/rail/bits";
import { reservationService } from "@/services/reservation.service";
import { paymentService } from "@/services/payment.service";
import { cancellationService } from "@/services/cancellation.service";
import { formatINR } from "@/utils/fare";
import { fmtDateTime } from "@/utils/time";
import { toUserMessage } from "@/utils/errors";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

export const Route = createFileRoute("/_authenticated/payment/$reservationId")({
  head: () => pageHead("Simulated payment", "Academic payment simulation for your reservation."),
  component: PaymentPage,
});

const METHODS: { id: PaymentMethod; label: string; icon: typeof Smartphone }[] = [
  { id: "SIMULATED_UPI", label: "UPI", icon: Smartphone },
  { id: "SIMULATED_CARD", label: "Card", icon: CreditCard },
  { id: "SIMULATED_NET_BANKING", label: "Net Banking", icon: Building2 },
];

function PaymentPage() {
  const { reservationId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>("SIMULATED_UPI");
  const [fail, setFail] = useState(false);
  const [stage, setStage] = useState<"idle" | "processing" | "failed">("idle");
  const [lastTxn, setLastTxn] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["reservation", reservationId], queryFn: () => reservationService.getReservationById(reservationId) });

  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState message={toUserMessage(q.error, "Unable to load reservation.")} />;
  const r = q.data;
  if (!r) return <ErrorState message="Reservation not found." />;
  if (r.bookingStatus !== "PENDING") {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="mb-2">This reservation is <StatusBadge status={r.bookingStatus} /></p>
        <Button asChild><Link to="/bookings/$pnr" params={{ pnr: r.pnr }}>View ticket</Link></Button>
      </Card>
    );
  }

  const pay = async () => {
    setStage("processing");
    await new Promise((res) => setTimeout(res, 1600)); // simulated gateway delay
    try {
      const p = await paymentService.processPayment(r.id, method, r.totalFare, fail);
      setLastTxn(p.transactionId);
      qc.invalidateQueries({ queryKey: ["reservations"] });
      if (p.paymentStatus === "SUCCESS") {
        toast.success("Payment successful — booking confirmed!");
        navigate({ to: "/booking/success/$pnr", params: { pnr: r.pnr } });
      } else {
        setStage("failed");
        toast.error("Simulated payment failed. Your seats are still held — try again.");
      }
    } catch (e) {
      setStage("idle");
      toast.error(toUserMessage(e, "Payment could not be processed."));
    }
  };

  const abandon = async () => {
    try {
      await cancellationService.cancelReservation(r.id, "Payment abandoned by user");
      toast.success("Booking abandoned and seats released.");
      qc.invalidateQueries({ queryKey: ["reservations"] });
      navigate({ to: "/bookings" });
    } catch (e) {
      toast.error(toUserMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Payment" subtitle="SIMULATED ACADEMIC PAYMENT" />
      <SimulationNotice className="mb-6" />
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <Card>
          <h2 className="mb-3 font-semibold">Payment method</h2>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button key={m.id} type="button" onClick={() => setMethod(m.id)} className={cn("flex flex-col items-center gap-1 rounded-lg border p-3 text-sm", method === m.id ? "border-primary bg-primary/5 font-semibold text-primary" : "hover:bg-muted")}>
                <m.icon className="h-5 w-5" />{m.label}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {method === "SIMULATED_UPI" && <div className="space-y-1.5"><Label>UPI ID (demo)</Label><Input placeholder="student@demo" /></div>}
            {method === "SIMULATED_CARD" && (
              <>
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">Demo payment only. Do not enter real card details. Nothing typed here is stored.</p>
                <div className="space-y-1.5"><Label>Card number (dummy)</Label><Input placeholder="4111 1111 1111 1111" autoComplete="off" /></div>
                <div className="grid grid-cols-2 gap-2"><Input placeholder="MM/YY" autoComplete="off" /><Input placeholder="CVV" autoComplete="off" /></div>
              </>
            )}
            {method === "SIMULATED_NET_BANKING" && <div className="space-y-1.5"><Label>Bank (demo)</Label><Input placeholder="Demo University Bank" /></div>}
          </div>
          <label className="mt-5 flex items-center justify-between rounded-lg border border-dashed p-3 text-sm">
            <span>Simulate a failed payment<span className="block text-xs text-muted-foreground">For demonstrating the failure path</span></span>
            <Switch checked={fail} onCheckedChange={setFail} />
          </label>
          {stage === "failed" && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4" /><div>Payment failed{lastTxn ? ` (${lastTxn})` : ""}. Seats remain held — retry or abandon.</div>
            </div>
          )}
          <Button size="lg" className="mt-5 w-full" onClick={pay} disabled={stage === "processing"}>
            {stage === "processing" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing simulated payment…</> : `Pay ${formatINR(r.totalFare)}`}
          </Button>
          <button onClick={abandon} disabled={stage === "processing"} className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-destructive hover:underline">Abandon booking & release seats</button>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Transaction summary</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-xs text-muted-foreground">PNR</dt><dd className="font-mono font-semibold">{r.pnr}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Train</dt><dd>{r.trainNumber} {r.trainName}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Journey</dt><dd>{r.sourceName} → {r.destinationName}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Departure</dt><dd>{fmtDateTime(r.departureDateTime)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Seats</dt><dd className="font-mono text-xs">{r.seatLabels.join(", ")}</dd></div>
            <div className="border-t pt-2"><dt className="text-xs text-muted-foreground">Booking amount</dt><dd className="font-display text-2xl font-bold">{formatINR(r.totalFare)}</dd></div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
