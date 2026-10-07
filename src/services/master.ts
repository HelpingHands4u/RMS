// Factory for railway master-data services (trains, stations, routes, coaches, seats).
// Each gets list / get / create / update / deactivate with audit logging.
import { createDoc, getById, listDocs, patchDoc, type CollectionName } from "./db";
import { auditService } from "./audit.service";
import type { BaseDoc } from "@/types";

export function makeMasterService<T extends BaseDoc & { status: string }>(
  collectionName: CollectionName,
  entity: string,
  describe: (d: Partial<T>) => string,
) {
  const upper = entity.toUpperCase();
  return {
    list: () => listDocs<T>(collectionName),
    getById: (id: string) => getById<T>(collectionName, id),
    async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<string> {
      const id = await createDoc(collectionName, data);
      await auditService.log(`${upper}_CREATED`, entity, id, `Created ${entity.toLowerCase()} ${describe(data as Partial<T>)}`);
      return id;
    },
    async update(id: string, data: Partial<Omit<T, "id" | "createdAt">>): Promise<void> {
      await patchDoc(collectionName, id, data);
      await auditService.log(`${upper}_UPDATED`, entity, id, `Updated ${entity.toLowerCase()} ${describe(data as Partial<T>)}`);
    },
    async deactivate(id: string): Promise<void> {
      await patchDoc(collectionName, id, { status: "INACTIVE" });
      await auditService.log(`${upper}_DEACTIVATED`, entity, id, `Deactivated ${entity.toLowerCase()} ${id}`);
    },
    async activate(id: string): Promise<void> {
      await patchDoc(collectionName, id, { status: "ACTIVE" });
      await auditService.log(`${upper}_UPDATED`, entity, id, `Re-activated ${entity.toLowerCase()} ${id}`);
    },
  };
}
