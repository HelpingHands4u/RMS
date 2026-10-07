import { doc, runTransaction, where } from "firebase/firestore";
import { getDb } from "@/firebase/config";
import { col, getById, listDocs, listWhere, ref, byCreatedDesc } from "./db";
import { requireUserId } from "./auth.service";
import { findSegment } from "./train.service";
import { seatService } from "./seat.service";
import { AppError } from "@/utils/errors";
import { calculateFare } from "@/utils/fare";
import { generatePNR, nowISO } from "@/utils/ids";
import { ageFromDOB, stopDateTime } from "@/utils/time";
import type {
  ClassType, Coach, Passenger, Reservation, ReservationPassenger, Schedule, Seat, SeatLock, Station, Train,
} from "@/types";

export const MAX_PASSENGERS = 6;
export const seatLockId = (scheduleId: string, seatId: string) => `${scheduleId}_${seatId}`;

export interface BookingRequest {
  scheduleId: string;
  sourceStationId: string;
  destinationStationId: string;
  classType: ClassType;
  items: { passengerId: string; seatId: string }[];
}

export interface SeatMapCoach {
  coach: Coach;
  seats: (Seat & { occupied: boolean })[];
}

export const reservationService = {
  generatePNR,

  /** Seat map for one class on one schedule; occupancy comes from seatLocks (real bookings). */
  async checkSeatAvailability(scheduleId: string, trainId: string, classType: ClassType): Promise<SeatMapCoach[]> {
    const [coaches, seats, occupied] = await Promise.all([
      listDocs<Coach>("coaches", where("trainId", "==", trainId), where("classType", "==", classType)),
      seatService.listByTrainAndClass(trainId, classType),
      seatService.occupiedSeatIds(scheduleId),
    ]);
    return coaches
      .filter((c) => c.status === "ACTIVE")
      .sort((a, b) => a.coachNumber.localeCompare(b.coachNumber))
      .map((coach) => ({
        coach,
        seats: seats.filter((s) => s.coachId === coach.id).sort((a, b) => a.seatNumber - b.seatNumber).map((s) => ({ ...s, occupied: occupied.has(s.id) })),
      }));
  },

  /**
   * Creates a PENDING reservation inside one Firestore transaction:
   * re-reads every seat lock (rejects if any seat is taken), verifies the PNR is unused,
   * then writes reservation + reservationPassengers + seatLocks together (all-or-nothing).
   * The booking becomes CONFIRMED only after successful simulated payment.
   */
  async createReservation(req: BookingRequest): Promise<Reservation> {
    const userId = requireUserId();
    if (!req.items.length) throw new AppError("Add at least one passenger.");
    if (req.items.length > MAX_PASSENGERS) throw new AppError(`A maximum of ${MAX_PASSENGERS} passengers can be booked per ticket.`);
    if (new Set(req.items.map((i) => i.seatId)).size !== req.items.length) throw new AppError("Each passenger needs a different seat.");
    if (new Set(req.items.map((i) => i.passengerId)).size !== req.items.length) throw new AppError("A passenger can only be added once.");

    const schedule = await getById<Schedule>("schedules", req.scheduleId);
    if (!schedule || schedule.status !== "SCHEDULED") throw new AppError("This schedule is not available for booking.");
    const train = await getById<Train>("trains", schedule.trainId);
    if (!train || train.status !== "ACTIVE") throw new AppError("This train is not available for booking.");
    const segment = await findSegment(train.id, req.sourceStationId, req.destinationStationId);
    if (!segment) throw new AppError("This train does not run from the selected source to destination.");
    const departure = stopDateTime(schedule.journeyDate, segment.from.departureTime, segment.from.dayOffset);
    const arrival = stopDateTime(schedule.journeyDate, segment.to.arrivalTime, segment.to.dayOffset);
    if (new Date(departure) <= new Date()) throw new AppError("This train has already departed.");
    const [source, destination] = await Promise.all([
      getById<Station>("stations", req.sourceStationId), getById<Station>("stations", req.destinationStationId),
    ]);
    if (!source || !destination) throw new AppError("Station not found.");

    const fare = calculateFare(segment.distanceKm, req.classType);
    const seats: Seat[] = [];
    const passengers: Passenger[] = [];
    for (const item of req.items) {
      const seat = await getById<Seat>("seats", item.seatId);
      if (!seat || seat.status !== "ACTIVE" || seat.trainId !== train.id || seat.classType !== req.classType) throw new AppError("Invalid seat selected.");
      const coach = await getById<Coach>("coaches", seat.coachId);
      if (!coach || coach.status !== "ACTIVE" || coach.trainId !== train.id) throw new AppError("Invalid coach for selected seat.");
      const p = await getById<Passenger>("passengers", item.passengerId);
      if (!p || p.userId !== userId || p.status !== "ACTIVE") throw new AppError("Invalid passenger selected.");
      const age = ageFromDOB(p.dateOfBirth);
      if (age < 0 || age > 120) throw new AppError(`Invalid age for ${p.fullName}.`);
      seats.push(seat);
      passengers.push(p);
    }

    const db = getDb();
    for (let attempt = 0; attempt < 3; attempt++) {
      const pnr = generatePNR();
      try {
        return await runTransaction(db, async (tx) => {
          const resRef = ref("reservations", pnr);
          if ((await tx.get(resRef)).exists()) throw new Error("PNR_COLLISION");
          const lockRefs = seats.map((s) => ref("seatLocks", seatLockId(schedule.id, s.id)));
          for (const lr of lockRefs) {
            if ((await tx.get(lr)).exists()) throw new AppError("Selected seat is no longer available. Please choose another seat.");
          }
          const ts = nowISO();
          const reservation: Reservation = {
            id: pnr, pnr, userId, scheduleId: schedule.id, trainId: train.id, trainNumber: train.trainNumber, trainName: train.trainName,
            sourceStationId: source.id, destinationStationId: destination.id,
            sourceName: `${source.stationName} (${source.stationCode})`, destinationName: `${destination.stationName} (${destination.stationCode})`,
            departureDateTime: departure, arrivalDateTime: arrival, journeyDate: schedule.journeyDate, classType: req.classType,
            passengerCount: seats.length, seatLabels: seats.map((s) => `${s.coachNumber}-${s.seatNumber}`),
            seatLockIds: lockRefs.map((r) => r.id), totalFare: fare * seats.length,
            bookingStatus: "PENDING", paymentStatus: "PENDING", bookingTime: ts, createdAt: ts, updatedAt: ts,
          };
          tx.set(resRef, reservation);
          seats.forEach((seat, i) => {
            const p = passengers[i];
            const rpRef = doc(col("reservationPassengers"));
            const rp: ReservationPassenger = {
              id: rpRef.id, reservationId: pnr, userId, passengerId: p.id, seatId: seat.id, coachId: seat.coachId,
              coachNumber: seat.coachNumber, seatNumber: seat.seatNumber, classType: seat.classType,
              passengerNameSnapshot: p.fullName, ageSnapshot: ageFromDOB(p.dateOfBirth), genderSnapshot: p.gender,
              fare, status: "CONFIRMED", createdAt: ts,
            };
            tx.set(rpRef, rp);
            const lock: SeatLock = { id: lockRefs[i].id, scheduleId: schedule.id, seatId: seat.id, reservationId: pnr, userId, createdAt: ts };
            tx.set(lockRefs[i], lock);
          });
          return reservation;
        });
      } catch (e) {
        if (e instanceof Error && e.message === "PNR_COLLISION") continue;
        throw e;
      }
    }
    throw new AppError("Booking could not be completed. Please try again.");
  },

  /** Reservation document ID is the PNR. */
  getReservationByPNR: (pnr: string) => getById<Reservation>("reservations", pnr),
  getReservationById: (id: string) => getById<Reservation>("reservations", id),

  async getUserReservations(): Promise<Reservation[]> {
    return (await listWhere<Reservation>("reservations", "userId", requireUserId())).sort(byCreatedDesc);
  },
  listAll: async () => (await listDocs<Reservation>("reservations")).sort(byCreatedDesc),

  /** Ticket passengers. Owners query with their userId so security rules can verify ownership. */
  async getPassengers(reservation: Reservation, asAdmin = false): Promise<ReservationPassenger[]> {
    const constraints = [where("reservationId", "==", reservation.id)];
    if (!asAdmin) constraints.push(where("userId", "==", reservation.userId));
    return (await listDocs<ReservationPassenger>("reservationPassengers", ...constraints)).sort((a, b) => a.seatNumber - b.seatNumber);
  },
};
