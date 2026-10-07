/**
 * ACADEMIC REFUND RULE (simulation only):
 *  > 48 h before departure  → 90 %
 *  24 – 48 h               → 75 %
 *  0 – 24 h                → 50 %
 *  after departure         → 0 %
 */
export interface RefundQuote {
  hoursBeforeDeparture: number;
  percent: number;
  refundAmount: number;
  rule: string;
}

export function calculateRefund(totalFare: number, departureISO: string, now = new Date()): RefundQuote {
  const hours = (new Date(departureISO).getTime() - now.getTime()) / 36e5;
  let percent = 0;
  let rule = "Journey has started — no refund";
  if (hours > 48) { percent = 90; rule = "More than 48 hours before departure"; }
  else if (hours >= 24) { percent = 75; rule = "24–48 hours before departure"; }
  else if (hours > 0) { percent = 50; rule = "Less than 24 hours before departure"; }
  return {
    hoursBeforeDeparture: Math.round(hours * 10) / 10,
    percent,
    refundAmount: Math.round((totalFare * percent) / 100),
    rule,
  };
}
