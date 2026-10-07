import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Ban, Database, IndianRupee, MapPin, Route as RouteIcon, Ticket, TicketCheck, TrainFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader, StatCard } from "@/components/rail/bits";
import { analyticsService } from "@/services/analytics.service";
import { seedService } from "@/services/seed.service";
import { formatINR } from "@/utils/fare";
import { toUserMessage } from "@/utils/errors";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => pageHead("Admin overview", "Railway operations dashboard computed from database records."),
  component: AdminHome,
});

function AdminHome() {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: () => analyticsService.getDashboardStats() });
  const seed = async () => {
    setSeeding(true);
    try {
      const r = await seedService.loadDemoData();
      toast.success(`Demo data loaded (${r.written} records).`);
      qc.invalidateQueries();
    } catch (e) { toast.error(toUserMessage(e)); } finally { setSeeding(false); }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Admin overview" subtitle="All figures come from Firestore records."
        actions={<Button variant="outline" onClick={seed} disabled={seeding}><Database className="mr-1 h-4 w-4" />{seeding ? "Loading…" : "Load DEMO data"}</Button>} />
      {q.isLoading && <LoadingState />}
      {q.isError && <ErrorState message={toUserMessage(q.error, "Unable to load statistics.")} onRetry={() => q.refetch()} />}
      {q.data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Trains" value={q.data.totalTrains} icon={<TrainFront className="h-4 w-4" />} />
          <StatCard label="Stations" value={q.data.totalStations} icon={<MapPin className="h-4 w-4" />} />
          <StatCard label="Active routes" value={q.data.activeRoutes} icon={<RouteIcon className="h-4 w-4" />} />
          <StatCard label="Today's bookings" value={q.data.todaysBookings} icon={<Ticket className="h-4 w-4" />} />
          <StatCard label="Confirmed" value={q.data.confirmed} icon={<TicketCheck className="h-4 w-4" />} />
          <StatCard label="Cancelled" value={q.data.cancelled} icon={<Ban className="h-4 w-4" />} />
          <StatCard label="Net revenue" value={formatINR(q.data.revenue)} hint={`Refunds ${formatINR(q.data.refunds)}`} icon={<IndianRupee className="h-4 w-4" />} />
          <StatCard label="Pending payments" value={q.data.pendingPayments} icon={<Ticket className="h-4 w-4" />} />
        </div>
      )}
      {q.data && q.data.totalBookings === 0 && <EmptyState title="No analytics data available yet." description="Bookings will appear here once passengers start reserving." />}
      <Card><p className="text-sm text-muted-foreground">DEMO DATA · ACADEMIC SIMULATION — the demo loader adds 10 stations, 6 trains with routes, coaches, seats and 14 days of schedules.</p></Card>
    </div>
  );
}
