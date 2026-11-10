"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context";
import { useReferences } from "@/features/content/references";
import { Diagram } from "@/features/chords/diagram";
import {
  pitches,
  type Voicing,
  type Instrument as Family,
} from "@/features/chords/music";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { TrainingAudio } from "./audio";
import { randomized, sequencePosition, type Level } from "./domain";
type Instrument = components["schemas"]["SessionStart"]["instrument"];
export function Transitions({
  challenge = false,
  onSaved,
}: {
  challenge?: boolean;
  onSaved: () => void;
}) {
  const { profile } = useAuth();
  const [instrument, setInstrument] = useState<Instrument>(
    profile?.instrument || "acoustic_guitar",
  );
  const family: Family = instrument.endsWith("guitar")
    ? "guitar"
    : (instrument as Family);
  const catalogue = useReferences("chord");
  const entries = catalogue.rows
    .map((row) => row.document as unknown as Voicing)
    .filter((c) => c.instrument === family);
  const choices = [...new Map(entries.map((c) => [c.name, c])).values()];
  const [selected, setSelected] = useState(["C", "G"]);
  const plan = selected.map((name) => choices.find((c) => c.name === name));
  const [interval, setIntervalSeconds] = useState(4);
  const [duration, setDuration] = useState(60);
  const [audible, setAudible] = useState(false);
  const [level, setLevel] = useState<Level>("beginner");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [changes, setChanges] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "steady" | "hard">(
    "steady",
  );
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [round, setRound] = useState<{
    instrument: Instrument;
    chords: string[];
  } | null>(null);
  const engine = useRef<TrainingAudio | null>(null);
  const generation = useRef(0);
  const saveKey = useRef("");
  const roundShapes = useRef("");
  const shapes = JSON.stringify(
    plan.map((c) =>
      c ? { name: c.name, frets: c.frets, fingers: c.fingers } : null,
    ),
  );
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    const audio = new TrainingAudio();
    engine.current = audio;
    audio.onTick = setElapsed;
    audio.onEnded = () => {
      setRunning(false);
      setCompleted(false);
      setMessage(
        "Round complete. Enter your own clean-change count and assessment.",
      );
    };
    audio.onInterrupted = (text) => {
      setRunning(false);
      setCompleted(false);
      setMessage(text);
    };
    const hidden = () => {
      if (document.visibilityState === "hidden" && audio.active()) {
        const value = audio.elapsed();
        audio.stop();
        invalidate();
        setElapsed((old) => Math.max(old, value));
        setRunning(false);
        setCompleted(false);
        setMessage(
          "Training stopped while the tab was hidden. Start a new round when ready.",
        );
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      invalidate();
      audio.onTick = undefined;
      audio.onEnded = undefined;
      audio.onInterrupted = undefined;
      audio.stop();
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [invalidate]);
  useEffect(() => {
    if (!running || roundShapes.current === shapes) return;
    const timer = setTimeout(() => {
      invalidate();
      engine.current?.stop();
      setRunning(false);
      setCompleted(false);
      setMessage(
        "Shared chord shapes changed or were withdrawn. Review the available choices before starting again.",
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [shapes, running, invalidate]);
  const valid =
    new Set(selected).size >= 2 &&
    plan.every(Boolean) &&
    Number.isFinite(interval) &&
    interval >= 0.5 &&
    interval <= 30 &&
    Number.isInteger(duration) &&
    duration >= 5 &&
    duration <= 300;
  const position = sequencePosition(
    Math.max(0, elapsed),
    Number.isFinite(interval) && interval >= 0.5 && interval <= 30
      ? interval
      : 4,
    selected.length,
  );
  const current = plan[position.current],
    next = plan[position.next];
  async function start() {
    if (!valid || running) return;
    const turn = ++generation.current;
    setError("");
    setElapsed(0);
    setCompleted(false);
    setSaved(false);
    setChanges(0);
    roundShapes.current = shapes;
    saveKey.current = crypto.randomUUID();
    setRound({ instrument, chords: [...selected] });
    setRunning(true);
    setMessage("Starting training…");
    try {
      await engine.current?.start(
        plan.map((c) => pitches(family, c!.frets)),
        interval,
        challenge ? duration : 3600,
        audible,
      );
      if (turn === generation.current)
        setMessage(
          audible
            ? "Local synthesized guide tones playing."
            : "Visual guidance running. No microphone or sound is active.",
        );
    } catch (e) {
      if (turn === generation.current) {
        setRunning(false);
        setError(e instanceof Error ? e.message : "Training unavailable");
      }
    }
  }
  function stop() {
    const value = engine.current?.elapsed() || elapsed;
    invalidate();
    engine.current?.stop();
    setElapsed(value);
    setRunning(false);
    setCompleted(false);
    setMessage("Stopped. Review the round before saving a self-assessment.");
  }
  async function save() {
    if (!round || elapsed < 1 || saved || saving) return;
    setSaving(true);
    setError("");
    try {
      const r = await api.POST("/api/v1/integration/assessments", {
        body: {
          client_key: saveKey.current,
          instrument: round.instrument,
          chords: round.chords,
          kind: challenge ? "challenge" : "transition",
          seconds: Math.min(3600, Math.floor(elapsed)),
          changes,
          difficulty,
          completed,
          notes,
        },
      });
      if (!r.data) throw new Error(apiError(r.error));
      setSaved(true);
      setMessage(
        "Private self-assessment saved. It does not add practice minutes.",
      );
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save assessment");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="panel training-panel">
      <h2>
        {challenge
          ? "Clean chord-change challenge"
          : "Chord transition trainer"}
      </h2>
      <p>
        Choose 2–8 chords, follow the current/next shapes and change at your
        chosen interval. Count clean changes yourself; the app does not listen
        to or judge your playing.
      </p>
      <Feedback error message={error || catalogue.error} />
      <Feedback message={message} />
      {!catalogue.loaded && <p role="status">Loading shared chord shapes…</p>}
      <fieldset disabled={running || saving}>
        <label>
          Training instrument
          <select
            aria-label="Training instrument"
            value={instrument}
            onChange={(e) => {
              setInstrument(e.target.value as Instrument);
              setSelected(["C", "G"]);
            }}
          >
            {["acoustic_guitar", "electric_guitar", "bass", "ukulele"].map(
              (i) => (
                <option key={i} value={i}>
                  {i.replaceAll("_", " ")}
                </option>
              ),
            )}
          </select>
        </label>
        <div className="form-grid">
          {selected.map((name, i) => (
            <label key={i}>
              Chord {i + 1}
              <select
                aria-label={`Chord ${i + 1}`}
                value={name}
                onChange={(e) =>
                  setSelected(
                    selected.map((n, j) => (j === i ? e.target.value : n)),
                  )
                }
              >
                <option value="">Choose a shared chord</option>
                {choices.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <Button
          variant="outline"
          disabled={selected.length >= 8}
          onClick={() =>
            setSelected([
              ...selected,
              choices.find((c) => !selected.includes(c.name))?.name || "",
            ])
          }
        >
          Add transition chord
        </Button>{" "}
        <Button
          variant="outline"
          disabled={selected.length <= 2}
          onClick={() => setSelected(selected.slice(0, -1))}
        >
          Remove last chord
        </Button>
        <div className="form-grid">
          <label>
            Seconds per change
            <input
              type="number"
              min={0.5}
              max={30}
              step={0.5}
              value={interval}
              onChange={(e) => setIntervalSeconds(Number(e.target.value))}
            />
          </label>
          {challenge && (
            <label>
              Challenge seconds
              <input
                type="number"
                min={5}
                max={300}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </label>
          )}
          <label>
            Random sequence difficulty
            <select
              aria-label="Random sequence difficulty"
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
            >
              {["beginner", "intermediate", "advanced"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            try {
              const pool = choices.filter(
                (c) => level === "advanced" || c.difficulty === level,
              );
              setSelected(randomized(pool, selected.length).map((c) => c.name));
              setError("");
            } catch {
              setError(
                "Choose a level with at least two available chord shapes.",
              );
            }
          }}
        >
          Generate random sequence
        </Button>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={audible}
            onChange={(e) => setAudible(e.target.checked)}
          />
          Play synthesized guide chords
        </label>
      </fieldset>
      {!valid && catalogue.loaded && (
        <p role="alert">
          Choose available chords and valid timing. Archived or missing shapes
          cannot start training.
        </p>
      )}
      <div className="training-cards">
        <section>
          <h3>Current chord: {current?.name || "Unavailable"}</h3>
          {current && <Diagram {...current} />}
        </section>
        <section>
          <h3>Next chord: {next?.name || "Unavailable"}</h3>
          {next && <Diagram {...next} />}
        </section>
      </div>
      <p aria-live="off">
        Elapsed: {Math.floor(elapsed)} seconds
        {challenge
          ? ` · Remaining: ${Math.max(0, Math.ceil(duration - elapsed))} seconds`
          : ""}
      </p>
      <Button
        disabled={running || saving || !valid || !catalogue.loaded}
        onClick={() => void start()}
      >
        {challenge ? "Start challenge" : "Start transitions"}
      </Button>{" "}
      <Button variant="outline" disabled={!running} onClick={stop}>
        Stop training
      </Button>
      {round && !running && elapsed >= 1 && (
        <fieldset disabled={saving || saved}>
          <legend>Your self-assessment</legend>
          <p>
            {round.chords.join(" → ")} · {Math.floor(elapsed)} seconds.
            Completion refers to following the exercise, not verified playing
            accuracy.
          </p>
          <label>
            Clean changes (self-reported)
            <input
              type="number"
              min={0}
              max={10000}
              value={changes}
              onChange={(e) => setChanges(Number(e.target.value))}
            />
          </label>
          <label>
            Transition difficulty
            <select
              aria-label="Transition difficulty"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as typeof difficulty)
              }
            >
              {["easy", "steady", "hard"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
            />
            I completed this exercise
          </label>
          <label>
            Training notes
            <textarea
              aria-label="Training notes"
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <Button
            disabled={
              !Number.isInteger(changes) || changes < 0 || changes > 10000
            }
            onClick={() => void save()}
          >
            Save self-assessment
          </Button>
        </fieldset>
      )}
      <p>
        <Link
          href={`/practice?focus=${encodeURIComponent(`${challenge ? "Chord-change challenge" : "Chord transitions"}: ${(round?.chords || selected).join(" → ")}`)}`}
        >
          Start a separate saved practice session
        </Link>
        . Only explicitly saved Practice sessions contribute to practice goals.
      </p>
      <p className="hint">
        Settings lock during a round. Switching tools, leaving this page or
        hiding the tab stops training and releases audio. Guide tones are
        synthesized; no microphone recording is made.
      </p>
    </section>
  );
}
