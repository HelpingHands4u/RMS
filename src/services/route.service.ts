import { doc, writeBatch } from "firebase/firestore";
import { getDb } from "@/firebase/config";
import { col, listWhere, ref } from "./db";
import { makeMasterService } from "./master";
import { auditService } from "./audit.service";
import { AppError } from "@/utils/errors";
import type { Route, TrainRoute } from "@/types";

const base = makeMasterService<Route>("routes", "Route", (d) => d.routeName ?? "");

export type StopInput = Omit<TrainRoute, "id" | "routeId" | "trainId">;

export const routeService = {
  ...base,

  listByTrain: (trainId: string) => listWhere<Route>("routes", "trainId", trainId),

  /** The train's active route (a train runs on one active route at a time). */
  async getActiveRouteForTrain(trainId: string): Promise<Route | null> {
    const routes = await listWhere<Route>("routes", "trainId", trainId);
    return routes.find((r) => r.status === "ACTIVE") ?? null;
  },

  /** Stops of a route ordered by sequenceNumber. */
  async getStops(routeId: string): Promise<TrainRoute[]> {
    const stops = await listWhere<TrainRoute>("trainRoutes", "routeId", routeId);
    return stops.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  },

  /** Replaces all stops of a route atomically after validating order & distances. */
  async saveStops(route: Route, stops: StopInput[]): Promise<void> {
    if (stops.length < 2) throw new AppError("A route needs at least two stations.");
    const sorted = [...stops].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    const ids = new Set<string>();
    sorted.forEach((s, i) => {
      if (!s.stationId) throw new AppError(`Stop ${i + 1}: select a station.`);
      if (ids.has(s.stationId)) throw new AppError("A station can appear only once on a route.");
      ids.add(s.stationId);
      if (i > 0 && s.distanceKm <= sorted[i - 1].distanceKm) throw new AppError("Distance must increase along the route.");
      if (i > 0 && s.dayOffset < sorted[i - 1].dayOffset) throw new AppError("Day offset cannot decrease along the route.");
    });
    if (sorted[0].distanceKm !== 0) throw new AppError("The first station must have distance 0 km.");

    const existing = await listWhere<TrainRoute>("trainRoutes", "routeId", route.id);
    const batch = writeBatch(getDb());
    existing.forEach((e) => batch.delete(ref("trainRoutes", e.id)));
    sorted.forEach((s, i) => {
      const r = doc(col("trainRoutes"));
      batch.set(r, { ...s, sequenceNumber: i + 1, id: r.id, routeId: route.id, trainId: route.trainId });
    });
    await batch.commit();
    await auditService.log("ROUTE_UPDATED", "Route", route.id, `Saved ${sorted.length} stops for ${route.routeName}`);
  },
};
