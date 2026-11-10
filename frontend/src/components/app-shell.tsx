"use client";
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
          <Link href="/tuner">Tuner</Link>
          <Link href="/chords">Chords</Link>
          <Link href="/metronome">Metronome</Link>
          <Link href="/" aria-current={path === "/" ? "page" : undefined}>
            Home
          </Link>
          {auth.profile ? (
            <>
              <Link href="/dashboard">Workspace</Link>
              <Link href="/patterns">Patterns</Link>
              <Link href="/songs">Songs</Link>
              <Link href="/practice">Practice</Link>
              <Link href="/progress">Progress</Link>
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
      <main id="main" className="page">
        <Feedback error message={message} />
        {children}
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
