"use client";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import type {
  Activity,
  Instrument,
  Routine,
  RoutineDraft,
  Sources,
} from "./types";
import { instruments, instrumentLabel, kind } from "./types";
const activity = (): Activity => ({
  name: "Warm up",
  duration_seconds: 300,
  tool: "none",
  bpm: 100,
  chord_name: "",
  song_id: null,
  chord_id: null,
  pattern_id: null,
});
export function RoutineEditor({
  initial,
  instrument,
  sources,
  busy,
  save,
  cancel,
}: {
  initial: Routine | null;
  instrument: Instrument;
  sources: Sources;
  busy: boolean;
  save: (
    draft: RoutineDraft,
    id: string | null,
    version: number,
    key: string,
  ) => Promise<void>;
  cancel: () => void;
}) {
  const [draft, setDraft] = useState<RoutineDraft>(
    initial
      ? {
          name: initial.name,
          description: initial.description,
          instrument: initial.instrument,
          activities: initial.activities,
        }
      : {
          name: "My practice routine",
          description: "",
          instrument,
          activities: [activity()],
        },
  );
  const key = useRef("");
  const [error, setError] = useState("");
  function edit(index: number, patch: Partial<Activity>) {
    setDraft((old) => ({
      ...old,
      activities: old.activities.map((a, i) =>
        i === index ? { ...a, ...patch } : a,
      ),
    }));
  }
  function move(index: number, direction: number) {
    const next = [...draft.activities];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    setDraft({ ...draft, activities: next });
  }
  const total = draft.activities.reduce((n, a) => n + a.duration_seconds, 0);
  const valid =
    !!draft.name.trim() &&
    draft.activities.length > 0 &&
    total <= 86400 &&
    draft.activities.every(
      (a) =>
        a.name.trim() &&
        Number.isInteger(a.duration_seconds) &&
        a.duration_seconds >= 1 &&
        a.duration_seconds <= 14400 &&
        Number.isInteger(a.bpm ?? 100) &&
        (a.bpm ?? 100) >= 30 &&
        (a.bpm ?? 100) <= 300 &&
        (a.tool !== "song" || a.song_id) &&
        (a.tool !== "pattern" || a.pattern_id),
    );
  async function submit() {
    if (!key.current) key.current = crypto.randomUUID();
    setError("");
    try {
      await save(
        draft,
        initial?.id || null,
        initial?.version || 0,
        key.current,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save routine");
    }
  }
  return (
    <section className="panel">
      <h2>{initial ? "Edit routine" : "Build a routine"}</h2>
      <fieldset disabled={busy}>
        <label>
          Routine name
          <Input
            value={draft.name}
            maxLength={120}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label>
          Routine instrument
          <select
            value={draft.instrument}
            onChange={(e) =>
              setDraft({
                ...draft,
                instrument: e.target.value as Instrument,
                activities: draft.activities.map((a) => ({
                  ...a,
                  chord_id: null,
                })),
              })
            }
          >
            {instruments.map((i) => (
              <option key={i} value={i}>
                {instrumentLabel(i)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Routine description
          <textarea
            maxLength={2000}
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        </label>
        <ol className="routine-activities">
          {draft.activities.map((a, i) => (
            <li key={i}>
              <h3>Activity {i + 1}</h3>
              <div className="form-grid">
                <label>
                  Activity {i + 1} name
                  <Input
                    maxLength={120}
                    value={a.name}
                    onChange={(e) => edit(i, { name: e.target.value })}
                  />
                </label>
                <label>
                  Activity {i + 1} seconds
                  <Input
                    type="number"
                    min={1}
                    max={14400}
                    step={1}
                    value={a.duration_seconds}
                    onChange={(e) =>
                      edit(i, { duration_seconds: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Activity {i + 1} tool
                  <select
                    value={a.tool}
                    onChange={(e) =>
                      edit(i, { tool: e.target.value as Activity["tool"] })
                    }
                  >
                    <option value="none">Free practice</option>
                    <option value="metronome">Metronome</option>
                    <option value="chords">Chord drill + metronome</option>
                    <option value="pattern">Strumming + metronome</option>
                    <option value="song">Song practice</option>
                    <option value="tuner">Tuner in another tab</option>
                  </select>
                </label>
                <label>
                  Activity {i + 1} BPM
                  <Input
                    type="number"
                    min={30}
                    max={300}
                    value={a.bpm}
                    onChange={(e) => edit(i, { bpm: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Activity {i + 1} song
                  <select
                    value={a.song_id || ""}
                    onChange={(e) =>
                      edit(i, { song_id: e.target.value || null })
                    }
                  >
                    <option value="">No linked song</option>
                    {sources.songs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} · {s.artist}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Activity {i + 1} custom chord
                  <select
                    value={a.chord_id || ""}
                    onChange={(e) =>
                      edit(i, { chord_id: e.target.value || null })
                    }
                  >
                    <option value="">No private chord</option>
                    {sources.chords
                      .filter((c) => c.instrument === kind(draft.instrument))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Activity {i + 1} chord symbol
                  <Input
                    value={a.chord_name || ""}
                    maxLength={15}
                    placeholder="e.g. C, Am"
                    onChange={(e) => edit(i, { chord_name: e.target.value })}
                  />
                </label>
                <label>
                  Activity {i + 1} pattern
                  <select
                    value={a.pattern_id || ""}
                    onChange={(e) =>
                      edit(i, { pattern_id: e.target.value || null })
                    }
                  >
                    <option value="">No linked pattern</option>
                    {sources.patterns.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.status === "private" ? " (private)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Button
                variant="outline"
                disabled={i === 0}
                aria-label={`Move activity ${i + 1} up`}
                onClick={() => move(i, -1)}
              >
                Move up
              </Button>{" "}
              <Button
                variant="outline"
                disabled={i === draft.activities.length - 1}
                aria-label={`Move activity ${i + 1} down`}
                onClick={() => move(i, 1)}
              >
                Move down
              </Button>{" "}
              <Button
                variant="outline"
                disabled={draft.activities.length === 1}
                aria-label={`Remove activity ${i + 1}`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    activities: draft.activities.filter((_, n) => n !== i),
                  })
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ol>
        <Button
          variant="outline"
          disabled={draft.activities.length >= 30}
          onClick={() =>
            setDraft({
              ...draft,
              activities: [
                ...draft.activities,
                { ...activity(), name: "Next activity" },
              ],
            })
          }
        >
          Add routine activity
        </Button>
        <p>
          Total: {total} seconds. Up to 30 activities, four hours per activity
          and 24 hours per routine.
        </p>
        {!valid && (
          <p role="alert">
            Give the routine and activities names, valid durations/BPM, and
            select required song/pattern links.
          </p>
        )}
        <Feedback error message={error} />
        <Button disabled={!valid} onClick={() => void submit()}>
          {initial ? "Save routine changes" : "Save new routine"}
        </Button>{" "}
        <Button variant="outline" onClick={cancel}>
          Close routine editor
        </Button>
      </fieldset>
    </section>
  );
}
