"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { Diagram } from "@/features/chords/diagram";
import { search } from "@/features/chords/music";
import { transposeChord, capoAdvice } from "./music";
const originLabels = {
  application: "Original Chord House content",
  user_submission: "User-submitted content",
  third_party: "Third-party content",
};
type Song = components["schemas"]["SongDetail"];
type Item = components["schemas"]["WorkspaceView"];
type ItemInput = components["schemas"]["WorkspaceInput"];
export function SongDetail({ id }: { id: string }) {
  const [song, setSong] = useState<Song | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [personalError, setPersonalError] = useState("");
  const [personalReady, setPersonalReady] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [arrangementIndex, setArrangementIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [flats, setFlats] = useState(false);
  const [size, setSize] = useState(18);
  const [simple, setSimple] = useState(false);
  const [patterns, setPatterns] = useState<Record<string, string>>({});
  const [collection, setCollection] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [learning, setLearning] = useState<
    "learning" | "practicing" | "comfortable"
  >("learning");
  const loadSong = useCallback(async () => {
    const r = await api.GET("/api/v1/songs/{identifier}", {
      params: { path: { identifier: id } },
    });
    if (!r.data) throw new Error(apiError(r.error));
    return r.data;
  }, [id]);
  const loadPersonal = useCallback(async () => {
    const all: Item[] = [];
    for (let offset = 0; ; offset += 100) {
      const r = await api.GET("/api/v1/workspace", {
        params: { query: { offset, limit: 100 } },
      });
      if (!r.data) throw new Error(apiError(r.error));
      all.push(...r.data);
      if (r.data.length < 100) return all;
    }
  }, []);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      loadSong()
        .then((s) => {
          if (active) {
            setSong(s);
            setError("");
            setLoading(false);
          }
        })
        .catch((e) => {
          if (active) {
            setSong(null);
            setLoading(false);
            setError(e instanceof Error ? e.message : "Song unavailable");
          }
        });
    };
    refresh();
    const timer = setInterval(refresh, 30000);
    const focus = () => refresh();
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [loadSong]);
  useEffect(() => {
    let active = true;
    loadPersonal()
      .then((all) => {
        if (!active) return;
        setItems(all);
        setPersonalReady(true);
        const favorite = all.find(
          (i) => i.kind === "favorite" && i.song_id === id,
        );
        setCollection(favorite?.collection_id || "");
        setLearning(
          (favorite?.learning_status as typeof learning) || "learning",
        );
      })
      .catch(() => {
        if (active)
          setPersonalError(
            "Saved songs could not be loaded. Retry before making changes.",
          );
      });
    api
      .GET("/api/v1/patterns", { params: { query: { limit: 100 } } })
      .then((r) => {
        if (active)
          setPatterns(
            Object.fromEntries(
              (r.data || [])
                .filter((p) => p.status === "published")
                .map((p) => [p.id, p.name]),
            ),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, loadPersonal]);
  const favorite = items.find((i) => i.kind === "favorite" && i.song_id === id);
  const arrangement =
    song?.arrangements[arrangementIndex] || song?.arrangements[0];
  const text = song?.texts[textIndex] || song?.texts[0];
  const transposeAllowed = !!arrangement?.grant.transpose;
  const shift = transposeAllowed ? offset : 0;
  const chordName = (name: string) => transposeChord(name, shift, flats);
  async function saveFavorite(remove = false) {
    if (!song) return;
    setBusy(true);
    setPersonalError("");
    try {
      if (remove && favorite) {
        const r = await api.DELETE("/api/v1/workspace/{identifier}", {
          params: { path: { identifier: favorite.id } },
        });
        if (!r.response.ok) throw new Error(apiError(r.error));
        setItems((old) => old.filter((i) => i.id !== favorite.id));
        setMessage("Song removed from favorites.");
      } else {
        const body: ItemInput = {
          kind: "favorite",
          title: song.title.slice(0, 120),
          body: favorite?.body || "",
          priority: favorite?.priority || "normal",
          category: favorite?.category || "",
          completed: favorite?.completed || false,
          due: favorite?.due || null,
          song_id: song.id,
          collection_id: collection || null,
          learning_status: learning,
        };
        const r = favorite
          ? await api.PUT("/api/v1/workspace/{identifier}", {
              params: { path: { identifier: favorite.id } },
              body,
            })
          : await api.POST("/api/v1/workspace", { body });
        if (!r.data) throw new Error(apiError(r.error));
        const saved = r.data;
        setItems((old) => [...old.filter((i) => i.id !== saved.id), saved]);
        setMessage("Song saved to your favorites.");
      }
    } catch (e) {
      setPersonalError(e instanceof Error ? e.message : "Unable to save song");
    } finally {
      setBusy(false);
    }
  }
  async function createCollection() {
    setBusy(true);
    try {
      const r = await api.POST("/api/v1/workspace", {
        body: {
          kind: "collection",
          title: collectionName,
          body: "",
          priority: "normal",
          category: "",
          completed: false,
          learning_status: "learning",
        },
      });
      if (!r.data) throw new Error(apiError(r.error));
      const item = r.data;
      setItems((old) => [...old, item]);
      setCollection(item.id);
      setCollectionName("");
      setMessage("Collection created. Save the song to add it.");
    } catch (e) {
      setPersonalError(
        e instanceof Error ? e.message : "Unable to create collection",
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p role="status">Loading song…</p>;
  if (!song)
    return (
      <section className="panel">
        <h1>Song unavailable</h1>
        <Feedback error message={error} />
        <Button
          onClick={() => {
            setLoading(true);
            loadSong()
              .then((s) => {
                setSong(s);
                setLoading(false);
                setError("");
              })
              .catch((e) => {
                setLoading(false);
                setError(e.message);
              });
          }}
        >
          Retry song
        </Button>{" "}
        <Link href="/songs">Back to songs</Link>
      </section>
    );
  return (
    <article className={`panel song-learning ${simple ? "practice-view" : ""}`}>
      <Link href="/songs">← All songs</Link>
      <p className="eyebrow">
        {song.language === "en"
          ? "English"
          : song.language === "ur"
            ? "Urdu"
            : "Hindi"}
      </p>
      <h1>{song.title}</h1>
      <Link href={`/reports?kind=song&key=${id}`}>Report this song</Link>
      <p className="lede">{song.artist}</p>
      {song.version_note && <p>Recording context: {song.version_note}</p>}
      {!simple && (
        <>
          <p>
            {song.genre || "Genre unassigned"} ·{" "}
            {song.aliases.length
              ? `Also searchable as: ${song.aliases.join(" · ")}`
              : "No alternate titles recorded"}
          </p>
          <details>
            <summary>Metadata source and rights</summary>
            <p>
              {song.metadata_grant.attribution} · {song.metadata_grant.license}
            </p>
            <a
              href={song.metadata_grant.source_url}
              target="_blank"
              rel="noreferrer"
            >
              View metadata source
            </a>
          </details>
        </>
      )}
      <label className="checkbox">
        <input
          type="checkbox"
          checked={simple}
          onChange={(e) => setSimple(e.target.checked)}
        />
        Simplified practice view
      </label>
      <label>
        Learning text size
        <input
          type="range"
          min={16}
          max={32}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
      </label>
      <p className="hint">
        Metadata: {song.metadata_grant.attribution} ·{" "}
        {originLabels[song.metadata_grant.origin]}
      </p>
      <section aria-label="Song arrangement">
        <h2>Chords & arrangement</h2>
        {!arrangement ? (
          <p>
            No approved arrangement is available. No capo specified. Difficulty,
            tuning, instrument and chord/capo information have not been invented
            for this entry.
          </p>
        ) : (
          <>
            <label>
              Choose arrangement
              <select
                value={arrangementIndex}
                onChange={(e) => {
                  setArrangementIndex(Number(e.target.value));
                  setOffset(0);
                }}
              >
                {song.arrangements.map((a, i) => (
                  <option value={i} key={a.key}>
                    {a.name} · {a.instrument}
                  </option>
                ))}
              </select>
            </label>
            <p>
              {arrangement.instrument} · {arrangement.tuning} tuning ·{" "}
              {arrangement.difficulty} ·{" "}
              {arrangement.capo == null
                ? "No capo specified"
                : `Source capo: ${arrangement.capo}`}{" "}
              ·{" "}
              {arrangement.key_note
                ? `Source key: ${arrangement.key_note}`
                : "Source key unspecified"}
            </p>
            <p>{arrangement.guidance}</p>
            <label>
              Transpose semitones
              <select
                disabled={!transposeAllowed}
                value={shift}
                onChange={(e) => setOffset(Number(e.target.value))}
              >
                {Array.from({ length: 25 }, (_, i) => i - 12).map((n) => (
                  <option key={n} value={n}>
                    {n > 0 ? "+" : ""}
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Accidental preference
              <select
                value={flats ? "flat" : "sharp"}
                onChange={(e) => setFlats(e.target.value === "flat")}
              >
                <option value="sharp">Sharps</option>
                <option value="flat">Flats</option>
              </select>
            </label>
            <p>
              Transpose offset: {shift > 0 ? "+" : ""}
              {shift} semitones.{" "}
              {transposeAllowed
                ? "The stored arrangement is unchanged."
                : "The grant does not permit transposition."}
            </p>
            <Button variant="outline" onClick={() => setOffset(0)}>
              Reset original key
            </Button>
            <p>
              {capoAdvice(
                arrangement.instrument,
                arrangement.tuning,
                arrangement.capo,
                arrangement.key_note,
                shift,
              )}
            </p>
            <div className="song-chords">
              {arrangement.chords.map((c, i) => {
                const name = chordName(c);
                const root = name.split("/")[0];
                const voicing =
                  arrangement.tuning === "standard" ||
                  arrangement.tuning === "reentrant"
                    ? search(root, arrangement.instrument, "").find(
                        (v) =>
                          transposeChord(
                            v.name.replaceAll(" ", ""),
                            0,
                            flats,
                          ) === root,
                      )
                    : undefined;
                return (
                  <section key={`${c}-${i}`}>
                    <h3>{name}</h3>
                    {voicing ? (
                      <Diagram
                        name={name}
                        frets={voicing.frets}
                        fingers={voicing.fingers}
                        instrument={arrangement.instrument}
                      />
                    ) : (
                      <p>
                        No compatible diagram available. See{" "}
                        <Link href="/chords">chord builder</Link>.
                      </p>
                    )}
                    {name.includes("/") && (
                      <p>
                        Diagram shows the root chord; bass note{" "}
                        {name.split("/")[1]} needs a suitable inversion.
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
            {arrangement.pattern_id && patterns[arrangement.pattern_id] && (
              <p>
                Practice suggestion:{" "}
                <Link href="/patterns">{patterns[arrangement.pattern_id]}</Link>
                . Start slowly and adapt only after checking the song’s meter.
              </p>
            )}
            <p className="hint">
              Arrangement: {arrangement.grant.attribution} ·{" "}
              {originLabels[arrangement.grant.origin]}
            </p>
            <details>
              <summary>Arrangement provenance</summary>
              <p>
                {arrangement.grant.attribution} · {arrangement.grant.license}
              </p>
              <a
                href={arrangement.grant.source_url}
                target="_blank"
                rel="noreferrer"
              >
                Arrangement source
              </a>
            </details>
          </>
        )}
      </section>
      <section aria-label="Song text">
        <h2>Lyrics & text variants</h2>
        {!text ? (
          <>
            <p>
              Full lyrics are unavailable because no display permission has been
              verified. Roman Urdu/Hindi lyrics need permission too.
            </p>
            {song.lyrics_url && (
              <a href={song.lyrics_url} target="_blank" rel="noreferrer">
                Open authorized lyrics source
              </a>
            )}
          </>
        ) : (
          <>
            <label>
              Text variant
              <select
                value={textIndex}
                onChange={(e) => setTextIndex(Number(e.target.value))}
              >
                {song.texts.map((t, i) => (
                  <option key={t.key} value={i}>
                    {t.label} · {t.language}-{t.script}
                  </option>
                ))}
              </select>
            </label>
            <div
              className="song-lines"
              style={{ fontSize: size }}
              lang={`${text.language}-${text.script}`}
              dir={text.script === "Arab" ? "rtl" : "ltr"}
            >
              {text.lines.map((line, i) => {
                const placements =
                  arrangement?.text_key === text.key
                    ? arrangement.placements?.filter((p) => p.line === i) || []
                    : [];
                const chords = placements.reduce(
                  (value, p) =>
                    value.padEnd(p.offset, " ") + chordName(p.chord) + " ",
                  "",
                );
                return (
                  <div key={i}>
                    {chords && (
                      <pre
                        aria-label={`Chords for line ${i + 1}`}
                        className="chord-line"
                      >
                        {chords}
                      </pre>
                    )}
                    <p>{line || "\u00a0"}</p>
                  </div>
                );
              })}
            </div>
            <p className="hint">
              Text: {text.grant.attribution} · {originLabels[text.grant.origin]}
            </p>
            <details>
              <summary>Text provenance</summary>
              <p>
                {text.grant.attribution} · {text.grant.license}
              </p>
              <a href={text.grant.source_url} target="_blank" rel="noreferrer">
                Text source
              </a>
            </details>
          </>
        )}
      </section>
      {!simple && (
        <section>
          <h2>Your saved song</h2>
          <p>{favorite ? "Saved privately." : "Not in your favorites yet."}</p>
          <Feedback error message={personalError} />
          {personalError && (
            <Button
              onClick={() =>
                void loadPersonal()
                  .then((all) => {
                    setItems(all);
                    setPersonalReady(true);
                    setPersonalError("");
                  })
                  .catch(() =>
                    setPersonalError("Unable to reload saved songs."),
                  )
              }
            >
              Retry saved songs
            </Button>
          )}
          <label>
            Learning status
            <select
              value={learning}
              onChange={(e) => setLearning(e.target.value as typeof learning)}
            >
              <option value="learning">Learning</option>
              <option value="practicing">Practicing</option>
              <option value="comfortable">Comfortable / learned</option>
            </select>
          </label>
          <label>
            Song collection
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
            >
              <option value="">No collection</option>
              {items
                .filter((i) => i.kind === "collection")
                .map((i) => (
                  <option value={i.id} key={i.id}>
                    {i.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            New collection name
            <input
              value={collectionName}
              maxLength={120}
              onChange={(e) => setCollectionName(e.target.value)}
            />
          </label>
          <Button
            variant="outline"
            disabled={
              busy ||
              !personalReady ||
              !collectionName.trim() ||
              !!personalError
            }
            onClick={() => void createCollection()}
          >
            Create song collection
          </Button>{" "}
          <Button
            disabled={busy || !personalReady || !!personalError}
            onClick={() => void saveFavorite()}
          >
            {favorite ? "Update saved song" : "Favorite song"}
          </Button>{" "}
          {favorite && (
            <Button
              variant="outline"
              disabled={busy || !personalReady || !!personalError}
              onClick={() => void saveFavorite(true)}
            >
              Remove favorite song
            </Button>
          )}
          <Feedback message={message} />
          <p>
            <Link href="/dashboard">
              View and filter your favorites and collections in Workspace
            </Link>
            .
          </p>
        </section>
      )}
    </article>
  );
}
