import { getById, listWhere } from "./db";
import { makeMasterService } from "./master";
import { scheduleService } from "./schedule.service";
import { coachService } from "./coach.service";
import { seatService } from "./seat.service";
import { AppError } from "@/utils/errors";
import { calculateFare } from "@/utils/fare";
import { stopDateTime, minutesBetween, todayISODate } from "@/utils/time";
import type { ClassType, Route, SearchResult, Station, Train, TrainRoute } from "@/types";

const base = makeMasterService<Train>("trains", "Train", (d) => `${d.trainNumber ?? ""} ${d.trainName ?? ""}`.trim());

export interface SearchParams {
  sourceStationId: string;
  destinationStationId: string;
  journeyDate: string; // yyyy-MM-dd
  classType: ClassType;
}

export interface JourneySegment {
  route: Route;
  from: TrainRoute;
  to: TrainRoute;
  distanceKm: number;
}

/** Finds the active route segment of a train between two stations (source must come first). */
export async function findSegment(trainId: string, sourceStationId: string, destinationStationId: string): Promise<JourneySegment | null> {
  const routes = (await listWhere<Route>("routes", "trainId", trainId)).filter((r) => r.status === "ACTIVE");
  for (const route of routes) {
    const stops = await listWhere<TrainRoute>("trainRoutes", "routeId", route.id);
    const from = stops.find((s) => s.stationId === sourceStationId);
    const to = stops.find((s) => s.stationId === destinationStationId);
    if (from && to && from.sequenceNumber < to.sequenceNumber) {
      return { route, from, to, distanceKm: to.distanceKm - from.distanceKm };
    }
  }
  return null;
}

export const trainService = {
  ...base,

  /**
   * Database-driven search:
   * 1. trainRoutes at source and at destination
   * 2. same route, source.sequenceNumber < destination.sequenceNumber
   * 3. active route + active train
   * 4. SCHEDULED schedule on the journey date
   * 5. active seats of the requested class minus seatLocks for that schedule
   * 6. fare = distance × class rate + service charge
   */
  async searchTrains(p: SearchParams): Promise<SearchResult[]> {
    if (!p.sourceStationId || !p.destinationStationId) throw new AppError("Select both source and destination.");
    if (p.sourceStationId === p.destinationStationId) throw new AppError("Source and destination cannot be the same.");
    if (!p.journeyDate || p.journeyDate < todayISODate()) throw new AppError("Choose a valid journey date (today or later).");

    const [source, destination] = await Promise.all([
      getById<Station>("stations", p.sourceStationId),
      getById<Station>("stations", p.destinationStationId),
    ]);
    if (!source || !destination) throw new AppError("Selected station was not found.");

    const [atSource, atDest] = await Promise.all([
      listWhere<TrainRoute>("trainRoutes", "stationId", p.sourceStationId),
      listWhere<TrainRoute>("trainRoutes", "stationId", p.destinationStationId),
    ]);
    const destByRoute = new Map(atDest.map((d) => [d.routeId, d]));
    const candidates = atSource
      .map((s) => ({ from: s, to: destByRoute.get(s.routeId) }))
      .filter((c): c is { from: TrainRoute; to: TrainRoute } => !!c.to && c.from.sequenceNumber < c.to.sequenceNumber);

    const results: SearchResult[] = [];
    for (const { from, to } of candidates) {
      const [route, train] = await Promise.all([getById<Route>("routes", from.routeId), getById<Train>("trains", from.trainId)]);
      if (!route || route.status !== "ACTIVE" || !train || train.status !== "ACTIVE") continue;
      const schedule = await scheduleService.findForTrainOnDate(train.id, p.journeyDate);
      if (!schedule) continue;

      const coaches = (await coachService.listByTrain(train.id)).filter((c) => c.status === "ACTIVE" && c.classType === p.classType);
      if (!coaches.length) continue;
      const coachIds = new Set(coaches.map((c) => c.id));
      const seats = (await seatService.listByTrainAndClass(train.id, p.classType)).filter((s) => coachIds.has(s.coachId));
      const occupied = await seatService.occupiedSeatIds(schedule.id);
      const available = seats.filter((s) => !occupied.has(s.id)).length;

      const departure = stopDateTime(schedule.journeyDate, from.departureTime, from.dayOffset);
      const arrival = stopDateTime(schedule.journeyDate, to.arrivalTime, to.dayOffset);
      const distanceKm = to.distanceKm - from.distanceKm;
      results.push({
        scheduleId: schedule.id, train, source, destination,
        departureDateTime: departure, arrivalDateTime: arrival, durationMinutes: minutesBetween(departure, arrival),
        distanceKm, classType: p.classType, totalSeats: seats.length, availableSeats: available,
        farePerPassenger: calculateFare(distanceKm, p.classType), coaches,
      });
    }
    return results.sort((a, b) => a.departureDateTime.localeCompare(b.departureDateTime));
  },
};
