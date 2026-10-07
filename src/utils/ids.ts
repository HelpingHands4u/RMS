import { format } from "date-fns";

function randomDigits(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

function randomAlnum(n: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** PNR-YYYYMMDD-XXXXXX. Uniqueness is verified inside the booking transaction. */
export function generatePNR(date = new Date()): string {
  return `PNR-${format(date, "yyyyMMdd")}-${randomDigits(6)}`;
}

/** SIMTXN-YYYYMMDD-XXXXXX. Uniqueness is verified inside the payment transaction. */
export function generateTransactionId(date = new Date()): string {
  return `SIMTXN-${format(date, "yyyyMMdd")}-${randomAlnum(6)}`;
}

export const nowISO = () => new Date().toISOString();
