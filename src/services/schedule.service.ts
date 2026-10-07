import { where } from "firebase/firestore";
import { createDoc, getById, listDocs, listWhere, patchDoc } from "./db";
import { routeService } from "./route.service";
import { auditService } from "./audit.service";
import { AppError } from "@/utils/errors";
import { stopDateTime, todayISODate } from "@/utils/time";
import type { Schedule, Train } from "@/types";

/** Computes origin departure and terminus arrival from the train's active route. */
async function computeTimes(trainId: string, journeyDate: string) {
  const route = await routeService.getActiveRouteForTrain(trainId);
  if (!route) throw new AppError("This train has no active route. Create a route with stops first.");
  const stops = await routeService.getStops(route.id);
  if (stops.length < 2) throw new AppError("The train's route needs at least two stops.");
  const first = stops[0];
  const last = stops[stops.length - 1];
  return {
    departureDateTime: stopDateTime(journeyDate, first.departureTime, first.dayOffset),
    arrivalDateTime: stopDateTime(journeyDate, last.arrivalTime, last.dayOffset),
  };
}

export const scheduleService = {
  list: () => listDocs<Schedule>("schedules"),
  getById: (id: string) => getById<Schedule>("schedules", id),
  listByTrain: (trainId: string) => listWhere<Schedule>("schedules", "trainId", trainId),
  findForTrainOnDate: async (trainId: string, journeyDate: string) =>
    (await listDocs<Schedule>("schedules", where("trainId", "==", trainId), where("journeyDate", "==", journeyDate)))
      .find((s) => s.status === "SCHEDULED") ?? null,

  async create(trainId: string, journeyDate: string): Promise<string> {
    const train = await getById<Train>("trains", trainId);
    if (!train || train.status !== "ACTIVE") throw new AppError("A schedule must belong to a valid, active train.");
    if (journeyDate < todayISODate()) throw new AppError("Journey date cannot be in the past.");
    const dup = await this.findForTrainOnDate(trainId, journeyDate);
    if (dup) throw new AppError("This train is already scheduled on that date.");
    const times = await computeTimes(trainId, journeyDate);
    const id = await createDoc("schedules", { trainId, journeyDate, ...times, status: "SCHEDULED" });
    await auditService.log("SCHEDULE_CREATED", "Schedule", id, `Scheduled ${train.trainNumber} on ${journeyDate}`);
    return id;
  },

  async update(id: string, journeyDate: string, status: Schedule["status"]): Promise<void> {
    const s = await getById<Schedule>("schedules", id);
    if (!s) throw new AppError("Schedule not found.");
    const times = journeyDate !== s.journeyDate ? await computeTimes(s.trainId, journeyDate) : {};
    await patchDoc("schedules", id, { journeyDate, status, ...times });
    await auditService.log("SCHEDULE_UPDATED", "Schedule", id, `Updated schedule ${id} (${status})`);
  },

  async cancel(id: string): Promise<void> {
    await patchDoc("schedules", id, { status: "CANCELLED" });
    await auditService.log("SCHEDULE_CANCELLED", "Schedule", id, `Cancelled schedule ${id}`);
  },
};
