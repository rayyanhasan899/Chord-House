"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { EarAudio } from "./audio";
import { question, type Question, type EarMode, type Level } from "./domain";
export function EarTraining() {
  const [mode, setMode] = useState<EarMode>("interval");
  const [level, setLevel] = useState<Level>("beginner");
  const [current, setCurrent] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0),
    [correct, setCorrect] = useState(0);
  const audio = useRef<EarAudio | null>(null);
  useEffect(() => {
    const engine = new EarAudio();
    audio.current = engine;
    engine.onInterrupted = setMessage;
    const hide = () => {
      if (document.visibilityState === "hidden") engine.stop();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      engine.onInterrupted = undefined;
      engine.stop();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  function reset() {
    audio.current?.stop();
    setCurrent(null);
    setAnswer("");
    setMessage("");
    setError("");
  }
  async function play(notes: number[], sequential: boolean) {
    setError("");
    try {
      await audio.current?.play(notes, sequential);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Audio unavailable. Check browser audio support.",
      );
    }
  }
  function choose(value: string) {
    if (!current || answer) return;
    setAnswer(value);
    setAttempts((n) => n + 1);
    if (value === current.answer) setCorrect((n) => n + 1);
  }
  return (
    <section className="panel training-panel">
      <h2>Local ear training</h2>
      <p>
        Hear synthesized tones and choose an answer. Compare notes with the C4
        reference. These exercises teach listening; they do not assess
        microphone input or save practice minutes.
      </p>
      <div className="form-grid">
        <label>
          Ear exercise
          <select
            aria-label="Ear exercise"
            value={mode}
            onChange={(e) => {
              reset();
              setMode(e.target.value as EarMode);
            }}
          >
            <option value="note">Note name</option>
            <option value="interval">Interval</option>
            <option value="quality">Chord quality</option>
          </select>
        </label>
        <label>
          Ear difficulty
          <select
            aria-label="Ear difficulty"
            value={level}
            onChange={(e) => {
              reset();
              setLevel(e.target.value as Level);
            }}
          >
            {["beginner", "intermediate", "advanced"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>
      <Button
        onClick={() => {
          audio.current?.stop();
          setCurrent(question(mode, level));
          setAnswer("");
          setMessage("Question ready. Press Play question to listen.");
          setError("");
        }}
      >
        New ear question
      </Button>{" "}
      <Button variant="outline" onClick={() => void play([60], false)}>
        Play reference C4
      </Button>{" "}
      <Button variant="outline" onClick={() => audio.current?.stop()}>
        Stop ear audio
      </Button>
      <Feedback error message={error} />
      <Feedback message={message} />
      {current && (
        <>
          <Button onClick={() => void play(current.notes, current.sequential)}>
            Play question
          </Button>
          <fieldset disabled={!!answer}>
            <legend>Your answer</legend>
            <div className="training-answers">
              {current.options.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  onClick={() => choose(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </fieldset>
          {answer && (
            <div role="status">
              <p>
                {answer === current.answer
                  ? "Correct."
                  : `Your answer: ${answer}. Correct answer: ${current.answer}.`}
              </p>
              <p>{current.explanation}</p>
            </div>
          )}
        </>
      )}
      <p>
        {correct} correct out of {attempts} attempts on this page. Only your
        first answer to each question counts; a new question starts a fresh
        attempt.
      </p>
      <p className="hint">
        Audio starts only on a Play action and stops when you leave or hide this
        tool. Questions and answers stay in this browser session; no audio
        leaves your device.
      </p>
    </section>
  );
}
