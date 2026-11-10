"use client";
import { useAuth } from "@/features/auth/context";
import { useCallback, useEffect, useState } from "react";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
export function TrainingHistory() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<components["schemas"]["AssessmentView"][]>(
    [],
  );
  const [offset, setOffset] = useState(0),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async (start: number) => {
    setBusy(true);
    try {
      const r = await api.GET("/api/v1/integration/assessments", {
        params: { query: { offset: start, limit: 50 } },
      });
      if (!r.data) throw new Error(apiError(r.error));
      setRows(r.data);
      setOffset(start);
      setLoaded(true);
      setError("");
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    void api
      .GET("/api/v1/integration/assessments")
      .then((r) => {
        if (!active) return;
        setLoaded(true);
        if (r.data) setRows(r.data);
        else setError(apiError(r.error));
      })
      .catch(() => {
        if (active) {
          setLoaded(true);
          setError("Training history unavailable. Refresh to retry.");
        }
      });
    return () => {
      active = false;
    };
  }, []);
  async function remove(id: string) {
    if (!confirm("Delete this private self-assessment?")) return;
    setBusy(true);
    try {
      const r = await api.DELETE(
        "/api/v1/integration/assessments/{identifier}",
        { params: { path: { identifier: id } } },
      );
      if (!r.response.ok && r.response.status !== 404)
        throw new Error(apiError(r.error));
      await load(offset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete assessment");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel training-panel">
      <h2>Private training assessments</h2>
      <p>
        These are your own reports, not detected accuracy or saved practice
        time. Ear-training attempts remain on the current page only.
      </p>
      <Feedback error message={error} />
      {!loaded && !error && <p role="status">Loading training history…</p>}
      <Button
        variant="outline"
        disabled={busy || !loaded}
        onClick={() => void load(offset).catch((e) => setError(e.message))}
      >
        Refresh training history
      </Button>
      {loaded && !rows.length && !error && (
        <p>No saved assessments on this page.</p>
      )}
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <h3>
              {row.kind} · {row.chords.join(" → ")}
            </h3>
            <p>
              <time dateTime={row.created_at}>
                {new Date(row.created_at).toLocaleString("en", {
                  timeZone: profile?.timezone || "UTC",
                })}
              </time>{" "}
              · {row.instrument.replaceAll("_", " ")}
            </p>
            <p>
              {row.seconds} seconds · {row.changes} self-reported clean changes
              · {row.difficulty} ·{" "}
              {row.completed ? "Reported complete" : "Partial exercise"}
            </p>
            <p className="practice-notes">{row.notes}</p>
            <Button
              variant="outline"
              disabled={busy || !loaded}
              aria-label={`Delete assessment ${row.id}`}
              onClick={() => void remove(row.id)}
            >
              Delete assessment
            </Button>
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        disabled={busy || offset === 0}
        onClick={() =>
          void load(Math.max(0, offset - 50)).catch((e) => setError(e.message))
        }
      >
        Newer training assessments
      </Button>{" "}
      <Button
        variant="outline"
        disabled={busy || rows.length < 50}
        onClick={() => void load(offset + 50).catch((e) => setError(e.message))}
      >
        Older training assessments
      </Button>
    </section>
  );
}
