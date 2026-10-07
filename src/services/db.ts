// Small shared Firestore helpers used by every service module.
import {
  collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc,
  type QueryConstraint, type DocumentData,
} from "firebase/firestore";
import { getDb } from "@/firebase/config";
import { nowISO } from "@/utils/ids";

export const COLLECTIONS = {
  users: "users",
  passengers: "passengers",
  trains: "trains",
  stations: "stations",
  routes: "routes",
  trainRoutes: "trainRoutes",
  schedules: "schedules",
  coaches: "coaches",
  seats: "seats",
  seatLocks: "seatLocks",
  reservations: "reservations",
  reservationPassengers: "reservationPassengers",
  payments: "payments",
  cancellations: "cancellations",
  auditLogs: "auditLogs",
} as const;
export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const col = (name: CollectionName) => collection(getDb(), name);
export const ref = (name: CollectionName, id: string) => doc(getDb(), name, id);

export async function listDocs<T>(name: CollectionName, ...constraints: QueryConstraint[]): Promise<T[]> {
  const snap = await getDocs(constraints.length ? query(col(name), ...constraints) : col(name));
  return snap.docs.map((d) => ({ ...(d.data() as DocumentData), id: d.id }) as T);
}

export async function getById<T>(name: CollectionName, id: string): Promise<T | null> {
  const snap = await getDoc(ref(name, id));
  return snap.exists() ? ({ ...(snap.data() as DocumentData), id: snap.id } as T) : null;
}

export async function listWhere<T>(name: CollectionName, field: string, value: unknown): Promise<T[]> {
  return listDocs<T>(name, where(field, "==", value));
}

export async function createDoc<T extends object>(name: CollectionName, data: T): Promise<string> {
  const ts = nowISO();
  const r = await addDoc(col(name), { ...data, createdAt: ts, updatedAt: ts });
  await updateDoc(r, { id: r.id });
  return r.id;
}

export async function patchDoc(name: CollectionName, id: string, data: object): Promise<void> {
  await updateDoc(ref(name, id), { ...data, updatedAt: nowISO() });
}

export const byCreatedDesc = <T extends { createdAt?: string }>(a: T, b: T) =>
  (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
