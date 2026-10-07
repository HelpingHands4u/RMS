import { makeMasterService } from "./master";
import type { Station } from "@/types";

export const stationService = {
  ...makeMasterService<Station>("stations", "Station", (d) => `${d.stationCode ?? ""} ${d.stationName ?? ""}`.trim()),
  async listActive(): Promise<Station[]> {
    const all = await this.list();
    return all.filter((s) => s.status === "ACTIVE").sort((a, b) => a.stationName.localeCompare(b.stationName));
  },
};
