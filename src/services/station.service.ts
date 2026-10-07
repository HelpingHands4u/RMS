import { makeMasterService } from "./master";
import type { Station } from "@/types";

const base = makeMasterService<Station>("stations", "Station", (d) => `${d.stationCode ?? ""} ${d.stationName ?? ""}`.trim());

export const stationService = {
  ...base,
  async listActive(): Promise<Station[]> {
    const all = await base.list();
    return all.filter((s) => s.status === "ACTIVE").sort((a, b) => a.stationName.localeCompare(b.stationName));
  },
};
