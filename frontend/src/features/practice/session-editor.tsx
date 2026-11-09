"use client";
import { useState } from "react";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
import type { Details, PracticeSession, Sources } from "./types";
import { SessionFields } from "./links";
import { localInput } from "./clock";
export function SessionEditor({
  session,
  sources,
  busy,
  save,
  cancel,
}: {
  session: PracticeSession;
  sources: Sources;
  busy: boolean;
  save: (
    id: string,
    body: components["schemas"]["SessionUpdate"],
  ) => Promise<void>;
  cancel: () => void;
}) {
  const [details, setDetails] = useState<Details>({
    instrument: session.instrument,
    focus: session.focus,
    notes: session.notes,
    song_id: session.song_id,
    chord_id: session.chord_id,
    chord_name: session.chord_name,
  });
  const [correct, setCorrect] = useState(false);
  const [start, setStart] = useState(localInput(session.started_at));
  const [seconds, setSeconds] = useState(session.duration_seconds);
  const [confirmLong, setConfirmLong] = useState(false);
  const [error, setError] = useState("");
  const long = correct && seconds > 14400;
  const valid =
    !correct ||
    (Number.isInteger(seconds) &&
      seconds >= 1 &&
      seconds <= 86400 &&
      !!start &&
      (!long || confirmLong));
  async function submit() {
    setError("");
    try {
      const body: components["schemas"]["SessionUpdate"] = {
        ...details,
        version: session.version,
        confirm_long: confirmLong,
      };
      if (correct) {
        body.corrected_start = new Date(start).toISOString();
        body.corrected_seconds = seconds;
      }
      await save(session.id, body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to edit session");
    }
  }
  return (
    <section className="panel">
      <h2>Edit practice session</h2>
      <SessionFields
        value={details}
        change={setDetails}
        sources={sources}
        disabled={busy}
      />
      <label className="checkbox">
        <input
          type="checkbox"
          disabled={busy}
          checked={correct}
          onChange={(e) => setCorrect(e.target.checked)}
        />
        Correct session time
      </label>
      {correct && (
        <>
          <p>
            Changing time replaces pause segments with one continuous active
            interval. Check the actual time you practiced; future or overlapping
            saved time is rejected.
          </p>
          <label>
            Corrected start (device timezone:{" "}
            {Intl.DateTimeFormat().resolvedOptions().timeZone})
            <Input
              type="datetime-local"
              step={1}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              disabled={busy}
            />
          </label>
          <label>
            Corrected active seconds
            <Input
              type="number"
              min={1}
              max={86400}
              step={1}
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value))}
              disabled={busy}
            />
          </label>
        </>
      )}
      {long && (
        <label className="checkbox">
          <input
            type="checkbox"
            checked={confirmLong}
            onChange={(e) => setConfirmLong(e.target.checked)}
          />
          I reviewed this correction over four hours
        </label>
      )}
      {!valid && (
        <p role="alert">
          Enter a valid start and 1–86400 active seconds. Confirm unusually long
          corrections.
        </p>
      )}
      <Feedback error message={error} />
      <Button disabled={busy || !valid} onClick={() => void submit()}>
        Save session changes
      </Button>{" "}
      <Button variant="outline" disabled={busy} onClick={cancel}>
        Cancel session edit
      </Button>
    </section>
  );
}
