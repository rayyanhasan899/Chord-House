"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
export function ReminderHost({ owner }: { owner: string }) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true,
      pending = false,
      queued = false;
    let notification: Notification | null = null;
    async function check() {
      if (document.visibilityState !== "visible") return;
      if (pending) {
        queued = true;
        return;
      }
      pending = true;
      try {
        const pref = await api.GET("/api/v1/integration/reminder");
        if (!active) return;
        if (!pref.data?.enabled) {
          notification?.close();
          setMessage("");
          return;
        }
        const r = await api.POST("/api/v1/integration/reminder/check");
        if (!active) return;
        if (!r.data) {
          setMessage(
            "Practice reminders are temporarily unavailable. Your other tools still work.",
          );
          return;
        }
        if (r.data.due) {
          setMessage("Time for your optional practice reminder.");
          if (
            r.data.browser_notifications &&
            typeof window.Notification === "function" &&
            Notification.permission === "granted"
          ) {
            try {
              notification?.close();
              notification = new Notification("Chord House practice reminder", {
                body: "Make a little time for practice when you are ready.",
                tag: "chord-house-practice",
              });
              notification.onclick = () => window.focus();
            } catch {
              setMessage(
                "Time for practice. Browser notifications are unavailable; this in-app reminder is your fallback.",
              );
            }
          }
        }
      } catch {
        /* Settings errors are actionable on the settings page; never nag non-subscribers. */
      } finally {
        pending = false;
        if (queued && active) {
          queued = false;
          void check();
        }
      }
    }
    void check();
    const timer = setInterval(() => void check(), 30000);
    const refresh = () => void check();
    window.addEventListener("focus", refresh);
    window.addEventListener("chord-reminder-settings", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      notification?.close();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("chord-reminder-settings", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [owner]);
  return message ? (
    <aside className="panel" aria-label="Practice reminder">
      <p role="status">{message}</p>
      <Link href="/practice">Open Practice</Link>{" "}
      <Button variant="outline" onClick={() => setMessage("")}>
        Dismiss reminder
      </Button>
    </aside>
  ) : null;
}
