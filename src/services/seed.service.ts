// Loads DEMO / ACADEMIC data into Firestore. Admin-only (enforced by security rules).
import { doc, writeBatch, type WriteBatch } from "firebase/firestore";
import { addDays, format } from "date-fns";
import { getDb } from "@/firebase/config";
import { col, listDocs } from "./db";
import { auditService } from "./audit.service";
import { seatTypeFor } from "./seat.service";
import { COACH_PREFIX, DEMO_SCHEDULE_DAYS, DEMO_SEATS_PER_COACH, DEMO_STATIONS, DEMO_TRAINS } from "@/data/seed";
import { nowISO } from "@/utils/ids";
import { stopDateTime } from "@/utils/time";
import type { Station, Train } from "@/types";

class BatchWriter {
  private batch: WriteBatch = writeBatch(getDb());
  private count = 0;
  total = 0;
  async set(name: Parameters<typeof col>[0], data: Record<string, unknown>): Promise<string> {
    const r = doc(col(name));
    this.batch.set(r, { ...data, id: r.id });
    this.count++;
    this.total++;
    if (this.count >= 400) await this.flush();
    return r.id;
  }
  async flush() {
    if (!this.count) return;
    await this.batch.commit();
    this.batch = writeBatch(getDb());
    this.count = 0;
  }
}

export const seedService = {
  /** Idempotent: skips stations/trains whose code/number already exists. */
  async loadDemoData(): Promise<{ written: number }> {
    const ts = nowISO();
    const w = new BatchWriter();
    const existingStations = await listDocs<Station>("stations");
    const stationIds = new Map(existingStations.map((s) => [s.stationCode, s.id]));
    for (const s of DEMO_STATIONS) {
      if (stationIds.has(s.stationCode)) continue;
      stationIds.set(s.stationCode, await w.set("stations", { ...s, status: "ACTIVE", createdAt: ts, updatedAt: ts }));
    }
    const existingTrains = new Set((await listDocs<Train>("trains")).map((t) => t.trainNumber));
    for (const t of DEMO_TRAINS) {
      if (existingTrains.has(t.trainNumber)) continue;
      const trainId = await w.set("trains", { trainNumber: t.trainNumber, trainName: t.trainName, trainType: t.trainType, operator: "RailReserve Demo Railways", status: "ACTIVE", createdAt: ts, updatedAt: ts });
      const routeId = await w.set("routes", { trainId, routeName: t.routeName, status: "ACTIVE", createdAt: ts, updatedAt: ts });
      for (let i = 0; i < t.stops.length; i++) {
        const [code, arr, dep, km, day] = t.stops[i];
        await w.set("trainRoutes", { routeId, trainId, stationId: stationIds.get(code)!, sequenceNumber: i + 1, arrivalTime: arr, departureTime: dep, distanceKm: km, dayOffset: day });
      }
      for (const [classType, n] of t.coaches) {
        for (let c = 1; c <= n; c++) {
          const coachNumber = `${COACH_PREFIX[classType]}${c}`;
          const coachId = await w.set("coaches", { trainId, coachNumber, classType, seatCapacity: DEMO_SEATS_PER_COACH, status: "ACTIVE", createdAt: ts, updatedAt: ts });
          for (let s = 1; s <= DEMO_SEATS_PER_COACH; s++) {
            await w.set("seats", { coachId, trainId, coachNumber, seatNumber: s, seatType: seatTypeFor(classType, s), classType, status: "ACTIVE", createdAt: ts, updatedAt: ts });
          }
        }
      }
      const first = t.stops[0];
      const last = t.stops[t.stops.length - 1];
      for (let d = 0; d < DEMO_SCHEDULE_DAYS; d++) {
        const journeyDate = format(addDays(new Date(), d), "yyyy-MM-dd");
        await w.set("schedules", {
          trainId, journeyDate,
          departureDateTime: stopDateTime(journeyDate, first[2], first[4]),
          arrivalDateTime: stopDateTime(journeyDate, last[1], last[4]),
          status: "SCHEDULED", createdAt: ts, updatedAt: ts,
        });
      }
    }
    await w.flush();
    await auditService.log("DEMO_DATA_LOADED", "System", "seed", `Loaded ${w.total} demo documents`);
    return { written: w.total };
  },
};
