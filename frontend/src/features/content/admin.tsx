"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
import { Fields, template, emptyGrant } from "./editor";
import { Imports } from "./imports";
import { Reports } from "./reports";
type Entry = components["schemas"]["ContentView"];
type Kind = Entry["kind"];
type Audit = components["schemas"]["AuditView"];
export function Administration() {
  const { profile } = useAuth();
  const allowed = ["admin", "content_manager"].includes(profile?.role || "");
  const [kind, setKind] = useState<Kind>("song");
  const [rows, setRows] = useState<Entry[]>([]);
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [newKey, setNewKey] = useState("");
  const [document, setDocument] = useState<Record<string, unknown> | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [auditOffset, setAuditOffset] = useState(0);
  const [withdrawal, setWithdrawal] = useState<
    "metadata" | "text" | "arrangement"
  >("metadata");
  const [componentKey, setComponentKey] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await api.GET("/api/v1/content/{kind}", {
        params: { path: { kind }, query: { offset, limit: 20 } },
      });
      if (!r.data) throw new Error(apiError(r.error));
      setRows(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load catalogue.");
    } finally {
      setLoading(false);
    }
  }, [kind, offset]);
  useEffect(() => {
    if (!allowed) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [allowed, load]);
  async function save(status: "draft" | "published" | "archived") {
    if (!document) return;
    if (
      status === "published" &&
      !confirm(
        "Publish this reviewed content? Confirm the source and every component's rights are current.",
      )
    )
      return;
    if (
      status === "archived" &&
      !confirm("Archive this entry and remove it from the available catalogue?")
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await api.PUT("/api/v1/content/{kind}/{key}", {
        params: { path: { kind, key: editing?.key || newKey } },
        body: { revision: editing?.revision || 0, status, document },
      });
      if (!r.data) throw new Error(apiError(r.error));
      setEditing(r.data);
      setDocument(r.data.document);
      await load();
      setMessage(`Content ${status === "draft" ? "saved as draft" : status}.`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Save failed. Your edits are retained.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function auditPage(next: number) {
    setBusy(true);
    setError("");
    try {
      const r = await api.GET("/api/v1/content-audit", {
        params: { query: { offset: next, limit: 20 } },
      });
      if (!r.data) throw new Error(apiError(r.error));
      setAudits(r.data);
      setAuditOffset(next);
      setMessage(
        r.data.length
          ? "Audit history loaded."
          : "No audit events on this page.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load audit history.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!allowed)
    return (
      <section className="panel">
        <h1>Administration</h1>
        <p>
          Content manager access required. Your account can use the learning
          tools and submit content reports.
        </p>
      </section>
    );
  return (
    <>
      <p className="eyebrow">Shared catalogue operations</p>
      <h1>Administration</h1>
      <p>
        Manage shared content. Private chords, patterns, notes and practice
        records are never listed here. Saving a draft removes an already
        published entry from the available catalogue until you publish it again.
      </p>
      <Feedback message={message} />
      <Feedback error message={error} />
      <section className="panel">
        <h2>Catalogue</h2>
        <label>
          Content type
          <select
            aria-label="Content type"
            disabled={busy || document !== null}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as Kind);
              setOffset(0);
            }}
          >
            {["instrument", "tuning", "chord", "pattern", "song"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <div className="actions">
          <Button
            disabled={busy || document !== null}
            onClick={() => {
              setEditing(null);
              setNewKey(
                kind === "song" || kind === "pattern"
                  ? crypto.randomUUID()
                  : "",
              );
              setDocument(template(kind));
              setMessage("");
            }}
          >
            Create {kind}
          </Button>
          <Button
            variant="outline"
            disabled={busy || loading}
            onClick={() => void load()}
          >
            Reload catalogue
          </Button>
        </div>
        {loading ? (
          <p role="status">Loading catalogue…</p>
        ) : (
          <>
            <ul className="content-list">
              {rows.map((row) => (
                <li key={row.key}>
                  <span>
                    <strong>
                      {String(row.document.title || row.document.name)}
                    </strong>{" "}
                    · {row.status}
                    <small>
                      {row.key} · revision {row.revision}
                    </small>
                  </span>
                  <Button
                    variant="outline"
                    disabled={busy || document !== null}
                    onClick={() => {
                      setEditing(row);
                      setDocument(
                        kind === "pattern" && !row.document.grant
                          ? { ...row.document, grant: emptyGrant() }
                          : row.document,
                      );
                      setNewKey(row.key);
                      setMessage("");
                    }}
                  >
                    Edit {String(row.document.title || row.document.name)}
                  </Button>
                </li>
              ))}
            </ul>
            {!rows.length && (
              <p>
                No entries on this page. Create an entry or return to the
                previous page.
              </p>
            )}
            <div className="actions">
              <Button
                disabled={busy || offset === 0 || document !== null}
                onClick={() => setOffset(offset - 20)}
              >
                Previous entries
              </Button>
              <Button
                disabled={busy || rows.length < 20 || document !== null}
                onClick={() => setOffset(offset + 20)}
              >
                Next entries
              </Button>
            </div>
          </>
        )}
      </section>
      {document && (
        <section className="panel">
          <h2>{editing ? "Edit shared content" : "Create shared content"}</h2>
          <p>
            Review every source and permission. A checked box is an attestation,
            not proof of rights. Lyrics, Roman text and arrangements each need
            their own grant. Dates use ISO format with a timezone.
          </p>
          <fieldset disabled={busy}>
            {editing && kind === "song" && (
              <fieldset>
                <legend>Withdraw rights immediately</legend>
                <p>
                  Withdraw metadata to hide the whole song, or a named
                  text/arrangement component. This uses the saved content and
                  discards unsaved edits only after successful withdrawal.
                </p>
                <label>
                  Withdrawal component
                  <select
                    value={withdrawal}
                    onChange={(e) =>
                      setWithdrawal(e.target.value as typeof withdrawal)
                    }
                  >
                    <option value="metadata">Entire song (metadata)</option>
                    <option value="text">Text variant</option>
                    <option value="arrangement">Arrangement</option>
                  </select>
                </label>
                {withdrawal !== "metadata" && (
                  <label>
                    Component code to withdraw
                    <Input
                      value={componentKey}
                      onChange={(e) => setComponentKey(e.target.value)}
                    />
                  </label>
                )}
                <Button
                  variant="outline"
                  disabled={withdrawal !== "metadata" && !componentKey}
                  onClick={async () => {
                    if (
                      !confirm(
                        "Withdraw these rights now? Unsaved edits will be discarded after withdrawal.",
                      )
                    )
                      return;
                    setBusy(true);
                    setError("");
                    try {
                      const r = await api.POST(
                        "/api/v1/managed-songs/{identifier}/withdraw",
                        {
                          params: { path: { identifier: editing.key } },
                          body: {
                            component: withdrawal,
                            key:
                              withdrawal === "metadata" ? null : componentKey,
                          },
                        },
                      );
                      if (!r.response.ok) throw new Error(apiError(r.error));
                      setDocument(null);
                      setEditing(null);
                      await load();
                      setMessage(
                        "Rights withdrawn. Future catalogue reads hide the affected content.",
                      );
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : "Unable to withdraw rights.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Withdraw rights
                </Button>
              </fieldset>
            )}
            <label>
              Catalogue code
              <Input
                value={newKey}
                disabled={!!editing}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </label>
            <Fields value={document} onChange={setDocument} />
            <div className="actions">
              <Button onClick={() => void save("draft")}>Save draft</Button>
              <Button onClick={() => void save("published")}>
                Publish reviewed content
              </Button>
              {editing && (
                <Button variant="outline" onClick={() => void save("archived")}>
                  Archive content
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    confirm("Close the editor? Unsaved edits will be lost.")
                  ) {
                    setDocument(null);
                    setEditing(null);
                  }
                }}
              >
                Close editor
              </Button>
            </div>
          </fieldset>
        </section>
      )}
      <Imports />
      <Reports managed />
      <section className="panel">
        <h2>Audit history</h2>
        <p>
          Actions, time, target and account reference only. Report bodies, email
          addresses, passwords and permission evidence are excluded.
        </p>
        <Button disabled={busy} onClick={() => void auditPage(0)}>
          Load audit history
        </Button>
        <ul className="content-list">
          {audits.map((a) => (
            <li key={a.id}>
              <span>
                {a.action} · {a.kind} · {a.key}
                <small>
                  {new Date(a.created_at).toLocaleString()} ·{" "}
                  {a.actor_id || "System / anonymized"}
                </small>
              </span>
            </li>
          ))}
        </ul>
        {audits.length > 0 && (
          <div className="actions">
            <Button
              disabled={busy || !auditOffset}
              onClick={() => void auditPage(auditOffset - 20)}
            >
              Previous events
            </Button>
            <Button
              disabled={busy || audits.length < 20}
              onClick={() => void auditPage(auditOffset + 20)}
            >
              Next events
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
