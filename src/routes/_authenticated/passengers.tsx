import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/rail/bits";
import { PassengerFormDialog } from "@/components/rail/PassengerFormDialog";
import { ConfirmDialog } from "@/components/rail/ConfirmDialog";
import { useMyPassengers } from "@/hooks/useMasterData";
import { passengerService } from "@/services/passenger.service";
import { ageFromDOB } from "@/utils/time";
import { toUserMessage } from "@/utils/errors";
import { pageHead } from "@/lib/seo";
import type { Passenger } from "@/types";

export const Route = createFileRoute("/_authenticated/passengers")({
  head: () => pageHead("Passengers", "Manage saved passenger profiles for faster booking."),
  component: PassengersPage,
});

function PassengersPage() {
  const q = useMyPassengers();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Passenger | null>(null);
  const [deleting, setDeleting] = useState<Passenger | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["passengers"] });

  const remove = async () => {
    if (!deleting) return;
    try {
      const r = await passengerService.remove(deleting.id);
      toast.success(r === "deleted" ? "Passenger deleted" : "Passenger used in bookings — profile archived instead");
      refresh();
    } catch (e) {
      toast.error(toUserMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Passengers" subtitle="Family and friends you travel with. Ticket history keeps a snapshot even if you edit a profile."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />Add passenger</Button>} />
      {q.isLoading && <LoadingState />}
      {q.isError && <ErrorState message={toUserMessage(q.error, "Unable to load passengers.")} onRetry={() => q.refetch()} />}
      {q.data?.length === 0 && <EmptyState icon={<Users className="h-10 w-10" />} title="No passengers yet" description="Add at least one passenger profile before booking." action={<Button onClick={() => setOpen(true)}>Add passenger</Button>} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{p.fullName}</div>
                <div className="text-sm text-muted-foreground">{ageFromDOB(p.dateOfBirth)} yrs · {p.gender}</div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setDeleting(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
            <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
              <div>{p.phone}{p.email ? ` · ${p.email}` : ""}</div>
              <div>{p.idType.replace("_", " ")}: ••••{p.idNumber.slice(-4)}</div>
            </div>
          </div>
        ))}
      </div>
      <PassengerFormDialog open={open} onOpenChange={setOpen} editing={editing} onSaved={refresh} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Remove passenger?" description={`${deleting?.fullName ?? ""} will be removed from your saved passengers.`} confirmLabel="Remove" destructive onConfirm={remove} />
    </div>
  );
}
