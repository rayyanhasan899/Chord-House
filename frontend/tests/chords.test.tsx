import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Diagram } from "../src/features/chords/diagram";
import {
  library,
  pitches,
  qualities,
  validate,
  names,
  search,
} from "../src/features/chords/music";
for (const chord of library)
  test(`valid complete chord ${chord.instrument} ${chord.name} ${chord.frets}`, () => {
    expect(validate(chord.instrument, chord.frets, chord.fingers)).toBeNull();
    const root = names.findIndex(
      (n) =>
        chord.name.startsWith(n) &&
        !names.some(
          (longer) => longer.length > n.length && chord.name.startsWith(longer),
        ),
    );
    expect(root).toBeGreaterThanOrEqual(0);
    expect(
      new Set(pitches(chord.instrument, chord.frets).map((p) => p % 12)),
    ).toEqual(new Set(qualities[chord.quality].map((i) => (root + i) % 12)));
  });
test("search, aliases, alternatives and muted/open diagram", () => {
  for (const q of ["C", "Am", "G", "D", "F"])
    expect(search(q, "guitar", "").length).toBeGreaterThan(0);
  expect(search("Db", "guitar", "").length).toBeGreaterThan(0);
  expect(
    search("C", "guitar", "").filter((c) => c.name === "C").length,
  ).toBeGreaterThan(1);
  render(
    <Diagram
      name="C"
      instrument="guitar"
      frets={[-1, 3, 2, 0, 1, 0]}
      fingers={[0, 3, 2, 0, 1, 0]}
    />,
  );
  expect(
    screen.getByRole("img", { name: /C guitar chord diagram/ }),
  ).toBeVisible();
  expect(screen.getByText("X")).toBeInTheDocument();
});
test("reject impossible stretches and inconsistent barre", () => {
  expect(
    validate("guitar", [1, 9, 2, 2, 1, 1], [1, 4, 2, 2, 1, 1]),
  ).not.toBeNull();
  expect(validate("ukulele", [1, 0, 1, 1], [1, 0, 1, 1])).not.toBeNull();
});
