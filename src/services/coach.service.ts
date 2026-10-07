import { listWhere } from "./db";
import { makeMasterService } from "./master";
import type { Coach } from "@/types";

const base = makeMasterService<Coach>("coaches", "Coach", (d) => `${d.coachNumber ?? ""} (${d.classType ?? ""})`);

export const coachService = {
  ...base,
  listByTrain: (trainId: string) => listWhere<Coach>("coaches", "trainId", trainId),
};
