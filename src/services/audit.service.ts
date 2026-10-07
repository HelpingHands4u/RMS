import { addDoc, updateDoc, limit, orderBy } from "firebase/firestore";
import { col, listDocs } from "./db";
import { authService } from "./auth.service";
import { nowISO } from "@/utils/ids";
import type { AuditLog } from "@/types";

export const auditService = {
  /** Records an important operation. Failure to log never breaks the main operation. */
  async log(action: string, entity: string, entityId: string, description: string): Promise<void> {
    const userId = authService.currentUserId();
    if (!userId) return;
    try {
      const r = await addDoc(col("auditLogs"), { userId, action, entity, entityId, description, createdAt: nowISO() });
      await updateDoc(r, { id: r.id });
    } catch {
      /* audit logging is best-effort */
    }
  },
  recent: (n = 20) => listDocs<AuditLog>("auditLogs", orderBy("createdAt", "desc"), limit(n)),
};
