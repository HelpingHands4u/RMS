import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "./ConfirmDialog";
import { cancellationService } from "@/services/cancellation.service";
import { formatINR } from "@/utils/fare";
import { toUserMessage } from "@/utils/errors";
import type { Reservation } from "@/types";

export function CancelTicketDialog({ reservation, open, onOpenChange, asAdmin = false }: {
  reservation: Reservation | null; open: boolean; onOpenChange: (o: boolean) => void; asAdmin?: boolean;
}) {
  const [reason, setReason] = useState("");
  const qc = useQueryClient();
  if (!reservation) return null;
  const quote = cancellationService.quote(reservation);

  const confirm = async () => {
    if (reason.trim().length < 3) {
      toast.error("Please enter a reason for cancellation.");
      throw new Error("validation");
    }
    try {
      const c = await cancellationService.cancelReservation(reservation.id, reason, asAdmin);
      toast.success(`Ticket cancelled. Refund ${formatINR(c.refundAmount)} (${c.refundPercent}%).`);
      setReason("");
      qc.invalidateQueries();
    } catch (e) {
      toast.error(toUserMessage(e, "Cancellation could not be completed."));
      throw e;
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Cancel ${reservation.pnr}?`}
      description="This cannot be undone. All passengers on this ticket will be cancelled and the seats released."
      confirmLabel="Confirm cancellation"
      destructive
      onConfirm={confirm}
    >
      <div className="space-y-3">
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" />Refund calculation (academic rule)</div>
          <div className="flex justify-between"><span>Original fare</span><span>{formatINR(reservation.paymentStatus === "SUCCESS" ? reservation.totalFare : 0)}</span></div>
          <div className="flex justify-between"><span>Refund percentage</span><span>{quote.percent}%</span></div>
          <div className="flex justify-between font-semibold"><span>Refund amount</span><span>{formatINR(quote.refundAmount)}</span></div>
          <div className="mt-1 text-xs text-muted-foreground">{quote.rule}</div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason</Label>
          <Textarea id="reason" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Change of travel plans" />
        </div>
      </div>
    </ConfirmDialog>
  );
}
