"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
export function SuggestedRoutine() {
  const [data, setData] = useState<components["schemas"]["Suggestion"] | null>(
    null,
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  const key = useRef("");
  const load = useCallback(async () => {
    const r = await api.GET("/api/v1/integration/suggestion");
    if (!r.data) throw new Error(apiError(r.error));
    setData(r.data);
    setError("");
    setSaved(false);
    key.current = crypto.randomUUID();
  }, []);
  useEffect(() => {
    let active = true;
    void api
      .GET("/api/v1/integration/suggestion")
      .then((r) => {
        if (!active) return;
        if (!r.data) {
          setError(apiError(r.error));
          return;
        }
        setData(r.data);
        key.current = crypto.randomUUID();
      })
      .catch(() => {
        if (active) setError("Unable to load suggestion. Retry.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function save() {
    if (!data || busy || saved) return;
    setBusy(true);
    try {
      const { reason, ...routine } = data;
      void reason;
      const r = await api.POST("/api/v1/practice/routines", {
        body: { ...routine, client_key: key.current },
      });
      if (!r.data) throw new Error(apiError(r.error));
      setSaved(true);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save routine");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Suggested practice routine</h2>
      <p>
        A deterministic starting point based on your profile, current daily goal
        and most recent saved song. Review it before saving; no paid AI or
        automatic practice credit.
      </p>
      <Feedback error message={error} />
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => void load().catch((e) => setError(e.message))}
      >
        Refresh routine suggestion
      </Button>
      {data ? (
        <>
          <h3>{data.name}</h3>
          <p>{data.reason}</p>
          <ol>
            {data.activities.map((a, i) => (
              <li key={i}>
                {a.name} · {a.duration_seconds} seconds · {a.tool}
              </li>
            ))}
          </ol>
          <Button disabled={busy || saved} onClick={() => void save()}>
            Save suggested routine
          </Button>
          {saved && (
            <p role="status">
              Routine saved privately.{" "}
              <Link href="/practice">
                Open Practice to edit, choose and start it
              </Link>
              .
            </p>
          )}
        </>
      ) : (
        !error && <p role="status">Loading your suggestion…</p>
      )}
    </section>
  );
}
