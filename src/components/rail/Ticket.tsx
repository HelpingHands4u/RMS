import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./bits";
import { CLASS_LABELS, formatINR } from "@/utils/fare";
import { fmtDate, fmtDateTime } from "@/utils/time";
import type { Reservation, ReservationPassenger } from "@/types";

export function Ticket({ reservation: r, passengers }: { reservation: Reservation; passengers: ReservationPassenger[] }) {
  return (
    <div id="ticket" className="print-area overflow-hidden rounded-2xl border bg-card shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-primary px-6 py-4 text-primary-foreground">
        <div>
          <div className="font-display text-xl font-extrabold tracking-wider">RAILRESERVE</div>
          <div className="text-xs opacity-80">Academic Railway Reservation System · Electronic Reservation Slip</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest opacity-70">PNR</div>
          <div className="font-mono text-lg font-semibold">{r.pnr}</div>
        </div>
      </div>
      <div className="rail-stripe" />
      <div className="grid gap-4 px-6 py-5 sm:grid-cols-3">
        <div><div className="text-xs text-muted-foreground">Train</div><div className="font-semibold">{r.trainNumber} · {r.trainName}</div></div>
        <div><div className="text-xs text-muted-foreground">Journey date</div><div className="font-semibold">{fmtDate(r.journeyDate)}</div></div>
        <div><div className="text-xs text-muted-foreground">Class</div><div className="font-semibold">{r.classType} · {CLASS_LABELS[r.classType]}</div></div>
        <div><div className="text-xs text-muted-foreground">From</div><div className="font-semibold">{r.sourceName}</div><div className="text-sm">Dep {fmtDateTime(r.departureDateTime)}</div></div>
        <div><div className="text-xs text-muted-foreground">To</div><div className="font-semibold">{r.destinationName}</div><div className="text-sm">Arr {fmtDateTime(r.arrivalDateTime)}</div></div>
        <div className="flex flex-wrap items-start gap-2">
          <div><div className="text-xs text-muted-foreground">Booking</div><StatusBadge status={r.bookingStatus} /></div>
          <div><div className="text-xs text-muted-foreground">Payment</div><StatusBadge status={r.paymentStatus} /></div>
        </div>
      </div>
      <div className="overflow-x-auto px-6">
        <table className="w-full min-w-[520px] text-sm">
          <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">#</th><th>Passenger</th><th>Age</th><th>Gender</th><th>Coach</th><th>Seat</th><th>Status</th><th className="text-right">Fare</th></tr></thead>
          <tbody>
            {passengers.map((p, i) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2">{i + 1}</td><td className="font-medium">{p.passengerNameSnapshot}</td><td>{p.ageSnapshot}</td><td>{p.genderSnapshot}</td>
                <td className="font-mono">{p.coachNumber}</td><td className="font-mono">{p.seatNumber}</td><td><StatusBadge status={p.status} /></td><td className="text-right">{formatINR(p.fare)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-xs text-muted-foreground">Booked {fmtDateTime(r.bookingTime)}</span>
        <span className="font-display text-xl font-bold">Total {formatINR(r.totalFare)}</span>
      </div>
      <div className="border-t bg-muted/40 px-6 py-3 text-[11px] text-muted-foreground">
        Academic Simulation — not valid for travel. Not connected to IRCTC or any real railway or payment system.
      </div>
    </div>
  );
}

/** Downloads a self-contained HTML copy of the ticket. */
export function downloadTicket(pnr: string) {
  const el = document.getElementById("ticket");
  if (!el) return;
  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')].map((n) => n.outerHTML).join("\n");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${pnr}</title><base href="${location.origin}/">${styles}</head><body style="padding:24px;background:#fff">${el.outerHTML}</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `RailReserve-${pnr}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TicketActions({ pnr }: { pnr: string }) {
  return (
    <>
      <Button variant="outline" onClick={() => downloadTicket(pnr)}><Download className="mr-1 h-4 w-4" />Download Ticket</Button>
      <Button variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print Ticket</Button>
    </>
  );
}
