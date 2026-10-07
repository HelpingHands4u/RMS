// All numbers are computed from real Firestore documents. Nothing is invented.
import { format } from "date-fns";
import { listDocs } from "./db";
import { CLASS_TYPES, type Cancellation, type Payment, type Reservation, type Route, type Station, type Train } from "@/types";
import { todayISODate } from "@/utils/time";

export interface DashboardStats {
  totalTrains: number;
  totalStations: number;
  activeRoutes: number;
  todaysBookings: number;
  totalBookings: number;
  confirmed: number;
  cancelled: number;
  pending: number;
  revenue: number;
  refunds: number;
  pendingPayments: number;
  bookingsByDate: { date: string; bookings: number; revenue: number }[];
  statusSplit: { name: string; value: number }[];
  popularTrains: { name: string; bookings: number }[];
  popularRoutes: { name: string; bookings: number }[];
  classWise: { classType: string; bookings: number }[];
}

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const [trains, stations, routes, reservations, payments, cancellations] = await Promise.all([
      listDocs<Train>("trains"), listDocs<Station>("stations"), listDocs<Route>("routes"),
      listDocs<Reservation>("reservations"), listDocs<Payment>("payments"), listDocs<Cancellation>("cancellations"),
    ]);
    const today = todayISODate();
    const success = payments.filter((p) => p.paymentStatus === "SUCCESS" || p.paymentStatus === "REFUNDED");
    const refunds = cancellations.reduce((s, c) => s + (c.refundAmount ?? 0), 0);
    const revenue = success.reduce((s, p) => s + p.amount, 0) - refunds;

    const byDate = new Map<string, { bookings: number; revenue: number }>();
    reservations.forEach((r) => {
      const d = format(new Date(r.bookingTime), "yyyy-MM-dd");
      const e = byDate.get(d) ?? { bookings: 0, revenue: 0 };
      e.bookings++;
      if (r.paymentStatus === "SUCCESS") e.revenue += r.totalFare;
      byDate.set(d, e);
    });
    const counted = (keyFn: (r: Reservation) => string) => {
      const m = new Map<string, number>();
      reservations.filter((r) => r.bookingStatus !== "PENDING").forEach((r) => m.set(keyFn(r), (m.get(keyFn(r)) ?? 0) + 1));
      return [...m.entries()].map(([name, bookings]) => ({ name, bookings })).sort((a, b) => b.bookings - a.bookings).slice(0, 6);
    };
    const confirmed = reservations.filter((r) => r.bookingStatus === "CONFIRMED").length;
    const cancelled = reservations.filter((r) => r.bookingStatus === "CANCELLED").length;
    const pending = reservations.filter((r) => r.bookingStatus === "PENDING").length;

    return {
      totalTrains: trains.length,
      totalStations: stations.length,
      activeRoutes: routes.filter((r) => r.status === "ACTIVE").length,
      todaysBookings: reservations.filter((r) => r.bookingTime.startsWith(today)).length,
      totalBookings: reservations.length,
      confirmed, cancelled, pending,
      revenue, refunds,
      pendingPayments: reservations.filter((r) => r.paymentStatus === "PENDING" || r.paymentStatus === "FAILED").filter((r) => r.bookingStatus === "PENDING").length,
      bookingsByDate: [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, v]) => ({ date: format(new Date(date), "dd MMM"), ...v })),
      statusSplit: [
        { name: "Confirmed", value: confirmed },
        { name: "Cancelled", value: cancelled },
        { name: "Pending", value: pending },
      ].filter((s) => s.value > 0),
      popularTrains: counted((r) => `${r.trainNumber} ${r.trainName}`),
      popularRoutes: counted((r) => `${r.sourceName.split(" (")[0]} → ${r.destinationName.split(" (")[0]}`),
      classWise: CLASS_TYPES.map((c) => ({ classType: c, bookings: reservations.filter((r) => r.classType === c && r.bookingStatus !== "PENDING").length })).filter((c) => c.bookings > 0),
    };
  },
};
