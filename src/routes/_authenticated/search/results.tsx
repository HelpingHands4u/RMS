import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, SearchX, TrainFront } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/rail/bits";
import { SearchForm } from "@/components/rail/SearchForm";
import { trainService } from "@/services/train.service";
import { CLASS_LABELS, formatINR } from "@/utils/fare";
import { durationLabel, fmtDate, fmtTime } from "@/utils/time";
import { toUserMessage } from "@/utils/errors";
import { pageHead } from "@/lib/seo";
import type { ClassType } from "@/types";

const searchSchema = z.object({
  from: z.string().catch(""),
  to: z.string().catch(""),
  date: z.string().catch(""),
  cls: z.enum(["1A", "2A", "3A", "SL", "CC", "2S"]).catch("SL"),
});

export const Route = createFileRoute("/_authenticated/search/results")({
  validateSearch: searchSchema,
  head: () => pageHead("Search results", "Trains available for your route and date."),
  component: Results,
});

function Results() {
  const s = Route.useSearch();
  const q = useQuery({
    queryKey: ["search", s],
    queryFn: () => trainService.searchTrains({ sourceStationId: s.from, destinationStationId: s.to, journeyDate: s.date, classType: s.cls as ClassType }),
    retry: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Available trains" subtitle={s.date ? `${fmtDate(s.date)} · ${s.cls} ${CLASS_LABELS[s.cls as ClassType]}` : undefined} />
      <Card><SearchForm key={JSON.stringify(s)} initial={s as never} /></Card>

      {q.isLoading && <LoadingState label="Searching routes and counting seats…" />}
      {q.isError && <ErrorState message={toUserMessage(q.error, "Unable to load train information.")} onRetry={() => q.refetch()} />}
      {q.data && q.data.length === 0 && (
        <EmptyState icon={<SearchX className="h-10 w-10" />} title="No trains found for this route and date." description="Try another date or class, or check that the boarding station comes before the destination on a route." />
      )}
      <div className="space-y-4">
        {q.data?.map((r) => (
          <div key={r.scheduleId} className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-5 py-3">
              <div className="flex items-center gap-2">
                <TrainFront className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm font-semibold text-primary">{r.train.trainNumber}</span>
                <span className="font-semibold">{r.train.trainName}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-secondary-foreground">{r.train.trainType}</span>
              </div>
              <span className="text-xs text-muted-foreground">{r.coaches.map((c) => c.coachNumber).join(" · ")}</span>
            </div>
            <div className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto]">
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-display text-2xl font-bold">{fmtTime(r.departureDateTime)}</div>
                  <div className="text-sm text-muted-foreground">{r.source.stationCode} · {r.source.stationName}</div>
                </div>
                <div className="flex flex-1 flex-col items-center text-xs text-muted-foreground">
                  <span>{durationLabel(r.durationMinutes)}</span>
                  <div className="my-1 h-px w-full bg-border" />
                  <span>{r.distanceKm} km</span>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold">{fmtTime(r.arrivalDateTime)}</div>
                  <div className="text-sm text-muted-foreground">{r.destination.stationCode} · {r.destination.stationName}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 md:border-l md:pl-5">
                <div>
                  <div className="text-xs text-muted-foreground">{r.classType} fare</div>
                  <div className="font-display text-xl font-bold">{formatINR(r.farePerPassenger)}</div>
                  <div className={r.availableSeats > 0 ? "text-xs font-semibold text-success" : "text-xs font-semibold text-destructive"}>
                    {r.availableSeats > 0 ? `${r.availableSeats} of ${r.totalSeats} available` : "No seats available"}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button asChild disabled={r.availableSeats === 0}>
                    <Link to="/book/$scheduleId" params={{ scheduleId: r.scheduleId }} search={{ from: s.from, to: s.to, cls: r.classType }}>
                      Book <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/trains/$id" params={{ id: r.train.id }}>Details</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
