"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";

type Summary = components["schemas"]["ProgressView"];
type Roadmap = components["schemas"]["RoadmapView"];
const minutes = (seconds: number) =>
  (seconds / 60).toLocaleString("en", { maximumFractionDigits: 2 });
export function Progress({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<Summary | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [week, setWeek] = useState("");
  const [reflection, setReflection] = useState("");
  const turn = useRef(0);
  const dirty = useRef(false);
  const saving = useRef(false);
  const [hasDirty, setHasDirty] = useState(false);
  const selectedWeek = useRef<string | undefined>(undefined);
  const invalidate = useCallback(() => {
    turn.current++;
  }, []);
  const load = useCallback(
    async (selected?: string) => {
      const request = ++turn.current;
      const [summary, map] = await Promise.all([
        api.GET("/api/v1/practice/progress", {
          params: { query: selected ? { review_week: selected } : {} },
        }),
        compact ? Promise.resolve(null) : api.GET("/api/v1/practice/roadmap"),
      ]);
      if (request !== turn.current) return;
      if (!summary.data || (map && !map.data))
        throw new Error(apiError(summary.error || map?.error));
      setData(summary.data);
      selectedWeek.current = summary.data.review.week;
      if (map?.data) setRoadmap(map.data);
      setWeek(summary.data.review.week);
      if (!dirty.current) setReflection(summary.data.review.improvement);
      setError("");
    },
    [compact],
  );
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (dirty.current || saving.current) return;
      void load(selectedWeek.current).catch((e) => {
        if (!cancelled) setError(e.message);
      });
    };
    refresh();
    window.addEventListener("focus", refresh);
    const timer = setInterval(refresh, 60000);
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      invalidate();
      window.removeEventListener("focus", refresh);
    };
  }, [load, invalidate]);
  async function complete(code: string, completed: boolean) {
    if (!roadmap || busy || hasDirty) return;
    setBusy(true);
    saving.current = true;
    invalidate();
    const previous = roadmap;
    let persisted = false;
    setRoadmap({
      ...roadmap,
      milestones: roadmap.milestones.map((m) =>
        m.code === code
          ? { ...m, completed_at: completed ? new Date().toISOString() : null }
          : m,
      ),
    });
    setMessage("Saving milestone…");
    try {
      const r = await api.PUT("/api/v1/practice/roadmap/{code}", {
        params: { path: { code } },
        body: {
          instrument: roadmap.instrument as
            "acoustic_guitar" | "electric_guitar" | "bass" | "ukulele",
          completed,
        },
      });
      if (!r.response.ok) throw new Error(apiError(r.error));
      persisted = true;
      await load(data?.review.week);
      setMessage("Milestone updated. Completion is self-reported.");
    } catch (e) {
      if (!persisted) setRoadmap(previous);
      setMessage("");
      setError(e instanceof Error ? e.message : "Unable to update milestone");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function saveReview() {
    if (!data || busy) return;
    saving.current = true;
    invalidate();
    setBusy(true);
    try {
      const r = await api.PUT("/api/v1/practice/reviews/{week}", {
        params: { path: { week: data.review.week } },
        body: { improvement: reflection, version: data.review.version },
      });
      if (!r.response.ok) throw new Error(apiError(r.error));
      dirty.current = false;
      setHasDirty(false);
      await load(data.review.week);
      setMessage("Weekly reflection saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save review");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      {compact ? (
        <h2>Your practice progress</h2>
      ) : (
        <>
          <p className="eyebrow">Your saved practice</p>
          <h1>Progress you can build on.</h1>
        </>
      )}
      <Feedback error message={error} />
      <Feedback message={message} />
      {!data && !error && <p role="status">Loading practice progress…</p>}
      <Button
        variant="outline"
        disabled={busy || hasDirty}
        onClick={() =>
          void load(data?.review.week).catch((e) => setError(e.message))
        }
      >
        Refresh progress
      </Button>
      {data && (
        <>
          <p>
            Calendar: {data.timezone}. Monday-start weeks. Saved active time
            only.
          </p>
          <dl className="progress-totals">
            <div>
              <dt>Today</dt>
              <dd>{minutes(data.today_seconds)} minutes</dd>
            </div>
            <div>
              <dt>This week</dt>
              <dd>{minutes(data.week_seconds)} minutes</dd>
            </div>
            <div>
              <dt>This month</dt>
              <dd>{minutes(data.month_seconds)} minutes</dd>
            </div>
            <div>
              <dt>All time</dt>
              <dd data-testid="total-practice-minutes">
                {minutes(data.total_seconds)} minutes
              </dd>
            </div>
            <div>
              <dt>Current streak</dt>
              <dd>{data.current_streak} days</dd>
            </div>
            <div>
              <dt>Longest streak</dt>
              <dd>{data.longest_streak} days</dd>
            </div>
          </dl>
          {!data.saved_sessions && (
            <p>
              No saved practice yet.{" "}
              <Link href="/practice">Start and save a session</Link> to see your
              progress.
            </p>
          )}
          {compact ? (
            <p>
              <Link href="/progress">
                Open charts, goals, weekly review and learning roadmap
              </Link>
            </p>
          ) : (
            <>
              <p>
                Any positive saved active time qualifies a practice day. A
                streak continues from yesterday until today ends. Pauses and
                unsaved sessions do not count. Sessions split at local midnight;
                changing your profile timezone recalculates history. Small
                durations may round to zero minutes.
              </p>
              <p>
                <Link href="/practice">
                  Manage sessions, routines and goal settings
                </Link>
              </p>
              <h2>Current goals</h2>
              {!data.goals.length && (
                <p>No goals configured. Set a target in Practice.</p>
              )}
              {data.goals.map((g) => (
                <div key={g.period}>
                  <h3>{g.period === "daily" ? "Daily" : "Weekly"} goal</h3>
                  <p>
                    {minutes(g.seconds)} of {g.minutes} minutes ·{" "}
                    {g.paused ? "Paused" : `${g.percent.toFixed(1)}%`}
                  </p>
                  {!g.paused && (
                    <progress
                      aria-label={`${g.period} goal progress`}
                      max={100}
                      value={g.percent}
                    />
                  )}
                </div>
              ))}
              <h2>Last 28 days</h2>
              <p>
                Exact seconds appear in the table. Goal results use the target
                active at each local day’s end; today uses the current target.
                Paused or unconfigured goals have no result.
              </p>
              <div
                className="practice-chart"
                role="img"
                aria-label="Daily saved practice minutes over the last 28 days; exact values in the following table."
              >
                {data.days.map((d) => (
                  <div
                    key={d.day}
                    title={`${d.day}: ${minutes(d.seconds)} minutes`}
                    style={{
                      height: `${Math.max(1, (d.seconds / Math.max(1, ...data.days.map((x) => x.seconds))) * 100)}%`,
                    }}
                  />
                ))}
              </div>
              <div className="progress-table">
                <table>
                  <caption>Daily saved practice</caption>
                  <thead>
                    <tr>
                      <th scope="col">Local date</th>
                      <th scope="col">Minutes</th>
                      <th scope="col">Seconds</th>
                      <th scope="col">Goal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.days.map((d) => (
                      <tr key={d.day}>
                        <th scope="row">{d.day}</th>
                        <td>{minutes(d.seconds)}</td>
                        <td>{d.seconds.toFixed(6)}</td>
                        <td>
                          {d.goal_met === null
                            ? "No active target"
                            : `${d.goal_minutes} min · ${d.goal_met ? "Met" : "Not met"}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h2>Most practiced</h2>
              <p>
                All-time linked session totals, up to ten per category. Routine
                activity links are not inferred as time spent on individual
                songs/chords.
              </p>
              <div className="form-grid">
                {(["instruments", "songs", "chords"] as const).map((key) => (
                  <section key={key}>
                    <h3>{key[0].toUpperCase() + key.slice(1)}</h3>
                    {data[key].length ? (
                      <ol>
                        {data[key].map((r) => (
                          <li key={r.label}>
                            {r.label}: {minutes(r.seconds)} minutes
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p>No linked saved practice yet.</p>
                    )}
                  </section>
                ))}
              </div>
              <h2>Weekly review</h2>
              <label>
                Review week starting Monday
                <input
                  type="date"
                  value={week}
                  disabled={busy}
                  onChange={(e) => setWeek(e.target.value)}
                />
              </label>
              <Button
                variant="outline"
                disabled={busy || !week || hasDirty}
                onClick={() =>
                  void load(week).catch((e) => setError(e.message))
                }
              >
                Load review week
              </Button>
              <p>
                Review {data.review.week} to {data.review.end} (end exclusive):{" "}
                {minutes(data.review.seconds)} minutes across{" "}
                {data.review.practice_days} practice days. Daily targets met:{" "}
                {data.review.achieved_daily_goals}/
                {data.review.evaluated_daily_goals}. Weekly target:{" "}
                {data.review.weekly_goal_met === null
                  ? "No active target"
                  : data.review.weekly_goal_met
                    ? "Met"
                    : "Not met"}
                .
              </p>
              <p>
                Historical targets use the goal version active at period close.
                Editing or deleting sessions recalculates these results. Save or
                clear unsaved reflection changes before loading another week.
              </p>
              <label>
                What would you like to improve?
                <textarea
                  maxLength={2000}
                  value={reflection}
                  disabled={busy}
                  onChange={(e) => {
                    dirty.current = true;
                    setHasDirty(true);
                    setReflection(e.target.value);
                  }}
                />
              </label>
              <Button disabled={busy} onClick={() => void saveReview()}>
                Save weekly reflection
              </Button>{" "}
              <Button
                variant="outline"
                disabled={busy || hasDirty}
                onClick={() => {
                  dirty.current = false;
                  setHasDirty(false);
                  setReflection(data.review.improvement);
                }}
              >
                Discard reflection changes
              </Button>
              <p>Clear the reflection and save to delete its stored text.</p>
              <h2>Learning roadmap</h2>
              <p>
                Suggested order adapts to your selected instrument and skill.
                Check milestones when you feel ready; completion is
                self-reported, separately stored per instrument, and does not
                certify playing ability.
              </p>
              {roadmap && (
                <>
                  <p>
                    {roadmap.instrument.replaceAll("_", " ")} · {roadmap.skill}{" "}
                    · {roadmap.milestones.filter((m) => m.completed_at).length}/
                    {roadmap.milestones.length} complete
                  </p>
                  <ol className="roadmap">
                    {roadmap.milestones.map((m) => (
                      <li key={m.code}>
                        <h3>{m.title}</h3>
                        <p>
                          {m.level} · {m.instruction}
                        </p>
                        <Link href={m.tool}>Open practice tool</Link>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            aria-label={`Complete ${m.title}`}
                            checked={!!m.completed_at}
                            disabled={busy || hasDirty}
                            onChange={(e) =>
                              void complete(m.code, e.target.checked)
                            }
                          />
                          Mark complete
                        </label>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
