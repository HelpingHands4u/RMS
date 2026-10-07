import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/rail/bits";
import { trainService } from "@/services/train.service";
import { routeService } from "@/services/route.service";
import { coachService } from "@/services/coach.service";
import { stationService } from "@/services/station.service";
import { toUserMessage } from "@/utils/errors";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/trains/$id")({
  head: () => pageHead("Train details", "Route, stops and coach composition of a train."),
  component: TrainDetails,
});

function TrainDetails() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["train-details", id],
    queryFn: async () => {
      const train = await trainService.getById(id);
      if (!train) throw new Error("not found");
      const route = await routeService.getActiveRouteForTrain(id);
      const [stops, coaches, stations] = await Promise.all([route ? routeService.getStops(route.id) : [], coachService.listByTrain(id), stationService.list()]);
      return { train, route, stops, coaches, stationMap: new Map(stations.map((s) => [s.id, s])) };
    },
  });
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState message={toUserMessage(q.error, "Unable to load train information.")} />;
  const { train, route, stops, coaches, stationMap } = q.data;
  return (
    <div className="space-y-6">
      <PageHeader title={`${train.trainNumber} · ${train.trainName}`} subtitle={`${train.trainType} · ${train.operator}`} actions={<StatusBadge status={train.status} />} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="mb-4 font-semibold">{route?.routeName ?? "No active route"}</h2>
          <ol className="relative space-y-4 border-l-2 border-primary/30 pl-5">
            {stops.map((s) => {
              const st = stationMap.get(s.stationId);
              return (
                <li key={s.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-card" />
                  <div className="flex flex-wrap justify-between gap-2">
                    <div><span className="font-mono text-xs font-semibold text-primary">{st?.stationCode}</span> <span className="font-medium">{st?.stationName}</span></div>
                    <div className="text-sm text-muted-foreground">
                      {s.arrivalTime ? `Arr ${s.arrivalTime}` : "Origin"} · {s.departureTime ? `Dep ${s.departureTime}` : "Terminus"} · Day {s.dayOffset + 1} · {s.distanceKm} km
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Coaches</h2>
          <div className="flex flex-wrap gap-2">
            {coaches.sort((a, b) => a.coachNumber.localeCompare(b.coachNumber)).map((c) => (
              <div key={c.id} className="rounded-md border bg-muted/50 px-3 py-2 text-center">
                <div className="font-mono font-semibold">{c.coachNumber}</div>
                <div className="text-[11px] text-muted-foreground">{c.classType} · {c.seatCapacity} seats</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
