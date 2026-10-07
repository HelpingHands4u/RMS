import { cn } from "@/lib/utils";
import type { SeatMapCoach } from "@/services/reservation.service";

const SHORT: Record<string, string> = { LOWER: "LB", MIDDLE: "MB", UPPER: "UB", SIDE_LOWER: "SL", SIDE_UPPER: "SU", WINDOW: "W", AISLE: "A" };

export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs">
      <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded border-2 border-success/60 bg-success/15" />Available</span>
      <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-destructive/70" />Occupied</span>
      <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-primary" />Selected</span>
    </div>
  );
}

export function SeatMap({ coaches, selected, onToggle }: { coaches: SeatMapCoach[]; selected: string[]; onToggle: (seatId: string) => void }) {
  return (
    <div className="space-y-5">
      {coaches.map(({ coach, seats }) => {
        const free = seats.filter((s) => !s.occupied).length;
        return (
          <div key={coach.id} className="rounded-xl border bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-mono text-sm font-bold text-primary">Coach {coach.coachNumber}</div>
              <div className="text-xs text-muted-foreground">{free} / {seats.length} free</div>
            </div>
            {seats.length === 0 ? <p className="text-xs text-muted-foreground">No seats configured for this coach.</p> : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {seats.map((s) => {
                  const isSel = selected.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={s.occupied}
                      onClick={() => onToggle(s.id)}
                      aria-pressed={isSel}
                      aria-label={`Seat ${s.seatNumber} ${s.seatType}${s.occupied ? " occupied" : ""}`}
                      className={cn(
                        "flex h-12 flex-col items-center justify-center rounded-md text-xs font-semibold transition",
                        s.occupied && "cursor-not-allowed bg-destructive/70 text-destructive-foreground",
                        !s.occupied && !isSel && "border-2 border-success/60 bg-success/10 text-foreground hover:bg-success/25",
                        isSel && "bg-primary text-primary-foreground ring-2 ring-accent",
                      )}
                    >
                      <span>{s.seatNumber.toString().padStart(2, "0")}</span>
                      <span className="text-[9px] font-normal opacity-75">{SHORT[s.seatType] ?? s.seatType}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
