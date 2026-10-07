import { doc, where, writeBatch } from "firebase/firestore";
import { getDb } from "@/firebase/config";
import { col, listDocs, listWhere } from "./db";
import { makeMasterService } from "./master";
import { auditService } from "./audit.service";
import { nowISO } from "@/utils/ids";
import { AppError } from "@/utils/errors";
import type { ClassType, Coach, Seat, SeatLock, SeatType } from "@/types";

const base = makeMasterService<Seat>("seats", "Seat", (d) => `${d.coachNumber ?? ""}-${d.seatNumber ?? ""}`);

/** Berth/seat pattern used when auto-generating seats for a coach. */
export function seatTypeFor(classType: ClassType, seatNumber: number): SeatType {
  const i = (seatNumber - 1);
  if (classType === "CC" || classType === "2S") return (["WINDOW", "AISLE", "AISLE", "WINDOW"] as SeatType[])[i % 4];
  if (classType === "1A" || classType === "2A") return (["LOWER", "UPPER", "LOWER", "UPPER", "SIDE_LOWER", "SIDE_UPPER"] as SeatType[])[i % 6];
  return (["LOWER", "MIDDLE", "UPPER", "LOWER", "MIDDLE", "UPPER", "SIDE_LOWER", "SIDE_UPPER"] as SeatType[])[i % 8];
}

export const seatService = {
  ...base,
  listByCoach: async (coachId: string) => (await listWhere<Seat>("seats", "coachId", coachId)).sort((a, b) => a.seatNumber - b.seatNumber),

  /** Active seats of one class on one train. */
  async listByTrainAndClass(trainId: string, classType: ClassType): Promise<Seat[]> {
    const seats = await listDocs<Seat>("seats", where("trainId", "==", trainId), where("classType", "==", classType));
    return seats.filter((s) => s.status === "ACTIVE");
  },

  /** Seat IDs currently held/confirmed for a schedule (from seatLocks — real reservations). */
  async occupiedSeatIds(scheduleId: string): Promise<Set<string>> {
    const locks = await listWhere<SeatLock>("seatLocks", "scheduleId", scheduleId);
    return new Set(locks.map((l) => l.seatId));
  },

  /** Creates seats 1..seatCapacity that don't exist yet for a coach. */
  async generateForCoach(coach: Coach): Promise<number> {
    if (coach.status !== "ACTIVE") throw new AppError("Seats can only be generated for an active coach.");
    const existing = new Set((await listWhere<Seat>("seats", "coachId", coach.id)).map((s) => s.seatNumber));
    const batch = writeBatch(getDb());
    const ts = nowISO();
    let created = 0;
    for (let n = 1; n <= coach.seatCapacity; n++) {
      if (existing.has(n)) continue;
      const r = doc(col("seats"));
      batch.set(r, {
        id: r.id, coachId: coach.id, trainId: coach.trainId, coachNumber: coach.coachNumber, seatNumber: n,
        seatType: seatTypeFor(coach.classType, n), classType: coach.classType, status: "ACTIVE", createdAt: ts, updatedAt: ts,
      } satisfies Seat);
      created++;
    }
    if (created) await batch.commit();
    await auditService.log("SEATS_GENERATED", "Coach", coach.id, `Generated ${created} seats for coach ${coach.coachNumber}`);
    return created;
  },
};
