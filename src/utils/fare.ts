import type { ClassType } from "@/types";

/**
 * ACADEMIC FARE MODEL — NOT official railway pricing.
 * fare = round(distanceKm × classRate) + SERVICE_CHARGE, with a minimum fare.
 */
export const CLASS_RATES: Record<ClassType, number> = {
  "1A": 2.5,
  "2A": 1.8,
  "3A": 1.3,
  SL: 0.8,
  CC: 1.1,
  "2S": 0.5,
};

export const CLASS_LABELS: Record<ClassType, string> = {
  "1A": "First AC",
  "2A": "AC 2 Tier",
  "3A": "AC 3 Tier",
  SL: "Sleeper",
  CC: "AC Chair Car",
  "2S": "Second Sitting",
};

export const SERVICE_CHARGE = 30;
export const MINIMUM_FARE = 60;

export function calculateFare(distanceKm: number, classType: ClassType): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) throw new Error("Invalid distance for fare.");
  const fare = Math.round(distanceKm * CLASS_RATES[classType]) + SERVICE_CHARGE;
  return Math.max(fare, MINIMUM_FARE);
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}
