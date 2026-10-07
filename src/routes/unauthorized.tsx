import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({
    meta: [
      { title: "Access denied — RailReserve" },
      { name: "description", content: "You do not have permission to view this page." },
      { property: "og:title", content: "Access denied — RailReserve" },
      { property: "og:description", content: "You do not have permission to view this page." },
    ],
  }),
  component: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">This area is for administrators. Your account role is checked against the database, not the browser.</p>
        <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    </div>
  ),
});
