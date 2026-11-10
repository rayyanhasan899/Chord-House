"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const emptyGrant = () => ({
  origin: "application",
  license: "",
  source_url: "",
  attribution: "",
  evidence: "",
  terms_version: "",
  reviewer: "",
  reviewed: false,
  display: false,
  cache: false,
  transpose: false,
  territories: ["*"],
  expires_at: null,
});
const arrangement = () => ({
  key: "",
  name: "",
  instrument: "guitar",
  tuning: "standard",
  difficulty: "beginner",
  capo: null,
  key_note: null,
  chords: ["C"],
  placements: [],
  text_key: null,
  pattern_id: null,
  guidance: "",
  grant: emptyGrant(),
});
const text = () => ({
  key: "",
  language: "en",
  script: "Latn",
  label: "",
  lines: [""],
  grant: emptyGrant(),
});
export function template(kind: string): Record<string, unknown> {
  if (kind === "instrument")
    return { name: "", string_count: 6, grant: emptyGrant() };
  if (kind === "tuning")
    return {
      name: "",
      instrument: "acoustic_guitar",
      pitches: [40, 45, 50, 55, 59, 64],
      grant: emptyGrant(),
    };
  if (kind === "chord")
    return {
      name: "",
      instrument: "guitar",
      quality: "major",
      difficulty: "beginner",
      frets: [-1, 3, 2, 0, 1, 0],
      fingers: [0, 3, 2, 0, 1, 0],
      guidance: "",
      grant: emptyGrant(),
    };
  if (kind === "pattern")
    return {
      name: "",
      meter: "4/4",
      subdivision: 1,
      strokes: ["D", "D", "D", "D"],
      tempo_min: 60,
      tempo_max: 140,
      difficulty: "beginner",
      style: "General",
      description: "",
      reviewed: false,
      rights_statement: "",
      attribution: "",
      grant: emptyGrant(),
    };
  return {
    external_key: crypto.randomUUID(),
    title: "",
    artist: "",
    language: "en",
    aliases: [],
    genre: null,
    version_note: "",
    metadata_grant: emptyGrant(),
    arrangements: [],
    texts: [],
    lyrics_url: null,
    lyrics_link_verified: false,
  };
}
const choices: Record<string, string[]> = {
  origin: ["application", "user_submission", "third_party"],
  language: ["en", "ur", "hi"],
  script: ["Latn", "Arab", "Deva"],
  difficulty: ["beginner", "intermediate", "advanced"],
  quality: ["major", "minor", "7", "maj7", "m7", "sus2", "sus4"],
  meter: ["2/4", "3/4", "4/4", "6/8"],
  tuning: ["standard", "drop_d", "dadgad", "reentrant"],
};
const labels: Record<string, string> = {
  grant: "Provenance and rights",
  metadata_grant: "Metadata provenance and rights",
  key: "Component code",
  source_url: "Source URL (HTTPS)",
  evidence: "Permission evidence",
  reviewed: "Rights reviewed",
  display: "Display permitted",
  cache: "Caching permitted",
  transpose: "Transposition permitted",
  expires_at: "Rights expiry (ISO date and timezone; blank for none)",
  external_key: "Stable source identifier",
  lyrics_link_verified: "Lyrics link rights verified",
  pitches: "String pitches (MIDI, in instrument order)",
  rights_statement: "Rights statement",
  territories: "Permitted territories (* means worldwide)",
  texts: "Approved text variants",
  placements: "Chord placements (zero-based line and character)",
  strings: "Strings",
};
const label = (key: string) =>
  labels[key] || key.replaceAll("_", " ").replace(/^./, (s) => s.toUpperCase());
function newItem(key: string): unknown {
  if (key === "arrangements") return arrangement();
  if (key === "texts") return text();
  if (key === "placements") return { line: 0, offset: 0, chord: "C" };
  if (["pitches", "frets", "fingers"].includes(key)) return 0;
  return "";
}
export function Fields({
  value,
  onChange,
  path = "Content",
}: {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  path?: string;
}) {
  return (
    <div className="content-fields">
      {Object.entries(value)
        .filter(([key]) => key !== "status")
        .map(([key, item]) => {
          const update = (next: unknown) => onChange({ ...value, [key]: next });
          const name = `${path} · ${label(key)}`;
          if (Array.isArray(item))
            return (
              <fieldset key={key}>
                <legend>{label(key)}</legend>
                {item.length === 0 && <p className="hint">None added.</p>}
                {item.map((entry, index) => (
                  <div className="content-array-item" key={index}>
                    {entry !== null && typeof entry === "object" ? (
                      <Fields
                        value={entry}
                        path={`${name} ${index + 1}`}
                        onChange={(next) =>
                          update(
                            item.map((old, i) => (i === index ? next : old)),
                          )
                        }
                      />
                    ) : (
                      <label>
                        {label(key)} {index + 1}
                        <Input
                          aria-label={`${name} ${index + 1}`}
                          type={typeof entry === "number" ? "number" : "text"}
                          value={String(entry)}
                          onChange={(e) =>
                            update(
                              item.map((old, i) =>
                                i === index
                                  ? typeof entry === "number"
                                    ? Number(e.target.value)
                                    : e.target.value
                                  : old,
                              ),
                            )
                          }
                        />
                      </label>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => update(item.filter((_, i) => i !== index))}
                    >
                      Remove {label(key)} {index + 1}
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => update([...item, newItem(key)])}
                >
                  Add {label(key)}
                </Button>
              </fieldset>
            );
          if (item !== null && typeof item === "object")
            return (
              <details key={key} open={key.includes("grant")}>
                <summary>{label(key)}</summary>
                <Fields
                  value={item as Record<string, unknown>}
                  path={name}
                  onChange={update}
                />
              </details>
            );
          if (typeof item === "boolean")
            return (
              <label className="checkbox" key={key}>
                <input
                  aria-label={name}
                  type="checkbox"
                  checked={item}
                  onChange={(e) => update(e.target.checked)}
                />
                {label(key)}
              </label>
            );
          if (choices[key])
            return (
              <label key={key}>
                {label(key)}
                <select
                  aria-label={name}
                  value={String(item || "")}
                  onChange={(e) => update(e.target.value)}
                >
                  {choices[key].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            );
          const nullable = [
            "expires_at",
            "capo",
            "key_note",
            "text_key",
            "pattern_id",
            "genre",
            "lyrics_url",
          ].includes(key);
          return (
            <label key={key}>
              {label(key)}
              {[
                "evidence",
                "guidance",
                "description",
                "rights_statement",
                "version_note",
              ].includes(key) ? (
                <textarea
                  aria-label={name}
                  value={String(item ?? "")}
                  maxLength={2000}
                  onChange={(e) => update(e.target.value)}
                />
              ) : (
                <Input
                  aria-label={name}
                  type={
                    typeof item === "number" || key === "capo"
                      ? "number"
                      : "text"
                  }
                  value={String(item ?? "")}
                  onChange={(e) =>
                    update(
                      nullable && !e.target.value
                        ? null
                        : typeof item === "number" || key === "capo"
                          ? Number(e.target.value)
                          : e.target.value,
                    )
                  }
                />
              )}
            </label>
          );
        })}
    </div>
  );
}
