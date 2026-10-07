import { setDoc } from "firebase/firestore";
import { getById, listDocs, patchDoc, ref, byCreatedDesc } from "./db";
import { nowISO } from "@/utils/ids";
import type { AppUser } from "@/types";

export const userService = {
  getUser: (uid: string) => getById<AppUser>("users", uid),

  /** Creates a missing profile (e.g. user created in Firebase console). Always PASSENGER. */
  async ensureProfile(uid: string, email: string, name: string): Promise<AppUser> {
    const existing = await getById<AppUser>("users", uid);
    if (existing) return existing;
    const ts = nowISO();
    const profile: AppUser = { id: uid, name: name || email.split("@")[0], email, phone: "", role: "PASSENGER", status: "ACTIVE", createdAt: ts, updatedAt: ts };
    await setDoc(ref("users", uid), profile);
    return profile;
  },

  /** Users may only edit name & phone. Email is managed by Authentication; role by admins. */
  updateProfile: (uid: string, data: { name: string; phone: string }) => patchDoc("users", uid, data),

  listUsers: async () => (await listDocs<AppUser>("users")).sort(byCreatedDesc),
};
