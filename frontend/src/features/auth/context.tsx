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
  accept: (p: Profile | null, reason?: "deleted") => void;
  signedOutReason: "deleted" | null;
};
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<Auth["status"]>("loading");
  const [signedOutReason, setSignedOutReason] = useState<"deleted" | null>(
    null,
  );
  const generation = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const knownOwner = useRef<string | null>(null);
  const apply = useCallback((p: Profile | null) => {
    generation.current += 1;
    knownOwner.current = p?.id || null;
    setProfile(p);
    setCsrf(p?.csrf_token || "");
    setStatus("ready");
  }, []);
  const accept = useCallback(
    (p: Profile | null, reason?: "deleted") => {
      setSignedOutReason(reason || null);
      apply(p);
      channel.current?.postMessage("changed");
    },
    [apply],
  );
  const refresh = useCallback(async () => {
    const turn = generation.current;
    try {
      const result = await api.GET("/api/v1/me");
      if (generation.current !== turn) return null;
      if (result.response.status === 401) {
        apply(null);
        return null;
      }
      if (!result.data) throw new Error(apiError(result.error));
      apply(result.data);
      return result.data;
    } catch (error) {
      if (generation.current === turn) setStatus("error");
      throw error;
    }
  }, [apply]);
  useEffect(() => {
    const turn = generation.current;
    let active = true;
    api
      .GET("/api/v1/me")
      .then((result) => {
        if (!active || generation.current !== turn) return;
        if (result.response.status === 401) apply(null);
        else if (result.data) apply(result.data);
        else setStatus("error");
      })
      .catch(() => {
        if (active && generation.current === turn) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [apply]);
  useEffect(() => {
    document.documentElement.dataset.theme = profile?.theme || "system";
  }, [profile?.theme]);
  useEffect(() => {
    const expired = () => {
      const hadOwner = knownOwner.current !== null;
      apply(null);
      if (hadOwner) channel.current?.postMessage("changed");
    };
    window.addEventListener("chord-session-expired", expired);
    return () => window.removeEventListener("chord-session-expired", expired);
  }, [apply]);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const shared = new BroadcastChannel("chord-house-auth");
    channel.current = shared;
    shared.onmessage = (event) => {
      if (event.data !== "changed") return;
      // No profiles, credentials or tokens cross this channel. Reload discards
      // private component state and revalidates the authoritative cookie.
      apply(null);
      window.location.reload();
    };
    return () => {
      channel.current = null;
      shared.close();
    };
  }, [apply]);
  return (
    <AuthContext.Provider
      value={{ profile, status, refresh, accept, signedOutReason }}
    >
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
    if (auth.status === "ready" && !auth.profile)
      router.replace(
        auth.signedOutReason === "deleted" ? "/login?deleted=1" : "/login",
      );
  }, [auth.status, auth.profile, auth.signedOutReason, router]);
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
