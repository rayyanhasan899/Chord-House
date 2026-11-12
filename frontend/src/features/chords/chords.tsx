"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
import { Diagram } from "./diagram";
import { ChordAudio } from "./audio";
import { useHydrated } from "@/lib/hydrated";
import { useReferences } from "@/features/content/references";
import {
  tuning,
  search,
  qualities,
  validate,
  pitches,
  noteName,
  type Instrument,
  type Voicing,
} from "./music";
type Saved = components["schemas"]["ChordView"];
export function Chords() {
  const hydrated = useHydrated();
  const auth = useAuth();
  const catalogue = useReferences("chord");
  const [instrument, setInstrument] = useState<Instrument>("guitar");
  const [query, setQuery] = useState("");
  const [quality, setQuality] = useState("");
  const [name, setName] = useState("C");
  const [frets, setFrets] = useState([-1, 3, 2, 0, 1, 0]);
  const [fingers, setFingers] = useState([0, 3, 2, 0, 1, 0]);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const playback = useRef(0);
  const [arpeggio, setArpeggio] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audio = useRef<ChordAudio | null>(null);
  useEffect(() => {
    const a = new ChordAudio();
    audio.current = a;
    a.onEnded = () => setPlaying(false);
    return () => {
      a.onEnded = undefined;
      a.stop();
    };
  }, []);
  useEffect(() => {
    if (!auth.profile) return;
    let active = true;
    async function fetchSaved() {
      const all: Saved[] = [];
      for (let offset = 0; ; offset += 100) {
        const r = await api.GET("/api/v1/custom-chords", {
          params: { query: { offset, limit: 100 } },
        });
        if (!r.data) throw new Error(apiError(r.error));
        all.push(...r.data);
        if (r.data.length < 100) return all;
      }
    }
    fetchSaved()
      .then((rows) => {
        if (active) setSaved(rows);
      })
      .catch(() => {
        if (active)
          setMessage("Saved chords could not be loaded. Refresh to retry.");
      });
    return () => {
      active = false;
    };
  }, [auth.profile]);
  const error = validate(instrument, frets, fingers);
  const entries = catalogue.rows.map(
    (row) =>
      ({
        ...row.document,
        source: "Managed shared catalogue",
        key: row.key,
      }) as unknown as Voicing & { key: string },
  );
  const results = search(query, instrument, quality, entries);
  const notes = pitches(instrument, frets);
  function stop() {
    playback.current++;
    audio.current?.stop();
    setPlaying(false);
    setStarting(false);
  }
  async function save() {
    if (error) {
      setMessage(error);
      return;
    }
    setBusy(true);
    try {
      const body = { name, instrument, frets, fingers };
      const r = identifier
        ? await api.PUT("/api/v1/custom-chords/{identifier}", {
            params: { path: { identifier } },
            body,
          })
        : await api.POST("/api/v1/custom-chords", { body });
      if (!r.data) throw new Error(apiError(r.error));
      const chord = r.data;
      setSaved((old) => [...old.filter((c) => c.id !== chord.id), chord]);
      setIdentifier(chord.id);
      setMessage("Private chord saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!confirm("Delete this private chord?")) return;
    setBusy(true);
    try {
      const r = await api.DELETE("/api/v1/custom-chords/{identifier}", {
        params: { path: { identifier: id } },
      });
      if (!r.response.ok) throw new Error(apiError(r.error));
      setSaved((old) => old.filter((c) => c.id !== id));
      setIdentifier(null);
      setMessage("Private chord deleted.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to delete");
    } finally {
      setBusy(false);
    }
  }
  function load(
    c: {
      name: string;
      instrument: Instrument;
      frets: number[];
      fingers: number[];
    },
    id: string | null,
  ) {
    stop();
    setName(c.name);
    setInstrument(c.instrument);
    setFrets([...c.frets]);
    setFingers([...c.fingers]);
    setIdentifier(id);
    setMessage("");
  }
  return (
    <>
      <p className="eyebrow">Public chord library</p>
      <h1>Find your next chord.</h1>
      <p>
        Standard acoustic/electric guitar, four-string bass and re-entrant
        ukulele. All audio is synthesized locally.
      </p>
      <div className="form-grid">
        <label>
          Instrument
          <select
            value={instrument}
            onChange={(e) => {
              const i = e.target.value as Instrument;
              load(search("", i, "")[0], null);
            }}
          >
            <option value="guitar">Acoustic / electric guitar</option>
            <option value="bass">Bass guitar</option>
            <option value="ukulele">Ukulele</option>
          </select>
        </label>
        <label>
          Search chord
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="C, Am, G, D, F, Bb..."
          />
        </label>
        <label>
          Chord quality
          <select value={quality} onChange={(e) => setQuality(e.target.value)}>
            <option value="">All</option>
            {Object.keys(qualities).map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="account-grid" style={{ marginTop: "2rem" }}>
        <section className="panel">
          <h2>Voicings ({results.length})</h2>
          {!catalogue.loaded && <p role="status">Loading shared chords…</p>}
          <Feedback error message={catalogue.error} />
          {auth.profile && (
            <Link href="/reports?kind=chord">
              Report a chord problem (use its catalogue code below)
            </Link>
          )}
          {catalogue.loaded && !catalogue.error && !results.length && (
            <p>
              No matching voicings for this instrument/quality. Try another
              search.
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              maxHeight: 360,
              overflowY: "auto",
            }}
          >
            {results.map((c, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => load(c, null)}
              >
                {c.name} · {c.difficulty} · fret{" "}
                {Math.min(...c.frets.filter((f) => f >= 0))}
                <small> · {entries.find((e) => e === c)?.key}</small>
              </Button>
            ))}
          </div>
          <p className="hint">
            Original structured shapes and mathematical transpositions; chord
            tones are automatically checked. Suggested fingers may use barres
            and are not expert-reviewed. Use the lowest comfortable position and
            stop if a stretch hurts.
          </p>
        </section>
        <section className="panel">
          <h2>
            {identifier ? "Edit private chord" : "Visualizer & custom builder"}
          </h2>
          <label>
            Chord name
            <Input
              value={name}
              maxLength={80}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </label>
          <p>
            Read strings in instrument order: guitar 6→1, bass 4→1, ukulele 4→1.
            X means muted; O means open. Finger 1=index, 2=middle, 3=ring,
            4=little.
          </p>
          <Diagram
            instrument={instrument}
            frets={frets}
            fingers={fingers}
            name={name}
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%" }}>
              <caption>{name} chord diagram and editable fretboard</caption>
              <thead>
                <tr>
                  <th scope="col">String / open note</th>
                  <th scope="col">Fret</th>
                  <th scope="col">Finger</th>
                  <th scope="col">Sounding note</th>
                </tr>
              </thead>
              <tbody>
                {tuning[instrument].map((midi, index) => (
                  <tr key={index}>
                    <th scope="row">
                      {tuning[instrument].length - index}: {noteName(midi)}
                    </th>
                    <td>
                      <select
                        aria-label={`String ${index + 1} fret`}
                        value={frets[index]}
                        onChange={(e) => {
                          stop();
                          const f = Number(e.target.value);
                          setFrets(frets.map((v, i) => (i === index ? f : v)));
                          setFingers(
                            fingers.map((v, i) =>
                              i === index ? (f > 0 ? v || 1 : 0) : v,
                            ),
                          );
                        }}
                      >
                        {Array.from({ length: 26 }, (_, n) => n - 1).map(
                          (f) => (
                            <option key={f} value={f}>
                              {f === -1 ? "X muted" : f === 0 ? "O open" : f}
                            </option>
                          ),
                        )}
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label={`String ${index + 1} finger`}
                        value={fingers[index]}
                        onChange={(e) =>
                          setFingers(
                            fingers.map((v, i) =>
                              i === index ? Number(e.target.value) : v,
                            ),
                          )
                        }
                      >
                        {[0, 1, 2, 3, 4].map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {frets[index] < 0
                        ? "Muted"
                        : noteName(midi + frets[index])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Notes: {[...new Set(notes.map(noteName))].join(", ")}</p>
          <p>
            Repeated finger numbers indicate a barre; a finger cannot span an
            open or lower-fretted string. Custom names are your labels, not
            verified chord identification.
          </p>
          <Feedback error={!!error} message={error || message} />
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
              checked={arpeggio}
              onChange={(e) => setArpeggio(e.target.checked)}
            />
            Arpeggio
          </label>
          <Button
            disabled={!hydrated || !!error || starting}
            onClick={async () => {
              const turn = ++playback.current;
              setStarting(true);
              setPlaying(false);
              try {
                setMessage("");
                if (!audio.current) throw new Error("Audio is not ready");
                await audio.current.play(notes, arpeggio, volume);
                if (turn !== playback.current) return;
                setPlaying(true);
              } catch {
                if (turn !== playback.current) return;
                setMessage(
                  "Audio is unavailable. Try again after interacting with the page.",
                );
                setPlaying(false);
              } finally {
                if (turn === playback.current) setStarting(false);
              }
            }}
          >
            Play chord
          </Button>{" "}
          <Button
            disabled={!playing && !starting}
            variant="outline"
            onClick={stop}
          >
            Stop chord
          </Button>
          <p role="status">
            {starting
              ? "Starting audio…"
              : playing
                ? "Audio playing"
                : "Audio stopped"}
          </p>
          {auth.profile ? (
            <>
              <Button
                disabled={busy || !!error || !name.trim()}
                onClick={() => void save()}
              >
                {identifier ? "Update private chord" : "Save private chord"}
              </Button>
              {identifier && (
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => {
                    setIdentifier(null);
                    setMessage("Save as a new private chord.");
                  }}
                >
                  Save as new
                </Button>
              )}
            </>
          ) : (
            <p>
              <Link href="/login">Sign in</Link> to save private chords. The
              builder and audio work without an account.
            </p>
          )}
        </section>
      </div>
      {auth.profile && (
        <section className="panel" style={{ marginTop: 24 }}>
          <h2>My private chords</h2>
          {!saved.length && <p>No private chords saved yet.</p>}
          {saved.map((c) => (
            <div key={c.id}>
              <Button variant="outline" onClick={() => load(c, c.id)}>
                {c.name} ({c.instrument})
              </Button>{" "}
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void remove(c.id)}
              >
                Delete {c.name}
              </Button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
