import { addDays, format, parse, differenceInMinutes } from "date-fns";

/** Combines a schedule's origin date with a stop time ("HH:mm") and day offset. */
export function stopDateTime(journeyDate: string, time: string, dayOffset: number): string {
  const base = parse(`${journeyDate} ${time || "00:00"}`, "yyyy-MM-dd HH:mm", new Date());
  return addDays(base, dayOffset).toISOString();
}

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export const minutesBetween = (a: string, b: string) => differenceInMinutes(new Date(b), new Date(a));
export const fmtDateTime = (iso: string) => format(new Date(iso), "dd MMM yyyy, HH:mm");
export const fmtTime = (iso: string) => format(new Date(iso), "HH:mm");
export const fmtDate = (iso: string) => format(new Date(iso), "EEE, dd MMM yyyy");
export const todayISODate = () => format(new Date(), "yyyy-MM-dd");

export function ageFromDOB(dob: string, at = new Date()): number {
  const d = new Date(dob);
  let age = at.getFullYear() - d.getFullYear();
  const m = at.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < d.getDate())) age--;
  return age;
}
