"use client";
import { useState } from "react";
import { useHydrated } from "@/lib/hydrated";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, apiError } from "@/lib/api/client";
import { useAuth } from "./context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
export function AuthForm({ register = false }: { register?: boolean }) {
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const credentials = {
      email: String(data.get("email")),
      password: String(data.get("password")),
    };
    try {
      if (register) {
        const r = await api.POST("/api/v1/auth/register", {
          body: {
            ...credentials,
            display_name: String(data.get("display_name")),
            acknowledge_privacy: data.get("privacy") === "on",
          },
        });
        if (!r.data) throw new Error(apiError(r.error));
        setSuccess(true);
        setMessage(r.data.message);
      } else {
        const r = await api.POST("/api/v1/auth/login", { body: credentials });
        if (!r.data) throw new Error(apiError(r.error));
        auth.accept(r.data);
        router.push(r.data.onboarding_complete ? "/account" : "/onboarding");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : apiError(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">
          {register ? "Your next chapter" : "Welcome back"}
        </p>
        <h1>
          {register ? "Make yourself at home." : "Pick up where you left off."}
        </h1>
        <p>
          {register
            ? "A few details now. A space for your learning ahead."
            : "Sign in to your own account and learning preferences."}
        </p>
      </div>
      <div className="panel">
        <h2>{register ? "Create your account" : "Sign in"}</h2>
        <Feedback message={message} error={!success} />
        {success ? (
          <Link className="button button-primary" href="/login">
            Sign in to your account
          </Link>
        ) : (
          <form method="post" onSubmit={submit} aria-busy={busy}>
            <fieldset disabled={!hydrated || busy}>
              {register && (
                <label>
                  Display name
                  <Input
                    name="display_name"
                    autoComplete="nickname"
                    required
                    maxLength={80}
                  />
                </label>
              )}
              <label>
                Email address
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={320}
                />
              </label>
              <label>
                Password
                <Input
                  name="password"
                  type="password"
                  autoComplete={register ? "new-password" : "current-password"}
                  minLength={12}
                  maxLength={128}
                  required
                  aria-describedby="password-help"
                />
              </label>
              <p id="password-help" className="hint">
                Use 12–128 characters. A long, unique phrase works well.
              </p>
              {register && (
                <label className="checkbox">
                  <input name="privacy" type="checkbox" required />I have read
                  the <Link href="/privacy">privacy notice</Link>.
                </label>
              )}
              <Button disabled={busy} type="submit">
                {busy
                  ? "Please wait…"
                  : register
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </fieldset>
          </form>
        )}
        <div className="form-links">
          {register ? (
            <Link href="/login">Already have an account? Sign in</Link>
          ) : (
            <>
              <Link href="/forgot">Forgot your password?</Link>
              <Link href="/register">Create an account</Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
export function CodeForm({ purpose }: { purpose: "verify" | "reset" }) {
  const hydrated = useHydrated();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setSuccess(false);
    try {
      const token = String(form.get("token"));
      const r =
        purpose === "verify"
          ? await api.POST("/api/v1/auth/verify/confirm", { body: { token } })
          : await api.POST("/api/v1/auth/reset/confirm", {
              body: { token, password: String(form.get("password")) },
            });
      if (!r.data) throw new Error(apiError(r.error));
      setSuccess(true);
      setMessage(r.data.message);
      if (purpose === "verify") await auth.refresh();
      else auth.accept(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : apiError(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel narrow">
      <p className="eyebrow">Account security</p>
      <h1>
        {purpose === "verify" ? "Verify your email" : "Choose a new password"}
      </h1>
      <p>
        Enter the single-use code from your account email. Codes expire after 30
        minutes.
      </p>
      <Feedback message={message} error={!success} />
      {!success && (
        <form method="post" onSubmit={submit} aria-busy={busy}>
          <fieldset disabled={!hydrated || busy}>
            <label>
              {purpose === "verify" ? "Verification code" : "Reset code"}
              <Input
                name="token"
                autoComplete="one-time-code"
                required
                minLength={40}
                maxLength={100}
              />
            </label>
            {purpose === "reset" && (
              <label>
                New password
                <Input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
            )}
            <Button disabled={busy}>
              {busy
                ? "Checking…"
                : purpose === "verify"
                  ? "Verify email"
                  : "Reset password"}
            </Button>
          </fieldset>
        </form>
      )}
      <div className="form-links">
        <Link href="/login">Return to sign in</Link>
      </div>
    </section>
  );
}
export function EmailRequest({ purpose }: { purpose: "verify" | "reset" }) {
  const hydrated = useHydrated();
  const Heading = purpose === "reset" ? "h1" : "h2";
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    setBusy(true);
    setError(false);
    try {
      const r =
        purpose === "verify"
          ? await api.POST("/api/v1/auth/verify/request", { body: { email } })
          : await api.POST("/api/v1/auth/reset/request", { body: { email } });
      if (!r.data) throw new Error(apiError(r.error));
      setMessage(r.data.message);
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : apiError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel narrow">
      <Heading>
        {purpose === "reset"
          ? "Forgot your password?"
          : "Need a new verification code?"}
      </Heading>
      <p>Enter your account email to request a new code.</p>
      <Feedback message={message} error={error} />
      <form method="post" onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={!hydrated || busy}>
          <label>
            Email address
            <Input type="email" name="email" autoComplete="email" required />
          </label>
          <Button disabled={busy}>{busy ? "Requesting…" : "Send code"}</Button>
        </fieldset>
      </form>
      {purpose === "reset" && (
        <Link className="text-link" href="/reset">
          I have a reset code
        </Link>
      )}
    </section>
  );
}
