"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
import type { Goal } from "./types";
export function GoalSetting({
  period,
  current,
  busy,
  save,
}: {
  period: "daily" | "weekly";
  current?: Goal;
  busy: boolean;
  save: (
    period: "daily" | "weekly",
    minutes: number,
    paused: boolean,
    version: number,
  ) => Promise<void>;
}) {
  const [minutes, setMinutes] = useState(
    current?.minutes ?? (period === "daily" ? 15 : 90),
  );
  const [paused, setPaused] = useState(current?.paused ?? false);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");
  const max = period === "daily" ? 1440 : 10080;
  const valid = Number.isInteger(minutes) && minutes >= 1 && minutes <= max;
  async function submit() {
    setFailed(false);
    try {
      await save(period, minutes, paused, current?.version || 0);
      setMessage("Goal settings saved.");
    } catch (e) {
      setFailed(true);
      setMessage(e instanceof Error ? e.message : "Unable to save goal");
    }
  }
  return (
    <section>
      <h3>{period === "daily" ? "Daily target" : "Weekly target"}</h3>
      <p>
        {current
          ? `${current.minutes} minutes · ${current.paused ? "Paused" : "Active"}`
          : "No saved goal yet; the form value is a suggestion."}
      </p>
      <label>
        {period === "daily" ? "Daily" : "Weekly"} goal minutes
        <Input
          disabled={busy}
          type="number"
          min={1}
          max={max}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
      </label>
      <label className="checkbox">
        <input
          disabled={busy}
          type="checkbox"
          checked={paused}
          onChange={(e) => setPaused(e.target.checked)}
        />
        Pause {period} goal
      </label>
      {!valid && <p role="alert">Use 1–{max} whole minutes.</p>}
      <Button disabled={busy || !valid} onClick={() => void submit()}>
        Save {period} goal
      </Button>
      <Feedback message={message} error={failed} />
    </section>
  );
}
