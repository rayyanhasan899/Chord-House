"use client";
import { useEffect, useState } from "react";
import { api, apiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
type Entry = components["schemas"]["ContentView"];
export function useReferences(kind: "instrument" | "tuning" | "chord") {
  const [rows, setRows] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true,
      pending = false;
    async function load() {
      if (pending) return;
      pending = true;
      try {
        const result: Entry[] = [];
        for (let offset = 0; ; offset += 100) {
          const r = await api.GET("/api/v1/reference-content/{kind}", {
            params: { path: { kind }, query: { offset, limit: 100 } },
          });
          if (!r.data) throw new Error(apiError(r.error));
          result.push(...r.data);
          if (r.data.length < 100) break;
        }
        if (active) {
          setRows(result);
          setError("");
          setLoaded(true);
        }
      } catch (e) {
        if (active) {
          setRows([]);
          setError(
            e instanceof Error
              ? e.message
              : "Catalogue unavailable. Refresh to retry.",
          );
          setLoaded(true);
        }
      } finally {
        pending = false;
      }
    }
    void load();
    const timer = setInterval(() => void load(), 30000);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [kind]);
  return { rows, error, loaded };
}
