"use client";
import { useState } from "react";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
type Batch = components["schemas"]["ImportView"];
type Pack = components["schemas"]["ImportInput"];
export function Imports() {
  const [pack, setPack] = useState<Pack | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [history, setHistory] = useState<Batch[]>([]);
  const [offset, setOffset] = useState(0);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import operation failed.");
    } finally {
      setBusy(false);
    }
  }
  async function historyPage(next: number) {
    const r = await api.GET("/api/v1/content-imports", {
      params: { query: { offset: next, limit: 20 } },
    });
    if (!r.data) throw new Error(apiError(r.error));
    setHistory(r.data);
    setOffset(next);
    setMessage(
      r.data.length ? "Import history loaded." : "No imports on this page.",
    );
  }
  return (
    <section className="panel">
      <h2>Song import review</h2>
      <p>
        Choose a catalogue JSON pack from your content supplier. Upload stages a
        review; it never publishes automatically. Duplicate identities,
        replacements and missing rights are checked before publication. Resolve
        issues in the source pack and use a new batch key.
      </p>
      <Feedback error message={error} />
      <Feedback message={message} />
      <fieldset disabled={busy}>
        <label>
          Catalogue import file
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPack(null);
              setBatch(null);
              setReviewed(false);
              if (file)
                void run(async () => {
                  if (file.size > 5_000_000)
                    throw new Error("Choose a file smaller than 5 MB.");
                  const parsed = JSON.parse(await file.text());
                  if (
                    !parsed ||
                    !Array.isArray(parsed.items) ||
                    typeof parsed.key !== "string"
                  )
                    throw new Error("A pack needs a batch key and song items.");
                  setPack(parsed);
                  setMessage("File ready for review. Nothing published.");
                });
            }}
          />
        </label>
        <Button
          disabled={!pack || batch !== null}
          onClick={() =>
            void run(async () => {
              const r = await api.POST("/api/v1/song-imports", { body: pack! });
              if (!r.data) throw new Error(apiError(r.error));
              setBatch(r.data);
              setReviewed(false);
              setMessage("Import staged for review.");
            })
          }
        >
          Stage import
        </Button>
        <Button
          variant="outline"
          onClick={() => void run(() => historyPage(0))}
        >
          Load import history
        </Button>
        {history.map((item) => (
          <div className="content-array-item" key={item.id}>
            <span>
              {item.key} · {item.state} · {item.count} songs
            </span>
            <Button
              variant="outline"
              onClick={() =>
                void run(async () => {
                  const r = await api.GET(
                    "/api/v1/content-imports/{identifier}/document",
                    { params: { path: { identifier: item.id } } },
                  );
                  if (!r.data) throw new Error(apiError(r.error));
                  const preview = await api.GET(
                    "/api/v1/song-imports/{identifier}",
                    { params: { path: { identifier: item.id } } },
                  );
                  if (!preview.data) throw new Error(apiError(preview.error));
                  setPack(r.data as Pack);
                  setBatch(preview.data);
                  setReviewed(false);
                })
              }
            >
              Review {item.key}
            </Button>
          </div>
        ))}
        {history.length > 0 && (
          <div className="actions">
            <Button
              disabled={!offset}
              onClick={() => void run(() => historyPage(offset - 20))}
            >
              Previous imports
            </Button>
            <Button
              disabled={history.length < 20}
              onClick={() => void run(() => historyPage(offset + 20))}
            >
              Next imports
            </Button>
          </div>
        )}
        {pack && batch && (
          <details>
            <summary>
              Review supplied songs and component permissions (
              {pack.items.length})
            </summary>
            {pack.items.map((song, i) => (
              <article key={i}>
                <h3>
                  {song.title} — {song.artist} ({song.language})
                </h3>
                <p>
                  Source identifier: {song.external_key}.{" "}
                  {(song.arrangements || []).length} arrangements;{" "}
                  {(song.texts || []).length} text variants. Replacement
                  requested: {pack.replace_existing ? "yes" : "no"}.
                </p>
                <pre className="content-preview">
                  {JSON.stringify(song, null, 2)}
                </pre>
              </article>
            ))}
          </details>
        )}
        {batch && (
          <>
            <p role="status">
              Batch {batch.key}: {batch.state} · {batch.count} songs
            </p>
            {batch.issues.length ? (
              <ul>
                {batch.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p>
                No validation issues found. Verify the actual permissions before
                publishing.
              </p>
            )}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              I reviewed the complete pack, replacement effects and every
              component’s permissions.
            </label>
            <Button
              disabled={
                !reviewed ||
                batch.issues.length > 0 ||
                batch.state === "published"
              }
              onClick={() =>
                void run(async () => {
                  if (!confirm("Publish this reviewed import now?")) return;
                  const r = await api.POST(
                    "/api/v1/song-imports/{identifier}/commit",
                    { params: { path: { identifier: batch.id } } },
                  );
                  if (!r.data) throw new Error(apiError(r.error));
                  setBatch(r.data);
                  setMessage("Reviewed import published.");
                })
              }
            >
              Publish reviewed import
            </Button>
          </>
        )}
      </fieldset>
    </section>
  );
}
