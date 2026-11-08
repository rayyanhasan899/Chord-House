export type Rhythm = {
  meter: string;
  subdivision: number;
  strokes: string[];
  tempo_min: number;
  tempo_max: number;
};
export function validateRhythm(r: Rhythm): string {
  if (
    !["2/4", "3/4", "4/4", "6/8"].includes(r.meter) ||
    ![1, 2, 4].includes(r.subdivision)
  )
    return "Choose a supported meter and subdivision.";
  if (r.strokes.length !== Number(r.meter[0]) * r.subdivision)
    return "Steps must fill exactly one measure.";
  if (
    r.strokes.some((s) => !["D", "U", "R", "X"].includes(s)) ||
    r.strokes.every((s) => s === "R")
  )
    return "Use D, U, R or X with at least one sounding stroke.";
  if (
    !Number.isInteger(r.tempo_min) ||
    !Number.isInteger(r.tempo_max) ||
    r.tempo_min < 30 ||
    r.tempo_max > 300 ||
    r.tempo_min > r.tempo_max
  )
    return "Tempo range must be ordered within 30–300 BPM.";
  return "";
}
export function countLabel(index: number, subdivision: number) {
  return `${Math.floor(index / subdivision) + 1}${subdivision === 4 ? ["", " e", " &", " a"][index % 4] : subdivision === 2 && index % 2 ? " &" : ""}`;
}
export const symbols: Record<string, string> = {
  D: "↓ Down",
  U: "↑ Up",
  R: "— Rest",
  X: "× Mute",
};
