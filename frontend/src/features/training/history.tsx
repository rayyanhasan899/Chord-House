"use client";
import { useCallback, useEffect, useState } from "react";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
export function TrainingHistory() {
  const [rows, setRows] = useState<components["schemas"]["AssessmentView"][]>(
    [],
  );
  const [offset, setOffset] = useState(0),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (start: number) => {
    const r = await api.GET("/api/v1/integration/assessments", {
      params: { query: { offset: start, limit: 50 } },
    });
    if (!r.data) throw new Error(apiError(r.error));
    setRows(r.data);
    setOffset(start);
    setError("");
  }, []);
  useEffect(() => {
    let active = true;
    void api
      .GET("/api/v1/integration/assessments")
      .then((r) => {
        if (!active) return;
        if (r.data) setRows(r.data);
        else setError(apiError(r.error));
      })
      .catch(() => {
        if (active) setError("Training history unavailable. Refresh to retry.");
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
    <section className="panel">
      <h2>Private training assessments</h2>
      <p>
        These are your own reports, not detected accuracy or saved practice
        time. Ear-training attempts remain on the current page only.
      </p>
      <Feedback error message={error} />
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => void load(offset).catch((e) => setError(e.message))}
      >
        Refresh training history
      </Button>
      {!rows.length && !error && <p>No saved assessments on this page.</p>}
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <h3>
              {row.kind} · {row.chords.join(" → ")}
            </h3>
            <p>
              {row.seconds} seconds · {row.changes} self-reported clean changes
              · {row.difficulty} ·{" "}
              {row.completed ? "Reported complete" : "Partial exercise"}
            </p>
            <p>{row.notes}</p>
            <Button
              variant="outline"
              disabled={busy}
              aria-label={`Delete training assessment ${row.id}`}
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
