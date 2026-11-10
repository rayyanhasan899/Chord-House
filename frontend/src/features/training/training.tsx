"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Transitions } from "./transitions";
import { EarTraining } from "./ear";
import { NoteFinder } from "./finder";
import { PassagePractice } from "./passage";
import { SuggestedRoutine } from "./routines";
import { ReminderSettings } from "./reminders";
import { TrainingHistory } from "./history";
const tools = {
  transitions: "Transitions",
  challenge: "Chord challenge",
  ear: "Ear training",
  finder: "Note finder",
  passage: "Section practice",
  routines: "Routine suggestion",
  reminders: "Reminders",
};
export function Training({ initialSong = "" }: { initialSong?: string }) {
  const [tool, setTool] = useState<keyof typeof tools>(
    initialSong ? "passage" : "transitions",
  );
  const [revision, setRevision] = useState(0);
  return (
    <>
      <section className="panel">
        <p className="eyebrow">Listen. Change. Practice.</p>
        <h1>Your learning tools.</h1>
        <p>
          Use local guidance, then record your own assessment or start a
          separate Practice session. Only saved Practice sessions contribute to
          goals.
        </p>
        <nav aria-label="Learning tools">
          {Object.entries(tools).map(([key, label]) => (
            <Button
              key={key}
              variant="outline"
              aria-pressed={tool === key}
              onClick={() => setTool(key as keyof typeof tools)}
            >
              {label}
            </Button>
          ))}
        </nav>
        <p>
          <Link href="/practice">Practice sessions</Link>
          {" · "}
          <Link href="/progress">Progress and roadmap</Link>
          {" · "}
          <Link href="/songs">Song library</Link>
        </p>
      </section>
      {(tool === "transitions" || tool === "challenge") && (
        <Transitions
          key={tool}
          challenge={tool === "challenge"}
          onSaved={() => setRevision((n) => n + 1)}
        />
      )}
      {tool === "ear" && <EarTraining />}
      {tool === "finder" && <NoteFinder />}
      {tool === "passage" && <PassagePractice initialSong={initialSong} />}
      {tool === "routines" && <SuggestedRoutine />}
      {tool === "reminders" && <ReminderSettings />}
      <TrainingHistory key={revision} />
    </>
  );
}
