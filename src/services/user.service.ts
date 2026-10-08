import { setDoc } from "firebase/firestore";
import { getById, listDocs, patchDoc, ref, byCreatedDesc } from "./db";
import { nowISO } from "@/utils/ids";
import type { AppUser } from "@/types";

export const userService = {
  getUser: (uid: string) => getById<AppUser>("users", uid),

  /** Creates a missing profile (e.g. user created in Firebase console). Always PASSENGER. */
  async ensureProfile(uid: string, email: string, name: string): Promise<AppUser> {
    console.log("🔍 Checking Firestore user profile:", uid);

    let existing: AppUser | null = null;

    try {
      existing = await getById<AppUser>("users", uid);
      console.log("✅ Firestore READ successful:", existing);
    } catch (error) {
      console.error("❌ Firestore READ failed:", error);
      throw error;
    }

    if (existing) {
      return existing;
    }

    console.log("🆕 User profile doesn't exist. Creating:", uid);

    const ts = nowISO();

    const profile: AppUser = {
      id: uid,
      name: name || email.split("@")[0],
      email,
      phone: "",
      role: "PASSENGER",
      status: "ACTIVE",
      createdAt: ts,
      updatedAt: ts,
    };

    try {
      await setDoc(ref("users", uid), profile);
      console.log("✅ Firestore CREATE successful:", uid);
    } catch (error) {
      console.error("❌ Firestore CREATE failed:", error);
      throw error;
    }

    return profile;
  },

  /** Users may only edit name & phone. Email is managed by Authentication; role by admins. */
  updateProfile: (uid: string, data: { name: string; phone: string }) =>
    patchDoc("users", uid, data),

  listUsers: async () =>
    (await listDocs<AppUser>("users")).sort(byCreatedDesc),
};