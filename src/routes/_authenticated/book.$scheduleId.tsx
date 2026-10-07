import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Loader2, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader, SimulationNotice } from "@/components/rail/bits";
import { SeatLegend, SeatMap } from "@/components/rail/SeatMap";
import { PassengerFormDialog } from "@/components/rail/PassengerFormDialog";
import { useMyPassengers } from "@/hooks/useMasterData";
import { scheduleService } from "@/services/schedule.service";
import { trainService, findSegment } from "@/services/train.service";
import { stationService } from "@/services/station.service";
import { reservationService, MAX_PASSENGERS } from "@/services/reservation.service";
import { AppError, toUserMessage } from "@/utils/errors";
import { calculateFare, CLASS_LABELS, formatINR } from "@/utils/fare";
import { ageFromDOB, fmtDateTime, stopDateTime } from "@/utils/time";
import { pageHead } from "@/lib/seo";
import type { ClassType } from "@/types";

export const Route = createFileRoute("/_authenticated/book/$scheduleId")({
  validateSearch: z.object({ from: z.string().catch(""), to: z.string().catch(""), cls: z.enum(["1A", "2A", "3A", "SL", "CC", "2S"]).catch("SL") }),
  head: () => pageHead("Book ticket", "Select passengers and seats for your journey."),
  component: BookPage,
});

