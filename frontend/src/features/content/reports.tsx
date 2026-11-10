"use client";
import { useCallback, useEffect, useState } from "react";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
type Report = components["schemas"]["ReportView"];
type Kind = Report["kind"];
export function Reports({
  managed = false,
  initialKind = "song",
  initialKey = "",
}: {
  managed?: boolean;
  initialKind?: Kind;
  initialKey?: string;
}) {
  const [rows, setRows] = useState<Report[]>([]);
  const [offset, setOffset] = useState(0);
  const [kind, setKind] = useState<Kind>(initialKind);
  const [key, setKey] = useState(initialKey);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const r = await api.GET("/api/v1/content-reports", {
        params: { query: { managed, offset, limit: 20 } },
      });
      if (!r.data) throw new Error(apiError(r.error));
      setRows(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, [managed, offset]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save report.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>{managed ? "Content correction queue" : "My content reports"}</h2>
      <p>
        {managed
          ? "Reporter account details are withheld. Make any correction in the catalogue editor, then mark the report corrected. Dismiss only after review."
          : "Describe incorrect or problematic shared content. Only you and authorized content managers can read your report. Avoid including passwords, email addresses or other private information."}
      </p>
      <Feedback error message={error} />
      <Feedback message={message} />
      {!managed && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const r = await api.POST("/api/v1/content-reports", {
                body: { kind, key, message: body },
              });
              if (!r.data) throw new Error(apiError(r.error));
              setBody("");
              setMessage("Report submitted privately.");
            });
          }}
        >
          <fieldset disabled={busy}>
            <label>
              Content type
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as Kind)}
              >
                {["song", "pattern", "chord", "instrument", "tuning"].map(
                  (k) => (
                    <option key={k}>{k}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Catalogue code or song/pattern ID
              <Input
                required
                value={key}
                maxLength={150}
                onChange={(e) => setKey(e.target.value)}
              />
            </label>
            <label>
              Problem or suggested correction
              <textarea
                required
                maxLength={2000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
            <Button type="submit">Submit private report</Button>
          </fieldset>
        </form>
      )}
      <Button
        variant="outline"
        disabled={busy || loading}
        onClick={() => void load()}
      >
        Refresh reports
      </Button>
      {loading ? (
        <p role="status">Loading reports…</p>
      ) : !rows.length ? (
        <p>No reports on this page.</p>
      ) : (
        <ul className="content-list">
          {rows.map((row) => (
            <li key={row.id}>
              <div>
                <strong>
                  {row.kind} · {row.key}
                </strong>
                <p>{row.message}</p>
                <p>
                  Status: {row.status} ·{" "}
                  {new Date(row.updated_at).toLocaleString()}
                </p>
                {managed && (
                  <div className="actions">
                    {(["corrected", "dismissed", "open"] as const).map(
                      (status) => (
                        <Button
                          key={status}
                          variant="outline"
                          disabled={busy || row.status === status}
                          onClick={() =>
                            void run(async () => {
                              const r = await api.PUT(
                                "/api/v1/content-reports/{identifier}",
                                {
                                  params: { path: { identifier: row.id } },
                                  body: { revision: row.revision, status },
                                },
                              );
                              if (!r.data) throw new Error(apiError(r.error));
                              setMessage(`Report ${status}.`);
                            })
                          }
                        >
                          Mark {status}
                        </Button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="actions">
        <Button
          disabled={busy || !offset}
          onClick={() => setOffset(offset - 20)}
        >
          Previous reports
        </Button>
        <Button
          disabled={busy || rows.length < 20}
          onClick={() => setOffset(offset + 20)}
        >
          Next reports
        </Button>
      </div>
    </section>
  );
}
