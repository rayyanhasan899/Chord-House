"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { tuning, noteName, type Instrument } from "@/features/chords/music";
import { EarAudio } from "./audio";
import { fretNote } from "./domain";
export function NoteFinder() {
  const [instrument, setInstrument] = useState<Instrument>("guitar");
  const [preset, setPreset] = useState("standard");
  const [string, setString] = useState(0),
    [fret, setFret] = useState(0);
  const [error, setError] = useState("");
  const engine = useRef<EarAudio | null>(null);
  useEffect(() => {
    const audio = new EarAudio();
    engine.current = audio;
    return () => audio.stop();
  }, []);
  const strings =
    instrument === "guitar" && preset === "drop_d"
      ? [38, 45, 50, 55, 59, 64]
      : instrument === "guitar" && preset === "dadgad"
        ? [38, 45, 50, 55, 57, 62]
        : tuning[instrument];
  const valid = Number.isInteger(fret) && fret >= 0 && fret <= 24;
  const note = valid ? fretNote(strings[string] ?? strings[0], fret) : null;
  function change() {
    engine.current?.stop();
    setError("");
  }
  return (
    <section className="panel">
      <h2>Fretboard note finder</h2>
      <p>
        Choose a string and fret to calculate its note. String numbers use the
        usual highest-string-as-1 convention; ukulele supports re-entrant G4.
      </p>
      <div className="form-grid">
        <label>
          Finder instrument
          <select
            aria-label="Finder instrument"
            value={instrument}
            onChange={(e) => {
              change();
              setInstrument(e.target.value as Instrument);
              setString(0);
              setPreset("standard");
            }}
          >
            {["guitar", "bass", "ukulele"].map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
        {instrument === "guitar" && (
          <label>
            Finder tuning
            <select
              aria-label="Finder tuning"
              value={preset}
              onChange={(e) => {
                change();
                setPreset(e.target.value);
              }}
            >
              <option value="standard">Standard</option>
              <option value="drop_d">Drop D</option>
              <option value="dadgad">DADGAD</option>
            </select>
          </label>
        )}
        <label>
          String
          <select
            aria-label="String"
            value={string}
            onChange={(e) => {
              change();
              setString(Number(e.target.value));
            }}
          >
            {strings.map((midi, i) => (
              <option key={i} value={i}>
                String {strings.length - i} · open {noteName(midi)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fret
          <input
            type="number"
            min={0}
            max={24}
            step={1}
            value={fret}
            onChange={(e) => {
              change();
              setFret(Number(e.target.value));
            }}
          />
        </label>
      </div>
      {note ? (
        <>
          <p role="status">
            Note: <strong>{note.name}</strong> · {note.hz.toFixed(2)} Hz
          </p>
          <Button
            onClick={() =>
              void engine.current
                ?.play([note.midi], false)
                .catch((e) =>
                  setError(
                    e instanceof Error ? e.message : "Audio unavailable",
                  ),
                )
            }
          >
            Play found note
          </Button>{" "}
          <Button variant="outline" onClick={() => engine.current?.stop()}>
            Stop finder audio
          </Button>
        </>
      ) : (
        <p role="alert">Choose a whole fret from 0 to 24.</p>
      )}
      <Feedback error message={error} />
      <p className="hint">
        Generated reference tone at A4 = 440 Hz; no microphone is used.
      </p>
    </section>
  );
}
