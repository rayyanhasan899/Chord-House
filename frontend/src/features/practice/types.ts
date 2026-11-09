import type { components } from "@/lib/api/schema";
export type PracticeSession = components["schemas"]["SessionView"];
export type Details = Pick<
  components["schemas"]["SessionStart"],
  "instrument" | "focus" | "notes" | "song_id" | "chord_id" | "chord_name"
>;
export type Routine = components["schemas"]["RoutineView"];
export type RoutineDraft = Pick<
  components["schemas"]["RoutineCreate"],
  "name" | "description" | "instrument" | "activities"
>;
export type Activity = components["schemas"]["ActivityInput"];
export type Goal = components["schemas"]["GoalView"];
export type Sources = {
  songs: components["schemas"]["SongSummary"][];
  chords: components["schemas"]["ChordView"][];
  patterns: components["schemas"]["PatternView"][];
};
export type Instrument = Details["instrument"];
export const instruments: Instrument[] = [
  "acoustic_guitar",
  "electric_guitar",
  "bass",
  "ukulele",
];
export const instrumentLabel = (instrument: string) =>
  instrument.replaceAll("_", " ");
export const kind = (instrument: Instrument) =>
  instrument.endsWith("guitar")
    ? ("guitar" as const)
    : (instrument as "bass" | "ukulele");
