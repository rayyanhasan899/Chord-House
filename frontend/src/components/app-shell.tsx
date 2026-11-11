"use client";
import { ReminderHost } from "@/features/training/reminder-host";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/features/auth/context";
import { api, apiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
function Shell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      const r = await api.POST("/api/v1/auth/logout");
      if (r.error) {
        if (r.response.status !== 401) throw new Error(apiError(r.error));
      }
      auth.accept(null);
      router.push("/login");
    } catch {
      setMessage("Unable to sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Chord House home">
          <span aria-hidden="true" className="brand-mark">
            ♮
          </span>
          Chord House
        </Link>
        <nav aria-label="Main navigation">
          <Link
            href="/tuner"
            aria-current={path === "/tuner" ? "page" : undefined}
          >
            Tuner
          </Link>
          <Link
            href="/chords"
            aria-current={path === "/chords" ? "page" : undefined}
          >
            Chords
          </Link>
          <Link
            href="/metronome"
            aria-current={path === "/metronome" ? "page" : undefined}
          >
            Metronome
          </Link>
          <Link href="/" aria-current={path === "/" ? "page" : undefined}>
            Home
          </Link>
          {auth.profile ? (
            <>
              <Link
                href="/dashboard"
                aria-current={path === "/dashboard" ? "page" : undefined}
              >
                Workspace
              </Link>
              <Link
                href="/patterns"
                aria-current={path === "/patterns" ? "page" : undefined}
              >
                Patterns
              </Link>
              <Link
                href="/songs"
                aria-current={
                  path === "/songs" || path.startsWith("/songs/")
                    ? "page"
                    : undefined
                }
              >
                Songs
              </Link>
              <Link
                href="/practice"
                aria-current={path === "/practice" ? "page" : undefined}
              >
                Practice
              </Link>
              <Link
                href="/progress"
                aria-current={path === "/progress" ? "page" : undefined}
              >
                Progress
              </Link>
              <Link
                href="/training"
                aria-current={path === "/training" ? "page" : undefined}
              >
                Training
              </Link>
              <Link
                href="/reports"
                aria-current={path === "/reports" ? "page" : undefined}
              >
                Content reports
              </Link>
              {["admin", "content_manager"].includes(auth.profile.role) && (
                <Link
                  href="/admin"
                  aria-current={path === "/admin" ? "page" : undefined}
                >
                  Administration
                </Link>
              )}
              <Link
                href="/account"
                aria-current={path === "/account" ? "page" : undefined}
              >
                My account
              </Link>
              <Button variant="outline" disabled={busy} onClick={logout}>
                {busy ? "Signing out…" : "Sign out"}
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                aria-current={path === "/login" ? "page" : undefined}
              >
                Sign in
              </Link>
              <Link className="button button-primary" href="/register">
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>
      <main id="main" className="page" tabIndex={-1}>
        <Feedback error message={message} />
        {auth.profile && (
          <ReminderHost key={auth.profile.id} owner={auth.profile.id} />
        )}
        <div key={auth.profile?.id || "guest"}>{children}</div>
      </main>
      <footer className="site-footer">
        <p>Chord House · Your home for guitar learning</p>
        <Link href="/privacy">Privacy & permissions</Link>
      </footer>
    </>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}
