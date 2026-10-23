// ===========================================================================
//  auth.tsx — who is signed in, for all three portals.
// ===========================================================================
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore, type Role, type User } from "@/lib/api";

type Ctx = {
  user: User | null; loading: boolean; isGuest: boolean;
  login: (portal: Role, email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  startGuest: () => void; logout: () => void; refresh: () => Promise<void>;
};
const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); setLoading(false); return; }
    try { setUser((await api.get<{ user: User }>("/auth/me")).user); } catch { setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); const off = () => { setUser(null); setIsGuest(false); }; window.addEventListener("careernet:signed-out", off); return () => window.removeEventListener("careernet:signed-out", off); }, [refresh]);
  useEffect(() => {
    if (!user?.isPro || !user.proExpiresAt) return;
    const expires = Date.parse(user.proExpiresAt);
    if (!Number.isFinite(expires)) return;
    let timer: ReturnType<typeof setTimeout>;
    const checkExpiry = () => {
      clearTimeout(timer);
      const remaining = expires - Date.now();
      if (remaining <= 0) {
        setUser(current => current ? { ...current, isPro: false } : current);
        void refresh();
      } else timer = setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647));
    };
    checkExpiry();
    window.addEventListener("focus", checkExpiry);
    return () => { clearTimeout(timer); window.removeEventListener("focus", checkExpiry); };
  }, [user?.id, user?.isPro, user?.proExpiresAt, refresh]);
  const login = async (portal: Role, email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>("/auth/login", { portal, email, password });
    tokenStore.set(r.token); setIsGuest(false); setUser(r.user); return r.user;
  };
  const register = async (name: string, email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>("/auth/register", { name, email, password });
    tokenStore.set(r.token); setIsGuest(false); setUser(r.user); return r.user;
  };
  const startGuest = () => { tokenStore.set(null); setUser(null); setIsGuest(true); };
  const logout = () => { tokenStore.set(null); setUser(null); setIsGuest(false); };
  return <AuthCtx.Provider value={{ user, loading, isGuest, login, register, startGuest, logout, refresh }}>{children}</AuthCtx.Provider>;
}
export function useAuth() { const v = useContext(AuthCtx); if (!v) throw new Error("AuthProvider missing"); return v; }
export const homeFor = (role: Role) => (role === "mentor" ? "/mentor" : role === "admin" ? "/admin" : "/student");
