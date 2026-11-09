"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { useAuth } from "@/features/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
import { SessionFields } from "./links";
import { SessionEditor } from "./session-editor";
import { RoutineEditor } from "./routine-editor";
import { GoalSetting } from "./goals";
import { GuidedTools } from "./guided-tools";
import { loadSources } from "./sources";
import { clockText, routinePosition, secondsAt } from "./clock";
import type {
  Activity,
  Details,
  Goal,
  PracticeSession,
  Routine,
  RoutineDraft,
  Sources,
} from "./types";
import { instrumentLabel } from "./types";

type Current = { session: PracticeSession | null; received: number };
const emptySources: Sources = { songs: [], chords: [], patterns: [] };
export function Practice() {
  const { profile } = useAuth();
  const [current, setCurrent] = useState<Current>({
    session: null,
    received: 0,
  });
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sources, setSources] = useState<Sources>(emptySources);
  const [sourceError, setSourceError] = useState("");
  const [sourcesEpoch, setSourcesEpoch] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [details, setDetails] = useState<Details>({
    instrument: profile?.instrument || "acoustic_guitar",
    focus: "",
    notes: "",
    song_id: null,
    chord_id: null,
    chord_name: "",
  });
  const [targetMinutes, setTargetMinutes] = useState("");
  const [routineChoice, setRoutineChoice] = useState("");
  const [confirmLong, setConfirmLong] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [editingSession, setEditingSession] = useState<PracticeSession | null>(
    null,
  );
  const [editor, setEditor] = useState<{
    value: Routine | null;
    key: string;
  } | null>(null);
  const [historyQuery, setHistoryQuery] = useState("");
  const startKey = useRef("");
  const duplicateKeys = useRef(new Map<string, string>());
  const generation = useRef(0);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  const applyCurrent = useCallback((row: PracticeSession | null) => {
    setCurrent({
      session: row?.state === "saved" ? null : row,
      received: performance.now(),
    });
  }, []);
  const syncCurrent = useCallback(async () => {
    if (busyRef.current) return;
    const turn = generation.current;
    const r = await api.GET("/api/v1/practice/current");
    if (!r.response.ok) throw new Error(apiError(r.error));
    if (turn === generation.current && mounted.current) {
      applyCurrent(r.data || null);
      setSyncError("");
    }
  }, [applyCurrent]);
  const fetchHistory = useCallback(async (offset: number) => {
    const r = await api.GET("/api/v1/practice/sessions", {
      params: { query: { offset, limit: 50 } },
    });
    if (!r.data) throw new Error(apiError(r.error));
    return r.data;
  }, []);
  const fetchRoutines = useCallback(async () => {
    const all: Routine[] = [];
    for (let offset = 0; ; offset += 100) {
      const r = await api.GET("/api/v1/practice/routines", {
        params: { query: { offset, limit: 100 } },
      });
      if (!r.data) throw new Error(apiError(r.error));
      all.push(...r.data);
      if (r.data.length < 100) return all;
    }
  }, []);
  const refresh = useCallback(async () => {
    const turn = generation.current;
    const [active, rows, templates, targets] = await Promise.all([
      api.GET("/api/v1/practice/current"),
      fetchHistory(0),
      fetchRoutines(),
      api.GET("/api/v1/practice/goals"),
    ]);
    if (!active.response.ok || !targets.data)
      throw new Error(apiError(active.error || targets.error));
    if (!mounted.current || turn !== generation.current) return;
    applyCurrent(active.data || null);
    setHistory(rows);
    setHistoryOffset(0);
    setRoutines(templates);
    setGoals(targets.data);
    setLoading(false);
    setLoadError("");
    setSyncError("");
  }, [applyCurrent, fetchHistory, fetchRoutines]);
  const refreshSources = useCallback(async () => {
    try {
      const data = await loadSources();
      if (mounted.current) {
        setSources(data);
        setSourcesEpoch((n) => n + 1);
        setSourceError("");
      }
    } catch {
      if (mounted.current)
        setSourceError(
          "Learning links could not be loaded. You can still practice with a text focus; retry to choose linked items.",
        );
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    void refresh().catch((e) => {
      if (mounted.current && !cancelled) {
        setLoading(false);
        setLoadError(e.message);
      }
    });
    void Promise.resolve().then(refreshSources);
    return () => {
      cancelled = true;
      mounted.current = false;
      // Invalidate pending requests from this mount.
      invalidate();
    };
  }, [refresh, refreshSources, invalidate]);
  useEffect(() => {
    const ui = setInterval(() => setTick(performance.now()), 250);
    const sync = () => {
      void syncCurrent().catch(() => {
        if (mounted.current)
          setSyncError(
            "Timer synchronization is unavailable. Time may be out of date; retry before editing.",
          );
      });
    };
    const server = setInterval(sync, 15000);
    const visibility = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(ui);
      clearInterval(server);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [syncCurrent]);
  const session = current.session;
  const elapsed = session
    ? secondsAt(session, Math.max(0, tick - current.received))
    : 0;
  const snapshot = session?.routine_snapshot;
  const position = routinePosition(
    elapsed,
    snapshot?.activities.map((a) => a.duration_seconds) || [],
  );
  const activity: Activity | undefined = snapshot
    ? snapshot.activities[position.index]
    : session
      ? {
          name: session.focus || "Free practice",
          duration_seconds: session.target_seconds || 86400,
          tool: session.chord_name || session.chord_id ? "chords" : "metronome",
          bpm: 100,
          chord_id: session.chord_id,
          chord_name: session.chord_name,
          song_id: session.song_id,
          pattern_id: null,
        }
      : undefined;
  const reached =
    session?.state === "active" &&
    session.target_seconds != null &&
    elapsed >= session.target_seconds;
  useEffect(() => {
    if (reached)
      void syncCurrent().catch(() =>
        setSyncError(
          "Target reached locally. Retry synchronization to confirm the ended session.",
        ),
      );
  }, [reached, syncCurrent]);
  async function work<T>(action: () => Promise<T>): Promise<T> {
    if (busyRef.current)
      throw new Error("Another operation is in progress. Please wait.");
    busyRef.current = true;
    generation.current++;
    setBusy(true);
    setError("");
    try {
      return await action();
    } finally {
      busyRef.current = false;
      generation.current++;
      if (mounted.current) setBusy(false);
    }
  }
  function failed(e: unknown) {
    setError(
      e instanceof Error
        ? e.message
        : "Unable to complete the operation. Refresh and retry.",
    );
  }
  async function start() {
    await work(async () => {
      if (!startKey.current) startKey.current = crypto.randomUUID();
      const body: components["schemas"]["SessionStart"] = {
        ...details,
        client_key: startKey.current,
        routine_id: routineChoice || null,
        target_seconds:
          !routineChoice && targetMinutes ? Number(targetMinutes) * 60 : null,
      };
      const r = await api.POST("/api/v1/practice/sessions", { body });
      if (!r.data) {
        if (r.response.status === 410) startKey.current = "";
        const latest = await api
          .GET("/api/v1/practice/current")
          .catch(() => null);
        if (latest?.response.ok) applyCurrent(latest.data || null);
        throw new Error(apiError(r.error));
      }
      applyCurrent(r.data);
      startKey.current = "";
      setConfirmLong(false);
      setShowTools(false);
      setMessage(
        "Practice started. Time is not saved until you end and save the session.",
      );
    });
  }
  async function command(action: "pause" | "resume" | "end" | "save") {
    if (!session) return;
    if (action === "pause" || action === "end" || action === "save")
      setShowTools(false);
    await work(async () => {
      const r = await api.POST(
        "/api/v1/practice/sessions/{identifier}/{action}",
        {
          params: { path: { identifier: session.id, action } },
          body: { version: session.version, confirm_long: confirmLong },
        },
      );
      if (!r.data) {
        const latest = await api
          .GET("/api/v1/practice/current")
          .catch(() => null);
        if (latest?.response.ok) applyCurrent(latest.data || null);
        throw new Error(apiError(r.error));
      }
      applyCurrent(r.data);
      setConfirmLong(false);
      setMessage(
        action === "save"
          ? "Practice session saved once."
          : action === "pause"
            ? "Practice paused. Paused time does not count."
            : action === "resume"
              ? "Practice resumed."
              : "Practice ended. Review it, then save or discard.",
      );
      if (action === "save") {
        setHistoryOffset(0);
        await fetchHistory(0)
          .then(setHistory)
          .catch(() =>
            setError(
              "Session saved, but history could not refresh. Retry history loading.",
            ),
          );
      }
    });
  }
  async function saveSession(
    id: string,
    body: components["schemas"]["SessionUpdate"],
  ) {
    await work(async () => {
      const r = await api.PUT("/api/v1/practice/sessions/{identifier}", {
        params: { path: { identifier: id } },
        body,
      });
      if (!r.data) throw new Error(apiError(r.error));
      if (session?.id === id) applyCurrent(r.data);
      const edited = r.data;
      setHistory((old) => old.map((s) => (s.id === id ? edited : s)));
      setEditingSession(null);
      setMessage(
        "Practice session updated. Saved intervals are the source of truth.",
      );
    });
  }
  async function removeSession(row: PracticeSession) {
    if (
      !confirm(
        row.state === "saved"
          ? "Delete this saved practice session?"
          : "Discard this unsaved session and its active time?",
      )
    )
      return;
    setShowTools(false);
    await work(async () => {
      const r = await api.DELETE("/api/v1/practice/sessions/{identifier}", {
        params: {
          path: { identifier: row.id },
          query: { version: row.version },
        },
      });
      if (!r.response.ok && r.response.status !== 404)
        throw new Error(apiError(r.error));
      if (session?.id === row.id) applyCurrent(null);
      setHistory((old) => old.filter((s) => s.id !== row.id));
      setEditingSession(null);
      setMessage(
        row.state === "saved"
          ? "Practice session deleted."
          : "Unsaved session discarded.",
      );
    });
  }
  async function saveRoutine(
    draft: RoutineDraft,
    id: string | null,
    version: number,
    key: string,
  ) {
    await work(async () => {
      const r = id
        ? await api.PUT("/api/v1/practice/routines/{identifier}", {
            params: { path: { identifier: id } },
            body: { ...draft, version },
          })
        : await api.POST("/api/v1/practice/routines", {
            body: { ...draft, client_key: key },
          });
      if (!r.data) throw new Error(apiError(r.error));
      const row = r.data;
      setRoutines((old) => [...old.filter((t) => t.id !== row.id), row]);
      setEditor({ value: row, key: `${row.id}-${row.version}` });
      setMessage("Private routine saved.");
    });
  }
  async function duplicate(row: Routine) {
    await work(async () => {
      let key = duplicateKeys.current.get(row.id);
      if (!key) {
        key = crypto.randomUUID();
        duplicateKeys.current.set(row.id, key);
      }
      const r = await api.POST(
        "/api/v1/practice/routines/{identifier}/duplicate",
        { params: { path: { identifier: row.id } }, body: { client_key: key } },
      );
      if (!r.data) throw new Error(apiError(r.error));
      const copy = r.data;
      setRoutines((old) => [...old.filter((t) => t.id !== copy.id), copy]);
      duplicateKeys.current.delete(row.id);
      setMessage("Routine duplicated privately.");
    });
  }
  async function removeRoutine(row: Routine) {
    if (
      !confirm(
        `Delete routine ${row.name}? Past session snapshots will remain.`,
      )
    )
      return;
    await work(async () => {
      const r = await api.DELETE("/api/v1/practice/routines/{identifier}", {
        params: {
          path: { identifier: row.id },
          query: { version: row.version },
        },
      });
      if (!r.response.ok && r.response.status !== 404)
        throw new Error(apiError(r.error));
      setRoutines((old) => old.filter((t) => t.id !== row.id));
      if (routineChoice === row.id) setRoutineChoice("");
      if (editor?.value?.id === row.id) setEditor(null);
      setMessage("Routine deleted. Past practice remains unchanged.");
    });
  }
  async function saveGoal(
    period: "daily" | "weekly",
    minutes: number,
    paused: boolean,
    version: number,
  ) {
    await work(async () => {
      const r = await api.PUT("/api/v1/practice/goals/{period}", {
        params: { path: { period } },
        body: { minutes, paused, version },
      });
      if (!r.data) throw new Error(apiError(r.error));
      const goal = r.data;
      setGoals((old) => [...old.filter((g) => g.period !== period), goal]);
      setMessage(
        `${period === "daily" ? "Daily" : "Weekly"} goal settings saved.`,
      );
    });
  }
  function openRoutine(row: Routine | null) {
    setEditor({
      value: row,
      key: row ? `${row.id}-${row.version}` : crypto.randomUUID(),
    });
  }
  function time(instant: string) {
    try {
      return new Date(instant).toLocaleString("en", {
        timeZone: profile?.timezone || "UTC",
      });
    } catch {
      return new Date(instant).toISOString() + " UTC";
    }
  }
  const validTarget =
    !targetMinutes ||
    (Number.isInteger(Number(targetMinutes)) &&
      Number(targetMinutes) >= 1 &&
      Number(targetMinutes) <= 1440);
  if (loading) return <p role="status">Loading your practice workspace…</p>;
  if (loadError)
    return (
      <section className="panel">
        <h1>Practice unavailable</h1>
        <Feedback error message={loadError} />
        <Button
          onClick={() => void refresh().catch((e) => setLoadError(e.message))}
        >
          Retry practice loading
        </Button>
      </section>
    );
  return (
    <>
      <section className="panel">
        <p className="eyebrow">Your private practice</p>
        <h1>Make the minutes matter.</h1>
        <p>
          Start a count-up or target timer, or choose a reusable routine. Paused
          time is excluded. Only explicitly saved sessions enter your history.
        </p>
        <Feedback error message={error} />
        <Feedback message={message} />
        <Feedback error message={syncError} />
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void work(refresh).catch(failed)}
        >
          Refresh practice records
        </Button>{" "}
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            void syncCurrent().catch((e) => setSyncError(e.message))
          }
        >
          Synchronize timer
        </Button>
        {sourceError && (
          <>
            <Feedback error message={sourceError} />
            <Button variant="outline" onClick={() => void refreshSources()}>
              Retry learning links
            </Button>
          </>
        )}
      </section>
      <section className="panel">
        <h2 id="practice-timer" tabIndex={-1}>
          Practice timer
        </h2>
        {!session ? (
          <>
            <SessionFields
              value={details}
              change={setDetails}
              sources={sources}
              disabled={busy}
            />
            <div className="form-grid">
              <label>
                Use routine
                <select
                  aria-label="Use routine"
                  disabled={busy}
                  value={routineChoice}
                  onChange={(e) => {
                    setRoutineChoice(e.target.value);
                    const row = routines.find((r) => r.id === e.target.value);
                    if (row)
                      setDetails({
                        ...details,
                        instrument: row.instrument,
                        chord_id: null,
                      });
                  }}
                >
                  <option value="">Free session</option>
                  {routines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {instrumentLabel(r.instrument)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Timer target minutes (blank for count-up)
                <Input
                  disabled={busy || !!routineChoice}
                  type="number"
                  min={1}
                  max={1440}
                  step={1}
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(e.target.value)}
                />
              </label>
            </div>
            {!validTarget && !routineChoice && (
              <p role="alert">
                Use 1–1440 whole target minutes, or leave it blank.
              </p>
            )}
            <Button
              disabled={busy || !!syncError || (!routineChoice && !validTarget)}
              onClick={() => void start().catch(failed)}
            >
              Start practice
            </Button>
          </>
        ) : (
          <>
            <p>
              Session state: <strong>{session.state}</strong> ·{" "}
              {instrumentLabel(session.instrument)} · captured timezone{" "}
              {session.timezone}
            </p>
            <output
              aria-label="Active practice time"
              aria-live="off"
              className="practice-clock"
            >
              {clockText(elapsed)}
            </output>
            {session.target_seconds != null && (
              <p aria-live="off">
                Target time remaining:{" "}
                {clockText(session.target_seconds - elapsed)}
              </p>
            )}
            <p>
              Started {time(session.started_at)}
              {session.ended_at ? ` · Ended ${time(session.ended_at)}` : ""}
            </p>
            <p>{session.focus || snapshot?.name || "Free practice"}</p>
            <p className="practice-notes">{session.notes}</p>
            {snapshot && (
              <>
                <h3 aria-live="polite">
                  {position.index < snapshot.activities.length
                    ? `Activity ${position.index + 1} of ${snapshot.activities.length}: ${activity?.name}`
                    : "Routine time complete"}
                </h3>
                <p aria-live="off">
                  Activity time remaining: {clockText(position.remaining)}
                </p>
                <ol>
                  {snapshot.activities.map((a, i) => (
                    <li
                      key={i}
                      aria-current={i === position.index ? "step" : undefined}
                    >
                      {a.name} · {a.duration_seconds} seconds{" "}
                      {i < position.index ? "· elapsed" : ""}
                    </li>
                  ))}
                </ol>
                <p>
                  Activities advance by active practice time. Timer targets end
                  automatically when next synchronized; no time beyond the
                  target is saved.
                </p>
              </>
            )}
            <div className="actions">
              {session.state === "active" && (
                <Button
                  disabled={busy || !!syncError}
                  onClick={() => void command("pause").catch(failed)}
                >
                  Pause practice
                </Button>
              )}
              {session.state === "paused" && (
                <Button
                  disabled={busy || !!syncError}
                  onClick={() => void command("resume").catch(failed)}
                >
                  Resume practice
                </Button>
              )}
              {session.state !== "ended" && (
                <Button
                  variant="outline"
                  disabled={busy || !!syncError}
                  onClick={() => void command("end").catch(failed)}
                >
                  End practice
                </Button>
              )}
            </div>
            {session.state === "ended" && (
              <>
                {session.duration_seconds < 1 && (
                  <p role="alert">
                    Zero active seconds cannot be saved. Correct the time if you
                    practiced, or discard this session.
                  </p>
                )}
                {session.duration_seconds > 14400 && (
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={confirmLong}
                      onChange={(e) => setConfirmLong(e.target.checked)}
                    />
                    I reviewed this session over four hours
                  </label>
                )}
                {session.duration_seconds > 86400 && (
                  <p role="alert">
                    More than 24 active hours cannot be saved. Correct the
                    recorded time.
                  </p>
                )}
                <Button
                  disabled={
                    busy ||
                    !!syncError ||
                    session.duration_seconds < 1 ||
                    session.duration_seconds > 86400 ||
                    (session.duration_seconds > 14400 && !confirmLong)
                  }
                  onClick={() => void command("save").catch(failed)}
                >
                  Save practice session
                </Button>{" "}
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEditingSession(session)}
                >
                  Edit ended session
                </Button>{" "}
              </>
            )}
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void removeSession(session).catch(failed)}
            >
              Discard unsaved session
            </Button>
            {session.state === "active" && activity && (
              <>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={showTools}
                    onChange={(e) => setShowTools(e.target.checked)}
                  />
                  Show guided practice tools
                </label>
                {showTools && (
                  <GuidedTools
                    key={`${session.id}-${position.index}-${sourcesEpoch}`}
                    activity={activity}
                    instrument={session.instrument}
                    sources={sources}
                  />
                )}
              </>
            )}
            <p className="hint">
              Refresh/navigation does not stop the server timer. Pause for
              breaks. After sleep or a long absence, review and correct the time
              before saving. Deleting or discarding physically removes the
              session; only a minimal retry key remains until account deletion.
            </p>
          </>
        )}
      </section>
      {editingSession && (
        <SessionEditor
          key={`${editingSession.id}-${editingSession.version}`}
          session={editingSession}
          sources={sources}
          busy={busy}
          save={saveSession}
          cancel={() => setEditingSession(null)}
        />
      )}
      <section className="panel">
        <h2>Saved practice history</h2>
        <p>
          Times are shown in your profile timezone ({profile?.timezone || "UTC"}
          ). Only saved sessions appear here.
        </p>
        <label>
          Search this history page
          <Input
            value={historyQuery}
            onChange={(e) => setHistoryQuery(e.target.value)}
          />
        </label>
        {!history.length && (
          <p>
            No saved practice sessions on this page. End and save a session to
            record it.
          </p>
        )}
        <ul className="practice-history">
          {history
            .filter((s) =>
              `${s.focus} ${s.notes} ${s.instrument} ${s.routine_snapshot?.name || ""}`
                .toLowerCase()
                .includes(historyQuery.toLowerCase()),
            )
            .map((row) => (
              <li key={row.id}>
                <h3>
                  {row.focus ||
                    row.routine_snapshot?.name ||
                    "Practice session"}
                </h3>
                <p>
                  {time(row.started_at)} · {instrumentLabel(row.instrument)} ·{" "}
                  {clockText(row.duration_seconds)} active
                </p>
                <p className="practice-notes">{row.notes}</p>
                {row.routine_snapshot && (
                  <p>Routine snapshot: {row.routine_snapshot.name}</p>
                )}
                <Button
                  variant="outline"
                  disabled={busy}
                  aria-label={`Edit saved session ${row.id}`}
                  onClick={() => setEditingSession(row)}
                >
                  Edit saved session
                </Button>{" "}
                <Button
                  variant="outline"
                  disabled={busy}
                  aria-label={`Delete saved session ${row.id}`}
                  onClick={() => void removeSession(row).catch(failed)}
                >
                  Delete saved session
                </Button>
              </li>
            ))}
        </ul>
        <Button
          variant="outline"
          disabled={busy || historyOffset === 0}
          onClick={() =>
            void work(async () => {
              const offset = Math.max(0, historyOffset - 50);
              setHistory(await fetchHistory(offset));
              setHistoryOffset(offset);
            }).catch(failed)
          }
        >
          Newer history
        </Button>{" "}
        <Button
          variant="outline"
          disabled={busy || history.length < 50}
          onClick={() =>
            void work(async () => {
              const offset = historyOffset + 50;
              setHistory(await fetchHistory(offset));
              setHistoryOffset(offset);
            }).catch(failed)
          }
        >
          Older history
        </Button>
      </section>
      <section className="panel">
        <h2>Your routines</h2>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => openRoutine(null)}
        >
          Build new routine
        </Button>
        {!routines.length && (
          <p>No saved routines yet. Build a sequence that you can reuse.</p>
        )}
        <ul className="pattern-library">
          {routines.map((row) => (
            <li key={row.id}>
              <h3>{row.name}</h3>
              <p>
                {instrumentLabel(row.instrument)} · {row.activities.length}{" "}
                activities ·{" "}
                {row.activities.reduce((n, a) => n + a.duration_seconds, 0)}{" "}
                seconds
              </p>
              {row.warnings?.map((w) => (
                <p key={w}>{w}</p>
              ))}
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void work(async () => {
                    const r = await api.GET(
                      "/api/v1/practice/routines/{identifier}",
                      { params: { path: { identifier: row.id } } },
                    );
                    if (!r.data) throw new Error(apiError(r.error));
                    openRoutine(r.data);
                  }).catch(failed)
                }
              >
                Edit {row.name}
              </Button>{" "}
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void duplicate(row).catch(failed)}
              >
                Duplicate {row.name}
              </Button>{" "}
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void removeRoutine(row).catch(failed)}
              >
                Delete {row.name}
              </Button>
            </li>
          ))}
        </ul>
      </section>
      {editor && (
        <RoutineEditor
          key={editor.key}
          initial={editor.value}
          instrument={details.instrument}
          sources={sources}
          busy={busy}
          save={saveRoutine}
          cancel={() => setEditor(null)}
        />
      )}
      <section className="panel">
        <h2>Practice goal settings</h2>
        <p>
          Set or pause daily and weekly targets without changing saved practice.
          Goal progress, charts and streaks are not yet available.
        </p>
        <div className="form-grid">
          {(["daily", "weekly"] as const).map((period) => {
            const goal = goals.find((g) => g.period === period);
            return (
              <GoalSetting
                key={`${period}-${goal?.version || 0}`}
                period={period}
                current={goal}
                busy={busy}
                save={saveGoal}
              />
            );
          })}
        </div>
      </section>
    </>
  );
}
