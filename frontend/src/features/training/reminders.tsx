"use client";
import { useCallback, useEffect, useState } from "react";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { useHydrated } from "@/lib/hydrated";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export function ReminderSettings() {
  const [data, setData] = useState<
    components["schemas"]["ReminderView"] | null
  >(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const hydrated = useHydrated();
  const supported = hydrated && "Notification" in window;
  const load = useCallback(async () => {
    const r = await api.GET("/api/v1/integration/reminder");
    if (!r.data) throw new Error(apiError(r.error));
    setData(r.data);
    setError("");
  }, []);
  useEffect(() => {
    let active = true;
    void api
      .GET("/api/v1/integration/reminder")
      .then((r) => {
        if (!active) return;
        if (r.data) setData(r.data);
        else setError(apiError(r.error));
      })
      .catch(() => {
        if (active) setError("Unable to load reminders. Retry.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function permission() {
    if (!supported) {
      setMessage(
        "Browser notifications are unsupported. In-app reminders still work.",
      );
      return;
    }
    if (Notification.permission === "denied") {
      setMessage(
        "Browser notifications are denied. Use the in-app reminder, or change permission in browser settings.",
      );
      return;
    }
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        setData((old) => (old ? { ...old, browser_notifications: true } : old));
        setMessage("Permission granted. Save reminder settings to opt in.");
      } else {
        setData((old) =>
          old ? { ...old, browser_notifications: false } : old,
        );
        setMessage(
          "Browser notifications were not allowed. In-app reminders still work.",
        );
      }
    } catch {
      setMessage(
        "Browser notifications are unavailable. In-app reminders still work.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!data || busy) return;
    setBusy(true);
    try {
      const { timezone, ...body } = data;
      void timezone;
      const r = await api.PUT("/api/v1/integration/reminder", { body });
      if (!r.data) throw new Error(apiError(r.error));
      setData(r.data);
      setError("");
      setMessage(
        data.enabled
          ? "Practice reminder enabled while Chord House is open."
          : "Practice reminder disabled.",
      );
      window.dispatchEvent(new Event("chord-reminder-settings"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save reminder");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Optional practice reminders</h2>
      <p>
        Reminders are off until you enable and save them. Chord House can show
        an in-app reminder while a visible app tab is open. Closed-browser
        delivery, sleep and background delivery are not guaranteed. Brief delays
        are caught for up to ten minutes; missed or nonexistent DST times are
        skipped.
      </p>
      <p>
        Browser notifications are optional. They show only a generic practice
        message, never promotional content or your private notes. Press the
        permission button only if you want browser notifications; denial or lack
        of support leaves the app fully usable.
      </p>
      <Feedback error message={error} />
      <Feedback message={message} />
      {data ? (
        <>
          <p>
            Schedule timezone: {data.timezone}. Change it in your profile
            preferences; the next reminder check uses that timezone.
          </p>
          <fieldset disabled={busy}>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={data.enabled}
                onChange={(e) =>
                  setData({ ...data, enabled: e.target.checked })
                }
              />
              Enable practice reminders
            </label>
            <label>
              Local reminder time
              <input
                type="time"
                value={data.local_time}
                onChange={(e) =>
                  setData({ ...data, local_time: e.target.value })
                }
              />
            </label>
            <fieldset>
              <legend>Reminder weekdays</legend>
              {days.map((day, i) => (
                <label className="checkbox" key={day}>
                  <input
                    type="checkbox"
                    checked={data.weekdays.includes(i)}
                    onChange={(e) =>
                      setData({
                        ...data,
                        weekdays: e.target.checked
                          ? [...data.weekdays, i].sort()
                          : data.weekdays.filter((n) => n !== i),
                      })
                    }
                  />
                  {day}
                </label>
              ))}
            </fieldset>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={data.browser_notifications}
                onChange={(e) => {
                  if (
                    e.target.checked &&
                    (!supported || Notification.permission !== "granted")
                  ) {
                    setMessage(
                      "Use the permission button before opting into browser notifications.",
                    );
                    return;
                  }
                  setData({ ...data, browser_notifications: e.target.checked });
                }}
              />
              Use browser notifications when allowed
            </label>
            <Button variant="outline" onClick={() => void permission()}>
              Enable browser notifications
            </Button>
            {!supported && hydrated && (
              <p>
                Browser notifications unsupported; in-app delivery is available.
              </p>
            )}
            <p>
              At most one reminder per local calendar day across open
              tabs/devices. Dismissing it will not disable future scheduled
              days.
            </p>
            <Button
              disabled={
                (data.enabled && !data.weekdays.length) ||
                !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(data.local_time)
              }
              onClick={() => void save()}
            >
              Save reminder settings
            </Button>
          </fieldset>
        </>
      ) : (
        !error && <p role="status">Loading reminder settings…</p>
      )}
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => void load().catch((e) => setError(e.message))}
      >
        Reload reminder settings
      </Button>
    </section>
  );
}
