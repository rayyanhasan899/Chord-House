import { api, apiError } from "@/lib/api/client";
import type { Sources } from "./types";
export async function loadSources(): Promise<Sources> {
  const songs: Sources["songs"] = [],
    chords: Sources["chords"] = [],
    patterns: Sources["patterns"] = [];
  await Promise.all([
    (async () => {
      for (let offset = 0; ; offset += 100) {
        const r = await api.GET("/api/v1/songs", {
          params: { query: { offset, limit: 100 } },
        });
        if (!r.data) throw new Error(apiError(r.error));
        songs.push(...r.data.items);
        if (offset + 100 >= r.data.total) break;
      }
    })(),
    (async () => {
      for (let offset = 0; ; offset += 100) {
        const r = await api.GET("/api/v1/custom-chords", {
          params: { query: { offset, limit: 100 } },
        });
        if (!r.data) throw new Error(apiError(r.error));
        chords.push(...r.data);
        if (r.data.length < 100) break;
      }
    })(),
    (async () => {
      for (let offset = 0; ; offset += 100) {
        const r = await api.GET("/api/v1/patterns", {
          params: { query: { offset, limit: 100 } },
        });
        if (!r.data) throw new Error(apiError(r.error));
        patterns.push(...r.data);
        if (r.data.length < 100) break;
      }
    })(),
  ]);
  return { songs, chords, patterns };
}
