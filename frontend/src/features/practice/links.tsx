import { Input } from "@/components/ui/input";
import type { Details, Sources } from "./types";
import { instruments, instrumentLabel, kind } from "./types";
export function SessionFields({
  value,
  change,
  sources,
  disabled = false,
}: {
  value: Details;
  change: (value: Details) => void;
  sources: Sources;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <div className="form-grid">
        <label>
          Practice instrument
          <select
            value={value.instrument}
            onChange={(e) =>
              change({
                ...value,
                instrument: e.target.value as Details["instrument"],
                chord_id: null,
              })
            }
          >
            {instruments.map((i) => (
              <option key={i} value={i}>
                {instrumentLabel(i)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Session song
          <select
            value={value.song_id || ""}
            onChange={(e) =>
              change({ ...value, song_id: e.target.value || null })
            }
          >
            <option value="">No linked song</option>
            {sources.songs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} · {s.artist}
              </option>
            ))}
          </select>
        </label>
        <label>
          Session custom chord
          <select
            value={value.chord_id || ""}
            onChange={(e) =>
              change({ ...value, chord_id: e.target.value || null })
            }
          >
            <option value="">No private chord</option>
            {sources.chords
              .filter((c) => c.instrument === kind(value.instrument))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Session chord symbol
          <Input
            maxLength={15}
            placeholder="Optional, e.g. Am"
            value={value.chord_name || ""}
            onChange={(e) => change({ ...value, chord_name: e.target.value })}
          />
        </label>
      </div>
      <label>
        Practice focus
        <Input
          value={value.focus || ""}
          maxLength={200}
          placeholder="Song, chord changes, technique or another focus"
          onChange={(e) => change({ ...value, focus: e.target.value })}
        />
      </label>
      <label>
        Session notes
        <textarea
          value={value.notes || ""}
          maxLength={2000}
          onChange={(e) => change({ ...value, notes: e.target.value })}
        />
      </label>
    </fieldset>
  );
}
