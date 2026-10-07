import { runTransaction } from "firebase/firestore";
import { getDb } from "@/firebase/config";
import { getById, listDocs, ref, byCreatedDesc } from "./db";
import { requireUserId } from "./auth.service";
import { reservationService } from "./reservation.service";
import { auditService } from "./audit.service";
import { AppError } from "@/utils/errors";
import { calculateRefund, type RefundQuote } from "@/utils/refund";
import { nowISO } from "@/utils/ids";
import type { Cancellation, Payment, Reservation } from "@/types";

export const cancellationService = {
  /** Refund preview shown before the user confirms. */
  quote(r: Reservation): RefundQuote {
    if (r.paymentStatus !== "SUCCESS") return { hoursBeforeDeparture: 0, percent: 0, refundAmount: 0, rule: "No successful payment — nothing to refund" };
    return calculateRefund(r.totalFare, r.departureDateTime);
  },

  /**
   * Cancels a reservation atomically:
   * reservation → CANCELLED, every reservationPassenger → CANCELLED,
   * payment refund recorded, cancellations/{reservationId} created (1:1),
   * seatLocks deleted so the seats become available again.
   */
  async cancelReservation(reservationId: string, reason: string, asAdmin = false): Promise<Cancellation> {
    const userId = requireUserId();
    const reasonText = reason.trim();
    if (reasonText.length < 3) throw new AppError("Please enter a reason for cancellation.");
    const initial = await getById<Reservation>("reservations", reservationId);
    if (!initial) throw new AppError("Reservation not found.");
    if (!asAdmin && initial.userId !== userId) throw new AppError("You do not have permission to perform this action.");
    const passengers = await reservationService.getPassengers(initial, asAdmin);

    const result = await runTransaction(getDb(), async (tx) => {
      const resRef = ref("reservations", reservationId);
      const snap = await tx.get(resRef);
      const r = snap.data() as Reservation;
      if (r.bookingStatus === "CANCELLED") throw new AppError("This ticket is already cancelled.");
      const payRef = r.paymentId ? ref("payments", r.paymentId) : null;
      const paySnap = payRef ? await tx.get(payRef) : null;
      const payment = paySnap?.exists() ? (paySnap.data() as Payment) : null;

      const q = payment?.paymentStatus === "SUCCESS" ? calculateRefund(r.totalFare, r.departureDateTime) : null;
      const refundAmount = q?.refundAmount ?? 0;
      const refundStatus = q ? (refundAmount > 0 ? "PROCESSED" : "NOT_APPLICABLE") : "NOT_APPLICABLE";
      const ts = nowISO();

      tx.update(resRef, { bookingStatus: "CANCELLED", paymentStatus: refundAmount > 0 ? "REFUNDED" : r.paymentStatus, updatedAt: ts });
      passengers.forEach((p) => tx.update(ref("reservationPassengers", p.id), { status: "CANCELLED" }));
      if (payRef && payment) tx.update(payRef, { refundAmount, refundStatus, paymentStatus: refundAmount > 0 ? "REFUNDED" : payment.paymentStatus, updatedAt: ts });
      r.seatLockIds.forEach((id) => tx.delete(ref("seatLocks", id)));
      const cancellation: Cancellation = {
        id: reservationId, reservationId, userId: r.userId, pnr: r.pnr, reason: reasonText, cancelledAt: ts,
        originalFare: r.totalFare, refundPercent: q?.percent ?? 0, refundAmount, refundStatus, createdAt: ts, updatedAt: ts,
      };
      tx.set(ref("cancellations", reservationId), cancellation);
      return cancellation;
    });
    await auditService.log("RESERVATION_CANCELLED", "Reservation", reservationId, `Cancelled ${result.pnr}; refund ₹${result.refundAmount}`);
    return result;
  },

  getForReservation: (reservationId: string) => getById<Cancellation>("cancellations", reservationId),
  listAll: async () => (await listDocs<Cancellation>("cancellations")).sort(byCreatedDesc),
};
