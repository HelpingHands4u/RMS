import { deleteDoc, where } from "firebase/firestore";
import { z } from "zod";
import { createDoc, listDocs, listWhere, patchDoc, ref, byCreatedDesc } from "./db";
import { requireUserId } from "./auth.service";
import { AppError } from "@/utils/errors";
import { ageFromDOB } from "@/utils/time";
import type { Passenger, ReservationPassenger } from "@/types";

export const passengerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  dateOfBirth: z.string().min(1, "Date of birth is required").refine((v) => {
    const age = ageFromDOB(v);
    return !Number.isNaN(age) && age >= 0 && age <= 120 && new Date(v) <= new Date();
  }, "Enter a valid date of birth"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { errorMap: () => ({ message: "Select a gender" }) }),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email("Enter a valid email").max(120).or(z.literal("")),
  idType: z.enum(["AADHAAR", "PAN", "PASSPORT", "VOTER_ID", "DRIVING_LICENCE", "STUDENT_ID"]),
  idNumber: z.string().trim().min(4, "ID number is required").max(20).regex(/^[A-Za-z0-9-]+$/, "Letters, digits and - only"),
});
export type PassengerInput = z.infer<typeof passengerSchema>;

export const passengerService = {
  /** Current user's active passenger profiles. */
  async listMine(): Promise<Passenger[]> {
    const uid = requireUserId();
    return (await listWhere<Passenger>("passengers", "userId", uid)).filter((p) => p.status === "ACTIVE").sort(byCreatedDesc);
  },
  listAll: async () => (await listDocs<Passenger>("passengers")).sort(byCreatedDesc),

  async create(input: PassengerInput): Promise<string> {
    const data = passengerSchema.parse(input);
    return createDoc("passengers", { ...data, userId: requireUserId(), status: "ACTIVE" });
  },
  async update(id: string, input: PassengerInput): Promise<void> {
    await patchDoc("passengers", id, passengerSchema.parse(input));
  },
  /** Hard delete when never used in a booking; otherwise deactivate (ticket history keeps snapshots). */
  async remove(id: string): Promise<"deleted" | "deactivated"> {
    const uid = requireUserId();
    const used = await listDocs<ReservationPassenger>("reservationPassengers", where("userId", "==", uid), where("passengerId", "==", id));
    if (used.length) {
      await patchDoc("passengers", id, { status: "INACTIVE" });
      return "deactivated";
    }
    try {
      await deleteDoc(ref("passengers", id));
    } catch {
      throw new AppError("Unable to delete passenger.");
    }
    return "deleted";
  },
};
