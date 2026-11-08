"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHydrated } from "@/lib/hydrated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
import { MetronomeAudio, type Options } from "./engine";
import { validBpm, tapTempo } from "./timeline";
export function Metronome() {
  const hydrated = useHydrated();
  const [tempo, setTempo] = useState("100");
  const [meter, setMeter] = useState("4/4");
  const [accent, setAccent] = useState(true);
  const [sound, setSound] = useState<Options["sound"]>("click");
  const [volume, setVolume] = useState(0.5);
  const [visual, setVisual] = useState(true);
  const [beat, setBeat] = useState(-1);
  const [running, setRunning] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(
    "Stopped. Press Start when you are ready.",
  );
  const [error, setError] = useState(false);
  const engine = useRef<MetronomeAudio | null>(null);
  const taps = useRef<number[]>([]);
  const generation = useRef(0);
  const bpm = Number(tempo);
  const beats = Number(meter.split("/")[0]);
  const invalidate = useCallback(() => {
    generation.current += 1;
  }, []);
  useEffect(() => {
    const audio = new MetronomeAudio();
    engine.current = audio;
    audio.onBeat = setBeat;
    audio.onInterrupted = (text) => {
      setMessage(text);
      if (text.startsWith("Audio paused")) {
        generation.current++;
        setRunning(false);
        setPending(false);
        setBeat(-1);
      }
    };
    return () => {
      invalidate();
      audio.onBeat = undefined;
      audio.onInterrupted = undefined;
      audio.stop();
    };
  }, [invalidate]);
  useEffect(() => {
    if (validBpm(bpm))
      engine.current?.configure({ bpm, beats, accent, sound, volume });
  }, [bpm, beats, accent, sound, volume]);
  function stop() {
    generation.current++;
    engine.current?.stop();
    setPending(false);
    setRunning(false);
    setBeat(-1);
    setMessage("Stopped. Audio resources released.");
    setError(false);
  }
  async function start() {
    if (!validBpm(bpm)) return;
    const turn = ++generation.current;
    setPending(true);
    setError(false);
    setMessage("Starting audio…");
    try {
      if (!window.AudioContext)
        throw new Error("Web Audio is unavailable in this browser.");
      engine.current?.configure({ bpm, beats, accent, sound, volume });
      await engine.current?.start();
      if (turn !== generation.current) return;
      setRunning(true);
      setPending(false);
      setMessage("Running. Audio-clock scheduling is active.");
    } catch (e) {
      if (turn !== generation.current) return;
      setPending(false);
      setRunning(false);
      setError(true);
      setMessage(
        e instanceof Error ? e.message : "Unable to start audio. Try again.",
      );
    }
  }
  function tap() {
    const now = performance.now();
    const history = taps.current;
    if (history.length && now - history.at(-1)! > 2100) history.length = 0;
    history.push(now);
    if (history.length > 7) history.shift();
    const next = tapTempo(history);
    if (next) {
      setTempo(String(next));
      setMessage(`Tap tempo set to ${next} BPM.`);
    } else
      setMessage(
        "Tap at least twice, evenly, between 30 and 300 clicks per minute.",
      );
  }
  return (
    <section className="panel narrow">
      <p className="eyebrow">Guest rhythm tool</p>
      <h1>Keep your time.</h1>
      <label>
        Tempo (BPM)
        <Input
          type="number"
          min={30}
          max={300}
          step={1}
          value={tempo}
          onChange={(e) => {
            setTempo(e.target.value);
            if (!validBpm(Number(e.target.value)) && (running || pending))
              stop();
          }}
          aria-describedby="tempo-help"
        />
      </label>
      <p id="tempo-help" className="hint">
        30–300 whole-number clicks per minute. In 6/8, each click is an eighth
        note; in /4 meters, each is a quarter note.
      </p>
      <label>
        Tempo slider
        <Input
          type="range"
          min={30}
          max={300}
          step={1}
          value={validBpm(bpm) ? bpm : 100}
          onChange={(e) => setTempo(e.target.value)}
        />
      </label>
      <Button variant="outline" onClick={tap}>
        Tap tempo
      </Button>
      <label>
        Time signature
        <select
          value={meter}
          onChange={(e) => {
            stop();
            setMeter(e.target.value);
          }}
        >
          <option>2/4</option>
          <option>3/4</option>
          <option>4/4</option>
          <option>6/8</option>
        </select>
      </label>
      <label>
        Click sound
        <select
          value={sound}
          onChange={(e) => setSound(e.target.value as Options["sound"])}
        >
          <option value="click">Clear click</option>
          <option value="wood">Soft triangle</option>
        </select>
      </label>
      <label>
        Volume
        <Input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={accent}
          onChange={(e) => setAccent(e.target.checked)}
        />
        Accent first beat
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={visual}
          onChange={(e) => setVisual(e.target.checked)}
        />
        Show visual beats
      </label>
      {visual && (
        <ol
          aria-label="Beat indicator"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            padding: 0,
            listStyle: "none",
            marginBlock: 24,
          }}
        >
          {Array.from({ length: beats }, (_, i) => (
            <li
              key={i}
              aria-current={beat === i ? "step" : undefined}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "50%",
                width: 36,
                height: 36,
                textAlign: "center",
                lineHeight: "34px",
                background: beat === i ? "var(--accent)" : "transparent",
                color: beat === i ? "var(--accent-ink)" : "var(--ink)",
              }}
            >
              {i + 1}
            </li>
          ))}
        </ol>
      )}
      <p aria-live="off" style={{ textAlign: "center" }}>
        Beat {beat < 0 ? "—" : beat + 1} of {beats} · {meter}
      </p>
      <Feedback
        error={error || !validBpm(bpm)}
        message={
          !validBpm(bpm)
            ? "Enter a whole-number tempo from 30 to 300 BPM."
            : message
        }
      />
      <Button
        disabled={!hydrated || running || pending || !validBpm(bpm)}
        onClick={() => void start()}
      >
        {pending ? "Starting…" : "Start metronome"}
      </Button>{" "}
      <Button disabled={!running && !pending} variant="outline" onClick={stop}>
        Stop metronome
      </Button>
      <p className="hint">
        Clicks are scheduled ahead on the audio clock. Brief UI work is
        tolerated, but hidden tabs, device sleep and long browser stalls can
        interrupt playback. Change time signature while stopped; start again
        after an interruption. No microphone or account is needed.
      </p>
    </section>
  );
}
