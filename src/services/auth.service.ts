// Authentication service — the ONLY module that talks to Firebase Authentication.
// The rest of the app uses useAuth() from AuthContext.
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile, setPersistence, browserLocalPersistence,
  type User as FirebaseUser,
} from "firebase/auth";
import { setDoc } from "firebase/firestore";
import { getFirebaseAuth } from "@/firebase/config";
import { ref } from "./db";
import { nowISO } from "@/utils/ids";
import type { AppUser } from "@/types";

export type AuthUser = Pick<FirebaseUser, "uid" | "email" | "displayName">;

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

let persistenceSet = false;
async function ensurePersistence() {
  if (persistenceSet) return;
  await setPersistence(getFirebaseAuth(), browserLocalPersistence);
  persistenceSet = true;
}

export const authService = {
  /** Creates the Auth account and the users/{uid} profile. Role is ALWAYS PASSENGER;
   *  Firestore rules reject any other role from the client. */
  async register(input: RegisterInput): Promise<void> {
    await ensurePersistence();
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), input.email, input.password);
    await updateProfile(cred.user, { displayName: input.name });
    const ts = nowISO();
    const profile: AppUser = {
      id: cred.user.uid, name: input.name, email: input.email, phone: input.phone,
      role: "PASSENGER", status: "ACTIVE", createdAt: ts, updatedAt: ts,
    };
    await setDoc(ref("users", cred.user.uid), profile);
  },

  async login(email: string, password: string): Promise<void> {
    await ensurePersistence();
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  },

  async logout(): Promise<void> {
    await signOut(getFirebaseAuth());
  },

  onAuthChange(cb: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(getFirebaseAuth(), (u) => cb(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null));
  },

  currentUserId(): string | null {
    return getFirebaseAuth().currentUser?.uid ?? null;
  },
};

export function requireUserId(): string {
  const uid = authService.currentUserId();
  if (!uid) throw Object.assign(new Error("unauthenticated"), { code: "unauthenticated" });
  return uid;
}
