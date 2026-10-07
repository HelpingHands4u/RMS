import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/rail/AppShell";
import { LoadingState } from "@/components/rail/bits";
import { FirebaseSetupNotice } from "@/components/rail/FirebaseSetupNotice";

// Protected area. Firebase keeps the session in the browser, so this subtree renders client-side.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user, loading, configured, profile } = useAuth();
  if (!configured) return <div className="flex min-h-screen items-center p-6"><FirebaseSetupNotice /></div>;
  if (loading) return <div className="min-h-screen"><LoadingState label="Checking your session…" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile && profile.status !== "ACTIVE") return <Navigate to="/unauthorized" replace />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
