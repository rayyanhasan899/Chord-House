"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, apiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
import { useAuth } from "./context";

export function PrivacyControls() {
  const auth = useAuth();
  const router = useRouter();
  const active = useRef(true);
  const urls = useRef(new Set<string>());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    active.current = true;
    const owned = urls.current;
    return () => {
      active.current = false;
      for (const url of owned) URL.revokeObjectURL(url);
      owned.clear();
    };
  }, []);
  async function submit(
    event: React.FormEvent<HTMLFormElement>,
    action: "export" | "delete",
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const body = {
        current_password: String(fields.get("password")),
        confirm:
          fields.get("confirm") === "on" &&
          (action === "export" || fields.get("phrase") === "DELETE"),
      };
      if (action === "export") {
        const result = await api.POST("/api/v1/me/export", { body });
        if (!active.current) return;
        if (!result.data) throw new Error(apiError(result.error));
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(result.data, null, 2)], {
            type: "application/json;charset=utf-8",
          }),
        );
        urls.current.add(url);
        const link = document.createElement("a");
        link.href = url;
        link.download = "chord-house-personal-data.json";
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          urls.current.delete(url);
        }, 1000);
        setMessage(
          "Personal data download started. Store the file privately; it contains your notes and history.",
        );
      } else {
        const result = await api.POST("/api/v1/me/delete", { body });
        if (!active.current) return;
        if (!result.data) throw new Error(apiError(result.error));
        auth.accept(null, "deleted");
        router.replace("/login?deleted=1");
      }
    } catch (reason) {
      if (active.current)
        setError(reason instanceof Error ? reason.message : apiError(reason));
    } finally {
      form.reset();
      if (active.current) setBusy(false);
    }
  }
  return (
    <section className="panel" aria-labelledby="privacy-controls-title">
      <h2 id="privacy-controls-title">Your data and account</h2>
      <p>
        <Link href="/privacy">Read the privacy and retention notice</Link>. Only
        your records are included. Shared catalog content and credential secrets
        are excluded.
      </p>
      <Feedback error message={error} />
      <Feedback message={message} />
      <details>
        <summary>Download my personal data</summary>
        <p id="export-explanation">
          Download a versioned UTF-8 JSON file with your profile, private
          workspace, chords, patterns, routines, practice history, goals,
          reviews, assessments and reminders. Keep it private. No export is
          saved on our server.
        </p>
        <form
          method="post"
          onSubmit={(e) => void submit(e, "export")}
          aria-busy={busy}
          aria-describedby="export-explanation"
        >
          <fieldset className="privacy-fields" disabled={busy}>
            <label>
              Current password for export
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
              />
            </label>
            <label className="checkbox">
              <input name="confirm" type="checkbox" required />I understand this
              file contains my private data
            </label>
            <Button>{busy ? "Working…" : "Download personal data"}</Button>
          </fieldset>
        </form>
      </details>
      <details>
        <summary>Delete account</summary>
        <p id="deletion-explanation">
          This permanently deletes your account, all sessions and private
          workspace, custom chords/patterns, practice history, goals, routines,
          reviews, assessments and reminders. This cannot be undone here. Export
          first if needed. Shared catalog contributions remain with account
          links anonymized. Provider backup copies follow the documented
          deployment retention policy.
        </p>
        {!auth.profile?.email_verified && (
          <p>
            Verify your email before deletion.{" "}
            <Link href="/verify">Verify your email</Link>
          </p>
        )}
        <form
          method="post"
          onSubmit={(e) => void submit(e, "delete")}
          aria-busy={busy}
          aria-describedby="deletion-explanation"
        >
          <fieldset
            className="privacy-fields"
            disabled={busy || !auth.profile?.email_verified}
          >
            <label>
              Current password for deletion
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
              />
            </label>
            <label>
              Type DELETE to confirm
              <Input
                name="phrase"
                required
                pattern="DELETE"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="checkbox">
              <input name="confirm" type="checkbox" required />I understand my
              account and private records will be permanently deleted
            </label>
            <Button variant="outline">Permanently delete my account</Button>
          </fieldset>
        </form>
      </details>
    </section>
  );
}
