"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { api, apiError, setCsrf, type Profile } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
type Auth = {
  profile: Profile | null;
  status: "loading" | "ready" | "error";
  refresh: () => Promise<Profile | null>;
  accept: (p: Profile | null) => void;
};
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<Auth["status"]>("loading");
  const generation = useRef(0);
  const accept = useCallback((p: Profile | null) => {
    generation.current += 1;
    setProfile(p);
    setCsrf(p?.csrf_token || "");
    setStatus("ready");
  }, []);
  const refresh = useCallback(async () => {
    const turn = generation.current;
    try {
      const result = await api.GET("/api/v1/me");
      if (generation.current !== turn) return null;
      if (result.response.status === 401) {
        accept(null);
        return null;
      }
      if (!result.data) throw new Error(apiError(result.error));
      accept(result.data);
      return result.data;
    } catch (error) {
      if (generation.current === turn) setStatus("error");
      throw error;
    }
  }, [accept]);
  useEffect(() => {
    const turn = generation.current;
    let active = true;
    api
      .GET("/api/v1/me")
      .then((result) => {
        if (!active || generation.current !== turn) return;
        if (result.response.status === 401) accept(null);
        else if (result.data) accept(result.data);
        else setStatus("error");
      })
      .catch(() => {
        if (active && generation.current === turn) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [accept]);
  useEffect(() => {
    document.documentElement.dataset.theme = profile?.theme || "system";
  }, [profile?.theme]);
  useEffect(() => {
    const expired = () => accept(null);
    window.addEventListener("chord-session-expired", expired);
    return () => window.removeEventListener("chord-session-expired", expired);
  }, [accept]);
  return (
    <AuthContext.Provider value={{ profile, status, refresh, accept }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider required");
  return ctx;
}
export function Protected({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.status === "ready" && !auth.profile) router.replace("/login");
  }, [auth.status, auth.profile, router]);
  if (auth.status === "error")
    return (
      <section className="panel">
        <h1>Connection unavailable</h1>
        <Feedback
          error
          message="Your account could not be loaded. Your information has not been changed."
        />
        <Button onClick={() => void auth.refresh().catch(() => {})}>
          Try again
        </Button>
      </section>
    );
  if (!auth.profile) return <p role="status">Checking your session…</p>;
  return children;
}
