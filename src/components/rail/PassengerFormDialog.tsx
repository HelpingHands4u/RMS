import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { passengerSchema, passengerService, type PassengerInput } from "@/services/passenger.service";
import { toUserMessage } from "@/utils/errors";
import type { Passenger } from "@/types";

const EMPTY: PassengerInput = { fullName: "", dateOfBirth: "", gender: "MALE", phone: "", email: "", idType: "AADHAAR", idNumber: "" };

export function PassengerFormDialog({ open, onOpenChange, editing, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; editing?: Passenger | null; onSaved: () => void;
}) {
  const form = useForm<PassengerInput>({ resolver: zodResolver(passengerSchema), defaultValues: EMPTY });
  useEffect(() => {
    if (open) form.reset(editing ? { fullName: editing.fullName, dateOfBirth: editing.dateOfBirth, gender: editing.gender, phone: editing.phone, email: editing.email, idType: editing.idType, idNumber: editing.idNumber } : EMPTY);
  }, [open, editing, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      if (editing) await passengerService.update(editing.id, values);
      else await passengerService.create(values);
      toast.success(editing ? "Passenger updated" : "Passenger added");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(toUserMessage(e, "Unable to save passenger."));
    }
  });
  const err = (k: keyof PassengerInput) => form.formState.errors[k]?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Edit passenger" : "Add passenger"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="space-y-1.5 sm:col-span-2"><Label>Full name</Label><Input {...form.register("fullName")} />{err("fullName") && <p className="text-xs text-destructive">{err("fullName")}</p>}</div>
          <div className="space-y-1.5"><Label>Date of birth</Label><Input type="date" {...form.register("dateOfBirth")} />{err("dateOfBirth") && <p className="text-xs text-destructive">{err("dateOfBirth")}</p>}</div>
          <div className="space-y-1.5"><Label>Gender</Label>
            <Controller control={form.control} name="gender" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="MALE">Male</SelectItem><SelectItem value="FEMALE">Female</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select>
            )} />
          </div>
          <div className="space-y-1.5"><Label>Mobile</Label><Input {...form.register("phone")} />{err("phone") && <p className="text-xs text-destructive">{err("phone")}</p>}</div>
          <div className="space-y-1.5"><Label>Email (optional)</Label><Input type="email" {...form.register("email")} />{err("email") && <p className="text-xs text-destructive">{err("email")}</p>}</div>
          <div className="space-y-1.5"><Label>ID type</Label>
            <Controller control={form.control} name="idType" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{["AADHAAR", "PAN", "PASSPORT", "VOTER_ID", "DRIVING_LICENCE", "STUDENT_ID"].map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
            )} />
          </div>
          <div className="space-y-1.5"><Label>ID number</Label><Input {...form.register("idNumber")} />{err("idNumber") && <p className="text-xs text-destructive">{err("idNumber")}</p>}</div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>{editing ? "Save changes" : "Add passenger"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