function BookPage() {
  const { scheduleId } = Route.useParams();
  const { from, to, cls } = Route.useSearch();
  const classType = cls as ClassType;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const passengers = useMyPassengers();
  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [dialog, setDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const journey = useQuery({
    queryKey: ["journey", scheduleId, from, to, classType],
    queryFn: async () => {
      const schedule = await scheduleService.getById(scheduleId);
      if (!schedule || schedule.status !== "SCHEDULED") throw new AppError("This schedule is not available for booking.");
      const [train, segment, source, dest] = await Promise.all([
        trainService.getById(schedule.trainId), findSegment(schedule.trainId, from, to), stationService.getById(from), stationService.getById(to),
      ]);
      if (!train || !segment || !source || !dest) throw new AppError("This train does not run between the selected stations.");
      return {
        schedule, train, source, dest, distanceKm: segment.distanceKm, fare: calculateFare(segment.distanceKm, classType),
        departure: stopDateTime(schedule.journeyDate, segment.from.departureTime, segment.from.dayOffset),
        arrival: stopDateTime(schedule.journeyDate, segment.to.arrivalTime, segment.to.dayOffset),
      };
    },
    retry: false,
  });
  const seatMap = useQuery({
    queryKey: ["seatmap", scheduleId, classType],
    enabled: !!journey.data,
    queryFn: () => reservationService.checkSeatAvailability(scheduleId, journey.data!.train.id, classType),
  });

  if (journey.isLoading) return <LoadingState label="Loading journey…" />;
  if (journey.isError || !journey.data) return <ErrorState message={toUserMessage(journey.error, "Unable to load train information.")} />;
  const j = journey.data;
  const seatInfo = new Map((seatMap.data ?? []).flatMap((c) => c.seats).map((s) => [s.id, s]));
  const total = j.fare * selectedPassengers.length;

  const togglePassenger = (id: string) => {
    setSelectedPassengers((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_PASSENGERS) { toast.error(`Maximum ${MAX_PASSENGERS} passengers per ticket.`); return prev; }
      return [...prev, id];
    });
  };
  const toggleSeat = (id: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= selectedPassengers.length) { toast.error(selectedPassengers.length ? "You have selected a seat for every passenger." : "Select passengers first."); return prev; }
      return [...prev, id];
    });
  };

  const submit = async () => {
    if (!selectedPassengers.length) return toast.error("Select at least one passenger.");
    if (selectedSeats.length !== selectedPassengers.length) return toast.error("Choose one seat for each passenger.");
    setSubmitting(true);
    try {
      const r = await reservationService.createReservation({
        scheduleId, sourceStationId: from, destinationStationId: to, classType,
        items: selectedPassengers.map((passengerId, i) => ({ passengerId, seatId: selectedSeats[i] })),
      });
      toast.success(`Seats held. PNR ${r.pnr} — complete payment to confirm.`);
      qc.invalidateQueries({ queryKey: ["reservations"] });
      navigate({ to: "/payment/$reservationId", params: { reservationId: r.id } });
    } catch (e) {
      toast.error(toUserMessage(e, "Booking could not be completed."));
      setSelectedSeats([]);
      seatMap.refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const plist = passengers.data ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title={`${j.train.trainNumber} · ${j.train.trainName}`} subtitle={`${j.source.stationName} → ${j.dest.stationName} · ${fmtDateTime(j.departure)} → ${fmtDateTime(j.arrival)} · ${classType} ${CLASS_LABELS[classType]}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">1 · Passengers</h2>
              <Button size="sm" variant="outline" onClick={() => setDialog(true)}><Plus className="mr-1 h-4 w-4" />New</Button>
            </div>
            {passengers.isLoading && <LoadingState />}
            {passengers.isError && <ErrorState message={toUserMessage(passengers.error)} />}
            {passengers.data && plist.length === 0 && <EmptyState icon={<UserPlus className="h-8 w-8" />} title="No saved passengers" description="Add a passenger profile to continue." />}
            <div className="grid gap-2 sm:grid-cols-2">
              {plist.map((p) => {
                const idx = selectedPassengers.indexOf(p.id);
                return (
                  <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                    <Checkbox checked={idx >= 0} onCheckedChange={() => togglePassenger(p.id)} />
                    <div className="flex-1">
                      <div className="font-medium">{p.fullName}</div>
                      <div className="text-xs text-muted-foreground">{ageFromDOB(p.dateOfBirth)} yrs · {p.gender}</div>
                    </div>
                    {idx >= 0 && <span className="text-xs font-semibold text-primary">#{idx + 1}</span>}
                  </label>
                );
              })}
            </div>
          </Card>
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">2 · Seats <span className="text-sm font-normal text-muted-foreground">({selectedSeats.length}/{selectedPassengers.length} chosen)</span></h2>
              <SeatLegend />
            </div>
            {seatMap.isLoading && <LoadingState label="Checking seat availability…" />}
            {seatMap.isError && <ErrorState message={toUserMessage(seatMap.error)} onRetry={() => seatMap.refetch()} />}
            {seatMap.data && seatMap.data.length === 0 && <EmptyState title="No coaches of this class" />}
            {seatMap.data && <SeatMap coaches={seatMap.data} selected={selectedSeats} onToggle={toggleSeat} />}
          </Card>
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <h2 className="mb-4 font-semibold">3 · Review fare</h2>
            <div className="space-y-2 text-sm">
              {selectedPassengers.map((pid, i) => {
                const p = plist.find((x) => x.id === pid);
                const seat = selectedSeats[i] ? seatInfo.get(selectedSeats[i]) : undefined;
                return (
                  <div key={pid} className="flex justify-between gap-2">
                    <span className="truncate">{p?.fullName}</span>
                    <span className="font-mono text-xs text-muted-foreground">{seat ? `${seat.coachNumber}-${seat.seatNumber}` : "— seat"}</span>
                  </div>
                );
              })}
              <div className="my-3 border-t" />
              <div className="flex justify-between text-muted-foreground"><span>Distance</span><span>{j.distanceKm} km</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Fare / passenger</span><span>{formatINR(j.fare)}</span></div>
              <div className="flex justify-between font-display text-lg font-bold"><span>Total</span><span>{formatINR(total)}</span></div>
              <p className="text-[11px] text-muted-foreground">Academic fare model: distance × class rate + ₹30 service charge. Not official pricing.</p>
            </div>
            <Button className="mt-4 w-full" size="lg" disabled={submitting || !selectedPassengers.length} onClick={submit}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Proceed to payment
            </Button>
            <SimulationNotice className="mt-3" />
            <Link to="/search" className="mt-3 block text-center text-xs text-muted-foreground hover:underline">Change search</Link>
          </Card>
        </div>
      </div>
      <PassengerFormDialog open={dialog} onOpenChange={setDialog} onSaved={() => qc.invalidateQueries({ queryKey: ["passengers"] })} />
    </div>
  );
}
