"use client";
import { useCallback, useEffect, useState } from "react";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
import Link from "next/link";
import { useAuth } from "@/features/auth/context";
type Item = components["schemas"]["WorkspaceView"];
type Draft = components["schemas"]["WorkspaceInput"];
const blank: Draft = {
  kind: "task",
  title: "",
  body: "",
  priority: "normal",
  category: "",
  completed: false,
  due: null,
  collection_id: null,
  song_id: null,
  learning_status: "learning",
};
export function Workspace() {
  const { profile } = useAuth();
  const [songs, setSongs] = useState<{ id: string; title: string }[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [edit, setEdit] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [songStatus, setSongStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading your workspace…");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const fetchItems = useCallback(async () => {
    const collected: Item[] = [];
    for (let offset = 0; ; offset += 100) {
      const r = await api.GET("/api/v1/workspace", {
        params: { query: { offset, limit: 100 } },
      });
      if (!r.data) throw new Error(apiError(r.error));
      collected.push(...r.data);
      if (r.data.length < 100) break;
    }
    return collected;
  }, []);
  const load = useCallback(async () => {
    const collected = await fetchItems();
    setItems(collected);
    setStatus("");
    setError(false);
  }, [fetchItems]);
  useEffect(() => {
    fetchItems()
      .then((collected) => {
        setItems(collected);
        setStatus("");
        setError(false);
      })
      .catch((e) => {
        setError(true);
        setStatus(e.message);
      });
  }, [fetchItems]);
  useEffect(() => {
    let active = true;
    async function listSongs() {
      const all: { id: string; title: string }[] = [];
      for (let offset = 0; ; offset += 100) {
        const r = await api.GET("/api/v1/workspace/songs", {
          params: { query: { offset, limit: 100 } },
        });
        if (!r.data) return;
        all.push(...r.data.map((s) => ({ id: s.id, title: s.title })));
        if (r.data.length < 100) {
          if (active) setSongs(all);
          return;
        }
      }
    }
    void listSongs().catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = edit
        ? await api.PUT("/api/v1/workspace/{identifier}", {
            params: { path: { identifier: edit } },
            body: draft,
          })
        : await api.POST("/api/v1/workspace", { body: draft });
      if (!r.data) throw new Error(apiError(r.error));
      await load();
      setDraft(blank);
      setEdit(null);
      setStatus("Saved");
    } catch (e) {
      setError(true);
      setStatus(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setBusy(true);
    try {
      const r = await api.DELETE("/api/v1/workspace/{identifier}", {
        params: { path: { identifier: id } },
      });
      if (!r.response.ok) throw new Error(apiError(r.error));
      await load();
      setStatus("Deleted");
    } catch (e) {
      setError(true);
      setStatus(e instanceof Error ? e.message : "Unable to delete");
    } finally {
      setBusy(false);
    }
  }
  const tasks = items.filter((i) => i.kind === "task");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile?.timezone || "UTC",
  }).format(new Date());
  return (
    <>
      <p className="eyebrow">Your personal workspace</p>
      <h1>Make practice intentional.</h1>
      <p>
        {tasks.filter((t) => !t.completed).length} open tasks ·{" "}
        {items.filter((i) => i.kind === "collection").length} collections ·{" "}
        {items.filter((i) => i.kind === "note").length} notes
      </p>
      <p>
        <Link href="/onboarding">Edit profile & preferences</Link>
      </p>
      <Feedback error={error} message={status} />
      {error && (
        <Button onClick={() => void load().catch((e) => setStatus(e.message))}>
          Try again
        </Button>
      )}
      <div className="account-grid">
        <section className="panel">
          <h2>{edit ? "Edit item" : "Add to your workspace"}</h2>
          <form onSubmit={save}>
            <label>
              Type
              <select
                disabled={!!edit}
                value={draft.kind}
                onChange={(e) =>
                  setDraft({ ...blank, kind: e.target.value as Draft["kind"] })
                }
              >
                <option value="task">Task</option>
                <option value="collection">Collection</option>
                <option value="note">Learning note</option>
                <option value="favorite">Favorite song</option>
              </select>
            </label>
            {draft.kind === "favorite" && (
              <>
                <label>
                  Catalogue song
                  <select
                    required
                    value={draft.song_id || ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        song_id: e.target.value || null,
                        title:
                          songs.find((s) => s.id === e.target.value)?.title ||
                          "",
                      })
                    }
                  >
                    <option value="">Choose a reviewed song</option>
                    {songs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </label>
                {!songs.length && (
                  <p>
                    No reviewed songs are available yet. Your song favorites
                    will be available when catalogue content is added.
                  </p>
                )}
                <label>
                  Learning status
                  <select
                    value={draft.learning_status || "learning"}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        learning_status: e.target
                          .value as Draft["learning_status"],
                      })
                    }
                  >
                    <option>learning</option>
                    <option>practicing</option>
                    <option>comfortable</option>
                  </select>
                </label>
              </>
            )}
            {draft.kind !== "favorite" && (
              <label>
                Song link (optional)
                <select
                  value={draft.song_id || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, song_id: e.target.value || null })
                  }
                >
                  <option value="">None</option>
                  {songs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Title
              <Input
                required
                maxLength={120}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label>
              Details
              <textarea
                maxLength={10000}
                value={draft.body || ""}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
            </label>
            {draft.kind === "task" && (
              <>
                <label>
                  Due date
                  <Input
                    type="date"
                    value={draft.due || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, due: e.target.value || null })
                    }
                  />
                </label>
                <label>
                  Priority
                  <select
                    value={draft.priority}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        priority: e.target.value as Draft["priority"],
                      })
                    }
                  >
                    <option>low</option>
                    <option>normal</option>
                    <option>high</option>
                  </select>
                </label>
                <label>
                  Category
                  <Input
                    maxLength={60}
                    value={draft.category || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value })
                    }
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={draft.completed || false}
                    onChange={(e) =>
                      setDraft({ ...draft, completed: e.target.checked })
                    }
                  />
                  Completed
                </label>
              </>
            )}
            {draft.kind !== "collection" && (
              <label>
                Collection
                <select
                  value={draft.collection_id || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      collection_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">None</option>
                  {items
                    .filter((i) => i.kind === "collection")
                    .map((i) => (
                      <option value={i.id} key={i.id}>
                        {i.title}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <Button disabled={busy}>{busy ? "Saving…" : "Save item"}</Button>
            {edit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEdit(null);
                  setDraft(blank);
                }}
              >
                Cancel edit
              </Button>
            )}
          </form>
        </section>
        <section>
          <h2>Your items</h2>
          <label>
            Search
            <Input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label>
            Filter
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="open">Open tasks</option>
              <option value="completed">Completed tasks</option>
              <option value="overdue">Overdue tasks</option>
              <option value="collection">Collections</option>
              <option value="note">Notes</option>
              <option value="favorite">Favorite songs</option>
            </select>
          </label>
          {!status && !items.length && (
            <p>No saved items yet. Start with a task or collection.</p>
          )}
          <label>
            Filter saved collection
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
            >
              <option value="">All collections</option>
              {items
                .filter((i) => i.kind === "collection")
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Filter song learning status
            <select
              value={songStatus}
              onChange={(e) => setSongStatus(e.target.value)}
            >
              <option value="">Any status</option>
              <option value="learning">Learning</option>
              <option value="practicing">Practicing</option>
              <option value="comfortable">Comfortable / learned</option>
            </select>
          </label>
          <label>
            Sort saved items
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
          {items
            .filter(
              (i) =>
                (i.title + " " + i.body + " " + i.category)
                  .toLowerCase()
                  .includes(query.toLowerCase()) &&
                (!collectionFilter || i.collection_id === collectionFilter) &&
                (!songStatus ||
                  (i.kind === "favorite" &&
                    i.learning_status === songStatus)) &&
                (filter === "all" ||
                  i.kind === filter ||
                  ((filter === "open" ||
                    filter === "completed" ||
                    filter === "overdue") &&
                    i.kind === "task" &&
                    (filter === "completed"
                      ? i.completed
                      : filter === "overdue"
                        ? !i.completed && !!i.due && i.due < today
                        : !i.completed))),
            )
            .sort((a, b) =>
              sort === "title"
                ? a.title.localeCompare(b.title)
                : b.created_at.localeCompare(a.created_at),
            )
            .map((i) => (
              <article
                key={i.id}
                className="panel"
                style={{ marginBlock: "1rem" }}
              >
                <span className="tag">
                  {i.kind} {i.completed ? "· completed" : ""}
                </span>
                <h3>{i.title}</h3>
                {i.song_id && (
                  <p>
                    <Link href={`/songs/${i.song_id}`}>Open linked song</Link> ·{" "}
                    {i.learning_status}
                  </p>
                )}
                {i.collection_id && (
                  <p>
                    Collection:{" "}
                    {items.find((c) => c.id === i.collection_id)?.title ||
                      "Unavailable"}
                  </p>
                )}
                <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  {i.body}
                </p>
                <p>
                  {i.due ? `Due ${i.due} · ` : ""}
                  {i.priority} {i.category}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const { id, created_at, updated_at, ...body } = i;
                    void created_at;
                    void updated_at;
                    setEdit(id);
                    setDraft(body);
                  }}
                >
                  Edit
                </Button>{" "}
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => void remove(i.id)}
                >
                  Delete
                </Button>
              </article>
            ))}
        </section>
      </div>
      <p>
        Song favorites connect to the catalog. Practice totals arrive with saved
        practice sessions in their assigned phase; no fabricated activity is
        shown.
      </p>
    </>
  );
}
