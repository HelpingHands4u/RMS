import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Station } from "@/types";

export function StationSelect({ stations, value, onChange, placeholder = "Select station", id }: {
  stations: Station[]; value: string; onChange: (v: string) => void; placeholder?: string; id?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="h-11 w-full bg-card"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {stations.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <span className="font-mono text-xs font-semibold text-primary">{s.stationCode}</span>
            <span className="ml-2">{s.stationName}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
