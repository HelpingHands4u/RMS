import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { isFirebaseConfigured } from "@/firebase/config";
import { authService, type AuthUser, type RegisterInput } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import type { AppUser } from "@/types";

interface AuthState {
  /** Firebase Auth user (identity). */
  user: AuthUser | null;
  /** Firestore users/{uid} document — the role is read from here, never from the client. */
  profile: AppUser | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u: AuthUser | null) => {
    if (!u) return setProfile(null);
    try {
      setProfile(await userService.ensureProfile(u.uid, u.email ?? "", u.displayName ?? ""));
     } catch (error) {
  console.error("❌ Failed to load/create Firestore user profile:", error);
  setProfile(null);
}
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    return authService.onAuthChange(async (u) => {
      setLoading(true);
      setUser(u);
      await loadProfile(u);
      setLoading(false);
    });
  }, [loadProfile]);

  const value: AuthState = {
    user, profile, loading, configured: isFirebaseConfigured,
    isAdmin: profile?.role === "ADMIN" && profile.status === "ACTIVE",
    login: authService.login,
    register: authService.register,
    logout: authService.logout,
    refreshProfile: () => loadProfile(user),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
