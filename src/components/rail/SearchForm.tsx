import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, Search } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StationSelect } from "./StationSelect";
import { useActiveStations } from "@/hooks/useMasterData";
import { CLASS_TYPES, type ClassType } from "@/types";
import { CLASS_LABELS } from "@/utils/fare";
import { todayISODate } from "@/utils/time";
import { toUserMessage } from "@/utils/errors";

const schema = z.object({
  from: z.string().min(1, "Select a source station"),
  to: z.string().min(1, "Select a destination station"),
  date: z.string().min(1, "Choose a journey date").refine((d) => d >= todayISODate(), "Journey date cannot be in the past"),
  cls: z.enum(["1A", "2A", "3A", "SL", "CC", "2S"], { errorMap: () => ({ message: "Select a class" }) }),
}).refine((v) => v.from !== v.to, { path: ["to"], message: "Source and destination cannot be the same" });

export interface SearchValues { from: string; to: string; date: string; cls: ClassType }

export function SearchForm({ initial }: { initial?: Partial<SearchValues> }) {
  const navigate = useNavigate();
  const stations = useActiveStations();
  const [v, setV] = useState({ from: initial?.from ?? "", to: initial?.to ?? "", date: initial?.date ?? todayISODate(), cls: (initial?.cls ?? "") as string });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      const errs = Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]));
      setErrors(errs);
      toast.error(Object.values(errs)[0]);
      return;
    }
    setErrors({});
    navigate({ to: "/search/results", search: parsed.data });
  };

  if (stations.isError) return <p className="text-sm text-destructive">{toUserMessage(stations.error, "Unable to load stations.")}</p>;
  const list = stations.data ?? [];

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-[1fr_auto_1fr_180px_180px_auto] md:items-end" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="from">From</Label>
        <StationSelect id="from" stations={list} value={v.from} onChange={(from) => setV({ ...v, from })} placeholder={stations.isLoading ? "Loading…" : "Boarding station"} />
        {errors.from && <p className="text-xs text-destructive">{errors.from}</p>}
      </div>
      <button type="button" aria-label="Swap stations" onClick={() => setV({ ...v, from: v.to, to: v.from })} className="mx-auto mb-1 hidden h-9 w-9 items-center justify-center rounded-full border bg-card hover:bg-muted md:flex">
        <ArrowLeftRight className="h-4 w-4" />
      </button>
      <div className="space-y-1.5">
        <Label htmlFor="to">To</Label>
        <StationSelect id="to" stations={list} value={v.to} onChange={(to) => setV({ ...v, to })} placeholder="Destination" />
        {errors.to && <p className="text-xs text-destructive">{errors.to}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="date">Journey date</Label>
        <Input id="date" type="date" min={todayISODate()} value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} className="h-11 bg-card" />
        {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Class</Label>
        <Select value={v.cls} onValueChange={(cls) => setV({ ...v, cls })}>
          <SelectTrigger className="h-11 w-full bg-card"><SelectValue placeholder="Select class" /></SelectTrigger>
          <SelectContent>{CLASS_TYPES.map((c) => <SelectItem key={c} value={c}>{c} · {CLASS_LABELS[c]}</SelectItem>)}</SelectContent>
        </Select>
        {errors.cls && <p className="text-xs text-destructive">{errors.cls}</p>}
      </div>
      <Button type="submit" size="lg" className="h-11"><Search className="mr-1 h-4 w-4" /> Search</Button>
    </form>
  );
}
