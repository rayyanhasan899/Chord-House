"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Metronome } from "@/features/metronome/metronome";
import { Diagram } from "@/features/chords/diagram";
import { library, pitches } from "@/features/chords/music";
import { PatternAudio } from "@/features/patterns/audio";
import { countLabel, symbols } from "@/features/patterns/rhythm";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import type { Activity, Instrument, Sources } from "./types";
import { kind } from "./types";

function GuidedPattern({
  activity,
  instrument,
  sources,
}: {
  activity: Activity;
  instrument: Instrument;
  sources: Sources;
}) {
  const player = useRef<PatternAudio | null>(null);
  const generation = useRef(0);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  const [pending, setPending] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(-1);
  useEffect(() => {
    const audio = new PatternAudio();
    player.current = audio;
    audio.onStep = setStep;
    audio.onInterrupted = (text) => {
      setMessage(text);
      if (text.startsWith("Audio paused")) setPlaying(false);
    };
    return () => {
      invalidate();
      audio.onStep = undefined;
      audio.onInterrupted = undefined;
      audio.stop();
    };
  }, [invalidate]);
  const pattern = sources.patterns.find((p) => p.id === activity.pattern_id);
  const custom = sources.chords.find(
    (c) => c.id === activity.chord_id && c.instrument === kind(instrument),
  );
  const chord =
    custom ||
    (activity.chord_id
      ? undefined
      : library.find(
          (c) =>
            c.instrument === kind(instrument) &&
            c.name === (activity.chord_name || "C"),
        ));
  if (!pattern)
    return (
      <p>
        Linked pattern is unavailable. Open your{" "}
        <Link href="/patterns" target="_blank" rel="noreferrer">
          pattern library
        </Link>{" "}
        to review it.
      </p>
    );
  async function play() {
    if (!pattern || !chord || pending || playing) return;
    const turn = ++generation.current;
    setPending(true);
    try {
      await player.current?.play(
        {
          ...pattern,
          tempo_min: pattern.tempo_min ?? 60,
          tempo_max: pattern.tempo_max ?? 140,
        },
        activity.bpm || 100,
        pitches(kind(instrument), chord.frets),
        true,
        true,
        true,
        0.5,
      );
      if (turn !== generation.current) return;
      setPlaying(true);
      setMessage("Pattern and metronome playing on one audio clock.");
    } catch (e) {
      if (turn !== generation.current) return;
      setMessage(e instanceof Error ? e.message : "Audio unavailable");
    } finally {
      if (turn === generation.current) setPending(false);
    }
  }
  return (
    <section>
      <h3>{pattern.name}</h3>
      <p>{pattern.strokes.map((s) => symbols[s]).join(" · ")}</p>
      <p aria-live="off">
        Current count: {step < 0 ? "—" : countLabel(step, pattern.subdivision)}
      </p>
      <p>Practice chord: {chord?.name || "No compatible voicing available"}</p>
      <Button
        disabled={playing || pending || !chord}
        onClick={() => void play()}
      >
        Play guided pattern
      </Button>{" "}
      <Button
        variant="outline"
        disabled={!playing && !pending}
        onClick={() => {
          generation.current++;
          setPending(false);
          player.current?.stop();
          setPlaying(false);
          setStep(-1);
        }}
      >
        Stop guided pattern
      </Button>
      <Feedback message={message} />
    </section>
  );
}

export function GuidedTools({
  activity,
  instrument,
  sources,
}: {
  activity: Activity;
  instrument: Instrument;
  sources: Sources;
}) {
  const chord =
    sources.chords.find(
      (c) => c.id === activity.chord_id && c.instrument === kind(instrument),
    ) ||
    (activity.chord_id
      ? undefined
      : library.find(
          (c) =>
            c.instrument === kind(instrument) &&
            c.name === (activity.chord_name || "C"),
        ));
  const song = sources.songs.find((s) => s.id === activity.song_id);
  return (
    <div className="guided-tools">
      {activity.tool === "pattern" ? (
        <GuidedPattern
          activity={activity}
          instrument={instrument}
          sources={sources}
        />
      ) : (
        <>
          {(activity.tool === "chords" ||
            activity.chord_id ||
            activity.chord_name) && (
            <section>
              <h3>
                Chord practice:{" "}
                {chord?.name || activity.chord_name || "Unavailable"}
              </h3>
              {chord ? (
                <Diagram
                  name={chord.name}
                  frets={chord.frets}
                  fingers={chord.fingers}
                  instrument={kind(instrument)}
                />
              ) : (
                <p>
                  No compatible diagram. Use the{" "}
                  <Link href="/chords" target="_blank" rel="noreferrer">
                    chord builder
                  </Link>{" "}
                  to choose another shape.
                </p>
              )}
            </section>
          )}
          {(activity.tool === "metronome" || activity.tool === "chords") && (
            <Metronome initialTempo={activity.bpm || 100} />
          )}
        </>
      )}
      {activity.song_id && (
        <p>
          {song ? (
            <Link href={`/songs/${song.id}`} target="_blank" rel="noreferrer">
              Open {song.title} in a new tab
            </Link>
          ) : (
            "Linked song is currently unavailable. You can continue free practice."
          )}
        </p>
      )}
      {activity.tool === "tuner" && (
        <p>
          <Link href="/tuner" target="_blank" rel="noreferrer">
            Open tuner in a new tab
          </Link>
          . Microphone permission is requested only when you start the tuner.
        </p>
      )}
      <p className="hint">
        Audio starts separately and closes when you pause, end or change
        activities. The practice timer continues across tabs until paused, ended
        or its target is reached.
      </p>
    </div>
  );
}
