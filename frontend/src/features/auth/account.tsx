"use client";
import Link from "next/link";
import { useState } from "react";
import { useHydrated } from "@/lib/hydrated";
import { useRouter } from "next/navigation";
import { useAuth } from "./context";
import { api, apiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
export function Account() {
  const hydrated = useHydrated();
  const auth = useAuth();
  const profile = auth.profile;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!profile) return null;
  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const r = await api.POST("/api/v1/auth/password", {
        body: {
          current_password: String(form.get("current")),
          new_password: String(form.get("new")),
        },
      });
      if (!r.data) throw new Error(apiError(r.error));
      auth.accept(null);
      router.push("/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : apiError(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="account-heading">
        <p className="eyebrow">My account</p>
        <h1>Welcome home, {profile.display_name}.</h1>
        <p className="lede">
          Your starting point is saved. Keep your preferences in step with your
          learning.
        </p>
      </section>
      <div className="account-grid">
        <section className="panel">
          <h2>Your learning profile</h2>
          <dl>
            <div>
              <dt>Instrument</dt>
              <dd>{profile.instrument.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Skill level</dt>
              <dd>{profile.skill}</dd>
            </div>
            <div>
              <dt>Preferred tuning</dt>
              <dd>{profile.tuning.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>{profile.timezone}</dd>
            </div>
          </dl>
          <Link className="button button-primary" href="/onboarding">
            {profile.onboarding_complete
              ? "Edit learning preferences"
              : "Complete your setup"}
          </Link>
        </section>
        <section className="panel">
          <h2>Account & security</h2>
          <p>{profile.email}</p>
          <p className="tag">
            {profile.email_verified
              ? "Email verified"
              : "Email verification pending"}
          </p>
          {!profile.email_verified && (
            <p>
              <Link className="text-link" href="/verify">
                Verify your email
              </Link>
            </p>
          )}
          <details>
            <summary>Change password</summary>
            <p className="hint">
              This signs you out of all sessions. Sign in again with your new
              password.
            </p>
            <Feedback error message={message} />
            <form onSubmit={changePassword} aria-busy={busy}>
              <fieldset disabled={!hydrated || busy}>
                <label>
                  Current password
                  <Input
                    name="current"
                    type="password"
                    autoComplete="current-password"
                    required
                    maxLength={128}
                  />
                </label>
                <label>
                  New password
                  <Input
                    name="new"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                  />
                </label>
                <Button disabled={busy}>
                  {busy ? "Changing…" : "Change password and sign out"}
                </Button>
              </fieldset>
            </form>
          </details>
        </section>
      </div>
      <section className="availability">
        <h2>What’s available today</h2>
        <p>
          Your account, learning preferences and security settings are ready.
          Your workspace, tuner, chord library and metronome are ready. Save
          private custom chords from the chord library. Song catalogue and
          practice history arrive in later phases.
        </p>
      </section>
    </>
  );
}
