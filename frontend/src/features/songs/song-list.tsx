"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, apiError } from "@/lib/api/client";
import type { components, operations } from "@/lib/api/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
type Filters = NonNullable<
  operations["list_songs_api_v1_songs_get"]["parameters"]["query"]
>;
const languages: Record<string, string> = {
  en: "English",
  ur: "Urdu",
  hi: "Hindi",
};
export function SongList() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [artist, setArtist] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [instrument, setInstrument] = useState("");
  const [genre, setGenre] = useState("");
  const [availability, setAvailability] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<components["schemas"]["SongPage"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params: Filters = { q: query, artist, genre, offset, limit: 20 };
      if (language) params.language = language as Filters["language"];
      if (difficulty) params.difficulty = difficulty as Filters["difficulty"];
      if (instrument) params.instrument = instrument as Filters["instrument"];
      if (availability)
        params.availability = availability as Filters["availability"];
      api
        .GET("/api/v1/songs", {
          params: { query: params },
          signal: controller.signal,
        })
        .then((r) => {
          if (!active) return;
          if (!r.data) throw new Error(apiError(r.error));
          setData(r.data);
          setLoading(false);
          setError("");
        })
        .catch((e) => {
          if (active) {
            setLoading(false);
            setError(e instanceof Error ? e.message : "Unable to load songs");
          }
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    query,
    language,
    artist,
    difficulty,
    instrument,
    genre,
    availability,
    offset,
    retry,
  ]);
  function changed(update: () => void) {
    update();
    setOffset(0);
    setLoading(true);
    setData(null);
    setError("");
  }
  return (
    <section className="panel">
      <p className="eyebrow">Song discovery</p>
      <h1>Find a song to learn.</h1>
      <p>
        English, Urdu and Hindi identities, including Roman-script search.
        Learning content is shown only when approved. Metadata-only entries are
        clearly marked; an entry is not a promise of lyrics or an arrangement.
      </p>
      <div className="form-grid">
        <label>
          Search songs
          <Input
            value={query}
            maxLength={200}
            onChange={(e) => changed(() => setQuery(e.target.value))}
            placeholder="Title, artist or Roman alias"
          />
        </label>
        <label>
          Song language
          <select
            value={language}
            onChange={(e) => changed(() => setLanguage(e.target.value))}
          >
            <option value="">All languages</option>
            {Object.entries(languages).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Artist filter
          <Input
            value={artist}
            maxLength={200}
            onChange={(e) => changed(() => setArtist(e.target.value))}
          />
        </label>
        <label>
          Genre filter
          <Input
            value={genre}
            maxLength={60}
            onChange={(e) => changed(() => setGenre(e.target.value))}
          />
        </label>
        <label>
          Arrangement difficulty
          <select
            value={difficulty}
            onChange={(e) => changed(() => setDifficulty(e.target.value))}
          >
            <option value="">Any / unassigned</option>
            {["beginner", "intermediate", "advanced"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          Arrangement instrument
          <select
            value={instrument}
            onChange={(e) => changed(() => setInstrument(e.target.value))}
          >
            <option value="">Any / unspecified</option>
            {["guitar", "bass", "ukulele"].map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
        <label>
          Content available
          <select
            value={availability}
            onChange={(e) => changed(() => setAvailability(e.target.value))}
          >
            <option value="">All entries</option>
            <option value="arrangement">Approved arrangement</option>
            <option value="lyrics">Approved full text</option>
          </select>
        </label>
      </div>
      {loading && <p role="status">Loading songs…</p>}
      <Feedback error message={error} />
      {error && (
        <Button
          onClick={() => {
            setLoading(true);
            setRetry((n) => n + 1);
          }}
        >
          Retry songs
        </Button>
      )}
      {!loading && data && (
        <>
          <p>
            {data.total} matching songs. Showing {data.total ? offset + 1 : 0}–
            {Math.min(offset + 20, data.total)}.
          </p>
          {!data.items.length && (
            <p>
              No songs match. Try a shorter title, a Roman spelling, or clear
              filters. Difficulty/instrument filters include only approved
              arrangements with that metadata.
            </p>
          )}
          <ul className="pattern-library">
            {data.items.map((song) => (
              <li key={song.id}>
                <h2>
                  <Link href={`/songs/${song.id}`}>{song.title}</Link>
                </h2>
                <p>
                  {song.artist} · {languages[song.language]}
                </p>
                <p>
                  {song.arrangement_count
                    ? `${song.arrangement_count} approved arrangements`
                    : "Metadata only — arrangement unavailable"}{" "}
                  ·{" "}
                  {song.text_count
                    ? `${song.text_count} approved text variants`
                    : "Lyrics unavailable"}
                </p>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            disabled={offset === 0}
            onClick={() => {
              setOffset(Math.max(0, offset - 20));
              setLoading(true);
              setData(null);
            }}
          >
            Previous songs
          </Button>{" "}
          <Button
            variant="outline"
            disabled={offset + 20 >= data.total}
            onClick={() => {
              setOffset(offset + 20);
              setLoading(true);
              setData(null);
            }}
          >
            Next songs
          </Button>
        </>
      )}
    </section>
  );
}
