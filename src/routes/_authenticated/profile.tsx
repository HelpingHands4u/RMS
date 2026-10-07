import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, PageHeader, StatusBadge } from "@/components/rail/bits";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";
import { toUserMessage } from "@/utils/errors";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => pageHead("Profile", "Manage your account details."),
  component: Profile,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
});

function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setName(profile?.name ?? ""); setPhone(profile?.phone ?? ""); }, [profile]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, phone });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!user) return;
    setBusy(true);
    try {
      await userService.updateProfile(user.uid, parsed.data);
      await refreshProfile();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="Profile" />
      <Card>
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center gap-2 text-sm">Account role: {profile && <StatusBadge status={profile.role} />}</div>
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Mobile</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={profile?.email ?? ""} disabled /><p className="text-xs text-muted-foreground">Email is managed by your sign-in account and cannot be changed here.</p></div>
          <Button type="submit" disabled={busy}>Save changes</Button>
        </form>
      </Card>
    </div>
  );
}
