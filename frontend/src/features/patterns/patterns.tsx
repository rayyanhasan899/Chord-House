"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
import { library, pitches, type Instrument } from "@/features/chords/music";
import { PatternAudio } from "./audio";
import { countLabel, symbols, validateRhythm } from "./rhythm";
type Pattern = components["schemas"]["PatternView"];
type Draft = components["schemas"]["PatternInput"];
const initial: Draft = {
  name: "My pattern",
  meter: "4/4",
  subdivision: 2,
  strokes: ["D", "R", "D", "U", "R", "U", "D", "U"],
  tempo_min: 60,
  tempo_max: 140,
  difficulty: "beginner",
  style: "General",
  description: "",
};
export function Patterns() {
  const [rows, setRows] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState("");
  const [meterFilter, setMeterFilter] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [styleFilter, setStyleFilter] = useState("");
  const [tempoFilter, setTempoFilter] = useState("");
  const [favorites, setFavorites] = useState(false);
  const [draft, setDraft] = useState<Draft>(initial);
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [source, setSource] = useState("Your private draft");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tempo, setTempo] = useState("100");
  const [loop, setLoop] = useState(true);
  const [accent, setAccent] = useState(true);
  const [metronome, setMetronome] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(-1);
  const [instrument, setInstrument] = useState<Instrument>("guitar");
  const [chordIndex, setChordIndex] = useState(0);
  const audio = useRef<PatternAudio | null>(null);
  const generation = useRef(0);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    const player = new PatternAudio();
    audio.current = player;
    player.onStep = setStep;
    player.onEnded = () => {
      setPlaying(false);
      setStep(-1);
      setMessage("Measure finished. Audio released.");
    };
    player.onInterrupted = (text) => {
      setMessage(text);
      if (text.startsWith("Audio paused")) {
        generation.current++;
        setPlaying(false);
        setPending(false);
        setStep(-1);
      }
    };
    return () => {
      invalidate();
      player.onStep = undefined;
      player.onEnded = undefined;
      player.onInterrupted = undefined;
      player.stop();
    };
  }, [invalidate]);
  useEffect(() => {
    let active = true;
    async function load() {
      const all: Pattern[] = [];
      for (let offset = 0; ; offset += 100) {
        const r = await api.GET("/api/v1/patterns", {
          params: { query: { offset, limit: 100 } },
        });
        if (!r.data) throw new Error(apiError(r.error));
        all.push(...r.data);
        if (r.data.length < 100) return all;
      }
    }
    load()
      .then((all) => {
        if (active) {
          setRows(all);
          setLoading(false);
          setLoadError("");
        }
      })
      .catch((e) => {
        if (active) {
          setLoading(false);
          setLoadError(
            e instanceof Error ? e.message : "Unable to load patterns",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  function stop() {
    generation.current++;
    audio.current?.stop();
    setPlaying(false);
    setPending(false);
    setStep(-1);
  }
  function change(patch: Partial<Draft>) {
    stop();
    setDraft((old) => ({ ...old, ...patch }));
  }
  function resize(meter: Draft["meter"], subdivision: number) {
    change({
      meter,
      subdivision,
      strokes: Array.from(
        { length: Number(meter[0]) * subdivision },
        (_, i) => draft.strokes[i] || "R",
      ),
    });
  }
  const rhythmError = validateRhythm({
    ...draft,
    tempo_min: draft.tempo_min ?? 60,
    tempo_max: draft.tempo_max ?? 140,
  });
  const valid = !rhythmError && !!draft.name.trim() && !!draft.style?.trim();
  const bpm = Number(tempo);
  const validTempo = Number.isInteger(bpm) && bpm >= 30 && bpm <= 300;
  const chords = library.filter((c) => c.instrument === instrument);
  const chord = chords[chordIndex] || chords[0];
  async function play() {
    stop();
    const turn = ++generation.current;
    setPending(true);
    setError(false);
    setMessage("Starting audio…");
    try {
      await audio.current?.play(
        {
          ...draft,
          tempo_min: draft.tempo_min ?? 60,
          tempo_max: draft.tempo_max ?? 140,
        },
        bpm,
        pitches(instrument, chord.frets),
        loop,
        accent,
        metronome,
        volume,
      );
      if (turn === generation.current) {
        setPending(false);
        setPlaying(true);
        setMessage("Playing pattern.");
      }
    } catch (e) {
      if (turn === generation.current) {
        setPending(false);
        setError(true);
        setMessage(e instanceof Error ? e.message : "Unable to play");
      }
    }
  }
  function load(row: Pattern) {
    stop();
    const {
      name,
      meter,
      subdivision,
      strokes,
      tempo_min,
      tempo_max,
      difficulty,
      style,
      description,
    } = row;
    setDraft({
      name,
      meter,
      subdivision,
      strokes: [...strokes],
      tempo_min,
      tempo_max,
      difficulty,
      style,
      description,
    });
    setIdentifier(row.status === "private" ? row.id : null);
    setSource(
      row.status === "private"
        ? "Your private pattern"
        : `${row.attribution}. ${row.rights_statement}`,
    );
    setMessage(
      row.status === "private"
        ? "Private pattern opened."
        : "Exercise opened. Saving creates your own private copy.",
    );
    setError(false);
    document.getElementById("pattern-editor")?.focus();
  }
  async function save() {
    setBusy(true);
    setError(false);
    try {
      const r = identifier
        ? await api.PUT("/api/v1/patterns/{identifier}", {
            params: { path: { identifier } },
            body: draft,
          })
        : await api.POST("/api/v1/patterns", { body: draft });
      if (!r.data) throw new Error(apiError(r.error));
      const row = r.data;
      setRows((old) => [
        ...old.filter((p) => p.id !== row.id),
        {
          ...row,
          favorite: old.find((p) => p.id === row.id)?.favorite ?? false,
        },
      ]);
      setIdentifier(row.id);
      setSource("Your private pattern");
      setMessage("Private pattern saved.");
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  async function favorite(row: Pattern) {
    setBusy(true);
    setError(false);
    try {
      const params = { params: { path: { identifier: row.id } } };
      const r = row.favorite
        ? await api.DELETE("/api/v1/patterns/{identifier}/favorite", params)
        : await api.PUT("/api/v1/patterns/{identifier}/favorite", params);
      if (!r.response.ok) throw new Error(apiError(r.error));
      setRows((old) =>
        old.map((p) =>
          p.id === row.id ? { ...p, favorite: !row.favorite } : p,
        ),
      );
      setMessage(row.favorite ? "Favorite removed." : "Pattern favorited.");
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Unable to favorite");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!identifier || !confirm("Delete this private pattern?")) return;
    setBusy(true);
    setError(false);
    try {
      const r = await api.DELETE("/api/v1/patterns/{identifier}", {
        params: { path: { identifier } },
      });
      if (!r.response.ok) throw new Error(apiError(r.error));
      stop();
      setRows((old) => old.filter((p) => p.id !== identifier));
      setIdentifier(null);
      setDraft(initial);
      setSource("Your private draft");
      setMessage("Private pattern deleted.");
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Unable to delete");
    } finally {
      setBusy(false);
    }
  }
  const filtered = rows.filter(
    (p) =>
      `${p.name} ${p.description}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!meterFilter || p.meter === meterFilter) &&
      (!difficulty || p.difficulty === difficulty) &&
      (!styleFilter || p.style === styleFilter) &&
      (!tempoFilter ||
        (Number(tempoFilter) >= (p.tempo_min ?? 60) &&
          Number(tempoFilter) <= (p.tempo_max ?? 140))) &&
      (!favorites || p.favorite),
  );
  return (
    <>
      <section className="panel">
        <p className="eyebrow">Rhythm library</p>
        <h1>Find your strum.</h1>
        <p>
          Original one-measure exercises, plus your private patterns. Start
          slowly, keep the hand moving and let rests pass silently.
        </p>
        <div className="form-grid">
          <label>
            Search patterns
            <Input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label>
            Filter meter
            <select
              value={meterFilter}
              onChange={(e) => setMeterFilter(e.target.value)}
            >
              <option value="">All meters</option>
              {["2/4", "3/4", "4/4", "6/8"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Filter difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">All levels</option>
              {["beginner", "intermediate", "advanced"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Filter style
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
            >
              <option value="">All styles</option>
              {[...new Set(rows.map((r) => r.style))].sort().map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Suggested tempo contains
            <Input
              type="number"
              min={30}
              max={300}
              value={tempoFilter}
              onChange={(e) => setTempoFilter(e.target.value)}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={favorites}
              onChange={(e) => setFavorites(e.target.checked)}
            />
            Favorites only
          </label>
        </div>
        {loading && <p role="status">Loading patterns…</p>}
        <Feedback error message={loadError} />
        {loadError && (
          <Button
            onClick={() => {
              setLoading(true);
              setRefresh((n) => n + 1);
            }}
          >
            Retry loading
          </Button>
        )}
        {!loading && !loadError && filtered.length === 0 && (
          <p>
            No patterns match. Clear filters or create a private pattern below.
          </p>
        )}
        <ul className="pattern-library">
          {filtered.map((p) => (
            <li key={p.id}>
              <h2>{p.name}</h2>
              <p>
                {p.meter} · {p.difficulty} · {p.style} · {p.tempo_min}–
                {p.tempo_max} BPM ·{" "}
                {p.status === "private" ? "Private" : "Shared exercise"}
              </p>
              <p aria-label={`Strokes: ${p.strokes.join(" ")}`}>
                {p.strokes.map((s) => symbols[s].split(" ")[0]).join(" ")}
              </p>
              <Button variant="outline" onClick={() => load(p)}>
                Open {p.name}
              </Button>{" "}
              <Button
                variant="outline"
                disabled={busy}
                aria-pressed={p.favorite}
                onClick={() => void favorite(p)}
              >
                {p.favorite ? "Unfavorite" : "Favorite"} {p.name}
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2 id="pattern-editor" tabIndex={-1}>
          Pattern editor & player
        </h2>
        <p>{source}</p>
        <p>
          ↓ D = downstroke, ↑ U = upstroke, — R = rest (silent hand movement), ×
          X = muted percussive stroke. Counts divide each denominator-note beat
          into equal steps. In 6/8, BPM counts eighth notes; accents fall on
          counts 1 and 4.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            stop();
            setDraft(initial);
            setIdentifier(null);
            setSource("Your private draft");
            setMessage("New private draft.");
          }}
        >
          New private pattern
        </Button>
        <div className="form-grid">
          <label>
            Pattern name
            <Input
              maxLength={80}
              value={draft.name}
              onChange={(e) => change({ name: e.target.value })}
            />
          </label>
          <label>
            Pattern meter
            <select
              value={draft.meter}
              onChange={(e) =>
                resize(e.target.value as Draft["meter"], draft.subdivision)
              }
            >
              {["2/4", "3/4", "4/4", "6/8"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Steps per beat
            <select
              value={draft.subdivision}
              onChange={(e) => resize(draft.meter, Number(e.target.value))}
            >
              {[1, 2, 4].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Pattern difficulty
            <select
              value={draft.difficulty}
              onChange={(e) =>
                change({ difficulty: e.target.value as Draft["difficulty"] })
              }
            >
              {["beginner", "intermediate", "advanced"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Pattern style
            <Input
              maxLength={40}
              value={draft.style}
              onChange={(e) => change({ style: e.target.value })}
            />
          </label>
          <label>
            Suggested minimum BPM
            <Input
              type="number"
              value={draft.tempo_min}
              onChange={(e) => change({ tempo_min: Number(e.target.value) })}
            />
          </label>
          <label>
            Suggested maximum BPM
            <Input
              type="number"
              value={draft.tempo_max}
              onChange={(e) => change({ tempo_max: Number(e.target.value) })}
            />
          </label>
        </div>
        <label>
          Playing guidance
          <textarea
            maxLength={2000}
            value={draft.description}
            onChange={(e) => change({ description: e.target.value })}
          />
        </label>
        <ol className="stroke-grid" aria-label="Rhythm steps">
          {draft.strokes.map((stroke, i) => (
            <li key={i} aria-current={step === i ? "step" : undefined}>
              <label>
                Count {countLabel(i, draft.subdivision)}
                <select
                  aria-label={`Stroke ${i + 1}, count ${countLabel(i, draft.subdivision)}`}
                  value={stroke}
                  onChange={(e) =>
                    change({
                      strokes: draft.strokes.map((s, j) =>
                        j === i ? (e.target.value as typeof stroke) : s,
                      ),
                    })
                  }
                >
                  {Object.entries(symbols).map(([s, label]) => (
                    <option key={s} value={s}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ol>
        <p aria-live="off">
          Current step:{" "}
          {step < 0
            ? "Stopped"
            : `${countLabel(step, draft.subdivision)} · ${symbols[draft.strokes[step]]}`}
        </p>
        <Feedback
          error
          message={
            rhythmError ||
            (!draft.name.trim()
              ? "Enter a pattern name."
              : !draft.style?.trim()
                ? "Enter a style."
                : "")
          }
        />
        <Button disabled={!valid || busy} onClick={() => void save()}>
          {busy
            ? "Working…"
            : identifier
              ? "Save private changes"
              : "Save private pattern"}
        </Button>{" "}
        {identifier && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void remove()}
          >
            Delete private pattern
          </Button>
        )}
        <h3>Hear and practice</h3>
        <div className="form-grid">
          <label>
            Playback BPM
            <Input
              type="number"
              min={30}
              max={300}
              value={tempo}
              onChange={(e) => {
                stop();
                setTempo(e.target.value);
              }}
            />
          </label>
          <label>
            Chord instrument
            <select
              value={instrument}
              onChange={(e) => {
                stop();
                setInstrument(e.target.value as Instrument);
                setChordIndex(0);
              }}
            >
              {["guitar", "bass", "ukulele"].map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
          <label>
            Practice chord
            <select
              value={chordIndex}
              onChange={(e) => {
                stop();
                setChordIndex(Number(e.target.value));
              }}
            >
              {chords.map((c, i) => (
                <option key={i} value={i}>
                  {c.name} · variation {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pattern volume
            <Input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                stop();
                setVolume(Number(e.target.value));
              }}
            />
          </label>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => {
              stop();
              setLoop(e.target.checked);
            }}
          />
          Loop pattern
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={accent}
            onChange={(e) => {
              stop();
              setAccent(e.target.checked);
            }}
          />
          Accent strong beats
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={metronome}
            onChange={(e) => {
              stop();
              setMetronome(e.target.checked);
            }}
          />
          Include synchronized metronome
        </label>
        {!validTempo && <p role="alert">Enter playback BPM from 30 to 300.</p>}
        <Button
          disabled={!valid || !validTempo || pending || playing}
          onClick={() => void play()}
        >
          {pending ? "Starting…" : "Play pattern"}
        </Button>{" "}
        <Button
          variant="outline"
          disabled={!playing && !pending}
          onClick={() => {
            stop();
            setMessage("Stopped. Audio released.");
          }}
        >
          Stop pattern
        </Button>
        <Feedback error={error} message={message} />
        <p className="hint">
          Changing pattern or playback settings stops audio. One measure plays
          when looping is off. Synthesized tones demonstrate direction and
          timing; they are not a guitar recording. Background tabs, sleep or
          long browser stalls may interrupt playback. Start again after
          suspension.
        </p>
      </section>
    </>
  );
}
