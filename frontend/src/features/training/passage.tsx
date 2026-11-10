"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { TrainingAudio } from "./audio";
type Song = components["schemas"]["SongDetail"];
export function PassagePractice({
  initialSong = "",
}: {
  initialSong?: string;
}) {
  const [list, setList] = useState<components["schemas"]["SongSummary"][]>([]);
  const [listLoaded, setListLoaded] = useState(false);
  const [listReload, setListReload] = useState(0);
  const [id, setId] = useState(initialSong),
    [song, setSong] = useState<Song | null>(null);
  const [textIndex, setTextIndex] = useState(0),
    [from, setFrom] = useState(1),
    [to, setTo] = useState(4);
  const [bpm, setBpm] = useState(60),
    [beats, setBeats] = useState(4);
  const [loop, setLoop] = useState(true),
    [audible, setAudible] = useState(false);
  const [running, setRunning] = useState(false),
    [busy, setBusy] = useState(false),
    [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const audio = useRef<TrainingAudio | null>(null),
    generation = useRef(0);
  const fingerprint = useRef("");
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    const engine = new TrainingAudio();
    audio.current = engine;
    engine.onTick = setElapsed;
    engine.onEnded = () => {
      setRunning(false);
      setBusy(false);
    };
    engine.onInterrupted = (text) => {
      setRunning(false);
      setBusy(false);
      setError(text);
    };
    const hidden = () => {
      if (document.visibilityState === "hidden") {
        engine.stop();
        invalidate();
        setRunning(false);
        setBusy(false);
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      invalidate();
      engine.onTick = undefined;
      engine.onEnded = undefined;
      engine.onInterrupted = undefined;
      engine.stop();
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [invalidate]);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const rows: typeof list = [];
        for (let offset = 0; ; offset += 100) {
          const r = await api.GET("/api/v1/songs", {
            params: { query: { offset, limit: 100 } },
          });
          if (!r.data) throw new Error(apiError(r.error));
          rows.push(...r.data.items.filter((s) => s.text_count > 0));
          if (offset + 100 >= r.data.total) break;
        }
        if (active) {
          setList(rows);
          setListLoaded(true);
        }
      } catch (e) {
        if (active) {
          setListLoaded(true);
          setError(e instanceof Error ? e.message : "Song list unavailable");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [listReload]);
  useEffect(() => {
    let active = true,
      pending = false;
    async function load() {
      if (pending || !id) return;
      pending = true;
      try {
        const r = await api.GET("/api/v1/songs/{identifier}", {
          params: { path: { identifier: id } },
        });
        if (!active) return;
        if (!r.data) throw new Error(apiError(r.error));
        const next = JSON.stringify(r.data.texts);
        if (fingerprint.current !== next) {
          audio.current?.stop();
          invalidate();
          setRunning(false);
          setBusy(false);
          setTextIndex(0);
          setFrom(1);
          setTo(Math.min(4, r.data.texts[0]?.lines.length || 1));
          fingerprint.current = next;
        }
        setSong(r.data);
        setError("");
      } catch (e) {
        if (active) {
          invalidate();
          audio.current?.stop();
          setRunning(false);
          setBusy(false);
          setSong(null);
          setError(e instanceof Error ? e.message : "Song unavailable");
        }
      } finally {
        pending = false;
      }
    }
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => {
      active = false;
      clearInterval(timer);
      audio.current?.stop();
      invalidate();
    };
  }, [id, invalidate]);
  const text = song?.texts[textIndex];
  const lines = text?.lines.slice(from - 1, to) || [];
  const seconds = (60 / Math.max(30, bpm || 60)) * beats;
  const valid =
    !!text &&
    Number.isInteger(from) &&
    Number.isInteger(to) &&
    from >= 1 &&
    to >= from &&
    to <= text.lines.length &&
    Number.isInteger(bpm) &&
    bpm >= 30 &&
    bpm <= 200 &&
    Number.isInteger(beats) &&
    beats >= 1 &&
    beats <= 16 &&
    (loop || lines.length * seconds <= 3600);
  const current = lines.length
    ? Math.floor(elapsed / seconds) % lines.length
    : 0;
  useEffect(() => {
    if (!text?.grant.expires_at) return;
    const timer = setTimeout(
      () => {
        if (new Date(text.grant.expires_at!).getTime() <= Date.now()) {
          audio.current?.stop();
          invalidate();
          setRunning(false);
          setBusy(false);
          setSong(null);
          setError(
            "This text permission expired. Choose another approved passage.",
          );
        }
      },
      Math.min(
        2147483647,
        Math.max(0, new Date(text.grant.expires_at).getTime() - Date.now()),
      ),
    );
    return () => clearTimeout(timer);
  }, [text, invalidate]);
  async function start() {
    if (!valid || running || busy || !text) return;
    const turn = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const fresh = await api.GET("/api/v1/songs/{identifier}", {
        params: { path: { identifier: id } },
      });
      if (turn !== generation.current) return;
      const allowed = fresh.data?.texts.find((t) => t.key === text.key);
      if (
        !allowed ||
        JSON.stringify(allowed.lines) !== JSON.stringify(text.lines)
      )
        throw new Error(
          "Passage changed or permission is unavailable. Reload or choose another song.",
        );
      setElapsed(0);
      setRunning(true);
      await audio.current?.start(
        [[60]],
        seconds,
        loop ? 3600 : lines.length * seconds,
        audible,
      );
    } catch (e) {
      if (turn === generation.current) {
        setRunning(false);
        setBusy(false);
        setError(e instanceof Error ? e.message : "Passage cues unavailable");
      }
    } finally {
      if (turn === generation.current) setBusy(false);
    }
  }
  return (
    <section className="panel training-panel">
      <h2>Approved song-section practice</h2>
      <p>
        Isolate lines from an approved text variant and loop a visual
        reading/strumming cue. Tempo controls line cues, not a song recording.
        Optional cue tones are generated locally; no recorded song, melody or
        third-party audio is played.
      </p>
      <Feedback error message={error} />
      {!listLoaded && !error && (
        <p role="status">Loading approved song texts…</p>
      )}
      {id && !song && !error && <p role="status">Loading selected song…</p>}
      {listLoaded && !list.length && !initialSong && !error && (
        <p>
          No approved text is available for section practice. Metadata-only
          songs stay in the song library.
        </p>
      )}
      <Button
        variant="outline"
        disabled={running || busy || !listLoaded}
        onClick={() => {
          setListLoaded(false);
          setError("");
          setListReload((n) => n + 1);
        }}
      >
        Reload available texts
      </Button>
      <fieldset disabled={running || busy}>
        <label>
          Practice song
          <select
            aria-label="Practice song"
            value={id}
            onChange={(e) => {
              setError("");
              setId(e.target.value);
              setSong(null);
              fingerprint.current = "";
            }}
          >
            <option value="">Choose a rights-cleared text</option>
            {initialSong && !list.some((s) => s.id === initialSong) && (
              <option value={initialSong}>Linked song</option>
            )}
            {list.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} · {s.language}
              </option>
            ))}
          </select>
        </label>
        {text && (
          <>
            <label>
              Approved text variant
              <select
                aria-label="Approved text variant"
                value={textIndex}
                onChange={(e) => {
                  setTextIndex(Number(e.target.value));
                  setFrom(1);
                  setTo(
                    Math.min(
                      4,
                      song?.texts[Number(e.target.value)].lines.length || 1,
                    ),
                  );
                }}
              >
                {song?.texts.map((t, i) => (
                  <option key={t.key} value={i}>
                    {t.label} · {t.language}/{t.script}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label>
                First passage line
                <input
                  type="number"
                  min={1}
                  max={text.lines.length}
                  value={from}
                  onChange={(e) => setFrom(Number(e.target.value))}
                />
              </label>
              <label>
                Last passage line
                <input
                  type="number"
                  min={from}
                  max={text.lines.length}
                  value={to}
                  onChange={(e) => setTo(Number(e.target.value))}
                />
              </label>
              <label>
                Passage cue BPM
                <input
                  type="number"
                  min={30}
                  max={200}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                />
              </label>
              <label>
                Beats per line
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={beats}
                  onChange={(e) => setBeats(Number(e.target.value))}
                />
              </label>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />
              Loop selected passage
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={audible}
                onChange={(e) => setAudible(e.target.checked)}
              />
              Play a generated cue at each line start
            </label>
          </>
        )}
      </fieldset>
      {song && !text && (
        <p>
          No approved text is available for this song. Missing permissions are
          not replaced with scraped lyrics. Choose another available exercise.
        </p>
      )}
      {text && (
        <>
          <p>
            {text.grant.attribution} · {text.grant.license}. No export is
            offered by this tool.
          </p>
          <ol
            start={from}
            lang={`${text.language}-${text.script}`}
            dir={text.script === "Arab" ? "rtl" : "ltr"}
          >
            {lines.map((line, i) => (
              <li
                key={i}
                aria-current={running && i === current ? "step" : undefined}
                className={running && i === current ? "training-current" : ""}
              >
                {line || "(blank line)"}
              </li>
            ))}
          </ol>
          {!valid && (
            <p role="alert">
              Choose valid line bounds and timing; non-looping passages must fit
              within one hour.
            </p>
          )}
          <Button
            disabled={!valid || running || busy}
            onClick={() => void start()}
          >
            Start passage cues
          </Button>{" "}
          <Button
            variant="outline"
            disabled={!running && !busy}
            onClick={() => {
              invalidate();
              audio.current?.stop();
              setRunning(false);
              setBusy(false);
              setBusy(false);
            }}
          >
            Stop passage cues
          </Button>
          <p>
            Line {running ? from + current : from} · cues stop on
            navigation/hiding or after one hour.
          </p>
        </>
      )}
      {song && (
        <p>
          <Link href={`/songs/${song.id}`}>Open full approved song page</Link>
          {" · "}
          <Link
            href={`/practice?song=${song.id}&focus=${encodeURIComponent(`Passage practice: ${song.title}`)}`}
          >
            Start a linked saved practice session
          </Link>
        </p>
      )}
      <p className="hint">
        Content is revalidated at Start and refreshed every 30 seconds.
        Withdrawn/expired text stops the exercise. This tool does not establish
        rights to unlicensed popular-song lyrics or recordings.
      </p>
    </section>
  );
}
