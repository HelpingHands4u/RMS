import { runTransaction, where } from "firebase/firestore";
import { getDb } from "@/firebase/config";
import { listDocs, listWhere, ref, byCreatedDesc } from "./db";
import { requireUserId } from "./auth.service";
import { AppError } from "@/utils/errors";
import { generateTransactionId, nowISO } from "@/utils/ids";
import type { Payment, PaymentMethod, Reservation } from "@/types";

/** ACADEMIC SIMULATION — no real money is processed and no card data is stored. */
export const paymentService = {
  /**
   * Simulates a payment for a PENDING reservation in one transaction:
   * verifies amount === reservation.totalFare, ensures the transaction ID is unique,
   * writes the payment and (on success) confirms the reservation.
   */
  async processPayment(reservationId: string, method: PaymentMethod, amount: number, simulateFailure: boolean): Promise<Payment> {
    const userId = requireUserId();
    const db = getDb();
    for (let attempt = 0; attempt < 3; attempt++) {
      const txnId = generateTransactionId();
      try {
        return await runTransaction(db, async (tx) => {
          const resRef = ref("reservations", reservationId);
          const snap = await tx.get(resRef);
          if (!snap.exists()) throw new AppError("Reservation not found.");
          const r = snap.data() as Reservation;
          if (r.userId !== userId) throw new AppError("You do not have permission to perform this action.");
          if (r.bookingStatus !== "PENDING") throw new AppError("This reservation is no longer awaiting payment.");
          if (amount !== r.totalFare || amount <= 0) throw new AppError("Payment amount does not match the booking fare.");
          const payRef = ref("payments", txnId);
          if ((await tx.get(payRef)).exists()) throw new Error("TXN_COLLISION");
          const ts = nowISO();
          const success = !simulateFailure;
          const payment: Payment = {
            id: txnId, reservationId, userId, pnr: r.pnr, transactionId: txnId, amount, paymentMethod: method,
            paymentStatus: success ? "SUCCESS" : "FAILED", paymentDate: ts, refundAmount: 0, refundStatus: "NOT_APPLICABLE",
            createdAt: ts, updatedAt: ts,
          };
          tx.set(payRef, payment);
          tx.update(resRef, success
            ? { bookingStatus: "CONFIRMED", paymentStatus: "SUCCESS", paymentId: txnId, updatedAt: ts }
            : { paymentStatus: "FAILED", updatedAt: ts });
          return payment;
        });
      } catch (e) {
        if (e instanceof Error && e.message === "TXN_COLLISION") continue;
        throw e;
      }
    }
    throw new AppError("Payment could not be processed. Please try again.");
  },

  getPaymentsForReservation: async (r: Reservation) =>
    (await listDocs<Payment>("payments", where("reservationId", "==", r.id), where("userId", "==", r.userId))).sort(byCreatedDesc),
  listMine: async () => (await listWhere<Payment>("payments", "userId", requireUserId())).sort(byCreatedDesc),
  listAll: async () => (await listDocs<Payment>("payments")).sort(byCreatedDesc),
};
