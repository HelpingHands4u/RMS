import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

// UI gate only — the real protection is firestore.rules (isAdmin() reads users/{uid}.role).
export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
