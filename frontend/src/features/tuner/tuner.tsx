"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { presets, frequency, cents, note } from "./pitch";
export function Tuner() {
  const [preset, setPreset] = useState<keyof typeof presets>("Guitar standard");
  const [target, setTarget] = useState(0);
  const [instrument, setInstrument] = useState("Acoustic guitar");
  const [running, setRunning] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(
    "Choose your instrument, then start the microphone.",
  );
  const [reading, setReading] = useState<{
    hz: number | null;
    rms: number;
    confidence: number;
  }>({ hz: null, rms: 0, confidence: 0 });
  const resources = useRef<{
    stream?: MediaStream;
    context?: AudioContext;
    worker?: Worker;
    timer?: ReturnType<typeof setInterval>;
  }>({});
  const version = useRef(0);
  function stop() {
    version.current++;
    const r = resources.current;
    if (r.timer) clearInterval(r.timer);
    r.worker?.terminate();
    r.stream?.getTracks().forEach((t) => t.stop());
    if (r.context) void r.context.close();
    resources.current = {};
    setRunning(false);
    setPending(false);
    setReading({ hz: null, rms: 0, confidence: 0 });
  }
  useEffect(
    () => () => {
      version.current++;
      const r = resources.current;
      if (r.timer) clearInterval(r.timer);
      r.worker?.terminate();
      r.stream?.getTracks().forEach((t) => t.stop());
      if (r.context) void r.context.close();
    },
    [],
  );
  async function start() {
    stop();
    const current = version.current;
    setPending(true);
    setMessage("Requesting microphone permission…");
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext)
        throw new Error(
          "This browser does not support microphone tuning. Try a current browser on HTTPS or localhost.",
        );
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      if (current !== version.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      resources.current.stream = stream;
      const context = new AudioContext();
      resources.current.context = context;
      await context.resume();
      if (current !== version.current) return;
      const analyser = context.createAnalyser();
      analyser.fftSize = 8192;
      context.createMediaStreamSource(stream).connect(analyser);
      const worker = new Worker(new URL("./worker.ts", import.meta.url));
      resources.current.worker = worker;
      let waiting = false;
      let smooth: number | null = null;
      worker.onmessage = (
        event: MessageEvent<{
          hz: number | null;
          rms: number;
          confidence: number;
        }>,
      ) => {
        if (current !== version.current) return;
        waiting = false;
        const data = event.data;
        if (data.hz) {
          smooth =
            smooth && Math.abs(cents(data.hz, smooth)) < 100
              ? smooth * 0.6 + data.hz * 0.4
              : data.hz;
        } else smooth = null;
        setReading({ ...data, hz: smooth });
      };
      worker.onerror = () => {
        stop();
        setMessage(
          "Audio analysis failed. Stop and start again, or try another browser.",
        );
      };
      resources.current.timer = setInterval(() => {
        if (waiting) return;
        const input = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(input);
        waiting = true;
        worker.postMessage({ input, rate: context.sampleRate }, [input.buffer]);
      }, 100);
      stream.getAudioTracks()[0].onended = () => {
        stop();
        setMessage("Microphone disconnected. Reconnect and start again.");
      };
      setRunning(true);
      setPending(false);
      setMessage(
        "Listening locally. Pluck one string at a time in a quiet room.",
      );
    } catch (e) {
      if (current !== version.current) return;
      stop();
      setMessage(
        e instanceof DOMException
          ? e.name === "NotAllowedError"
            ? "Microphone permission denied. Enable permission in your browser and try again."
            : "Microphone unavailable. Check your input device and try again."
          : e instanceof Error
            ? e.message
            : "Unable to start audio.",
      );
    }
  }
  const pitches = presets[preset];
  const selected = pitches[Math.min(target, pitches.length - 1)];
  const deviation = reading.hz ? cents(reading.hz, frequency(selected)) : null;
  const status =
    deviation === null
      ? "No reliable pitch"
      : Math.abs(deviation) <= 5
        ? "In tune"
        : deviation < 0
          ? "Flat - tighten gently"
          : "Sharp - loosen gently";
  return (
    <section className="panel narrow">
      <p className="eyebrow">Guest instrument tuner</p>
      <h1>Find your note.</h1>
      <p>
        Microphone audio stays in your browser. Nothing is recorded or uploaded.
        Allow microphone access only when you press Start.
      </p>
      <label>
        Instrument
        <select
          value={instrument}
          onChange={(e) => {
            stop();
            setInstrument(e.target.value);
            setPreset(
              e.target.value === "Bass guitar"
                ? "Bass standard"
                : e.target.value === "Ukulele"
                  ? "Ukulele re-entrant"
                  : "Guitar standard",
            );
            setTarget(0);
          }}
        >
          <option>Acoustic guitar</option>
          <option>Electric guitar</option>
          <option>Bass guitar</option>
          <option>Ukulele</option>
        </select>
      </label>
      <label>
        Tuning
        <select
          value={preset}
          onChange={(e) => {
            setPreset(e.target.value as keyof typeof presets);
            setTarget(0);
          }}
        >
          {Object.keys(presets)
            .filter((key) =>
              instrument === "Bass guitar"
                ? key.startsWith("Bass")
                : instrument === "Ukulele"
                  ? key.startsWith("Ukulele")
                  : key.startsWith("Guitar"),
            )
            .map((key) => (
              <option key={key}>{key}</option>
            ))}
        </select>
      </label>
      <fieldset>
        <legend>Target string (instrument order)</legend>
        {pitches.map((midi, index) => (
          <label key={index} className="checkbox">
            <input
              type="radio"
              name="string"
              checked={target === index}
              onChange={() => setTarget(index)}
            />
            {index + 1}: {note(midi)} · {frequency(midi).toFixed(2)} Hz
          </label>
        ))}
      </fieldset>
      <div style={{ marginBlock: "2rem", textAlign: "center" }}>
        <p>
          Target {note(selected)} · Detected{" "}
          {reading.hz
            ? note(Math.round(69 + 12 * Math.log2(reading.hz / 440)))
            : "—"}
        </p>
        <div
          role="meter"
          aria-label="Tuning deviation in cents"
          aria-valuemin={-50}
          aria-valuemax={50}
          aria-valuenow={
            deviation === null
              ? 0
              : Math.round(Math.max(-50, Math.min(50, deviation)))
          }
          aria-valuetext={
            deviation === null
              ? "No reliable pitch"
              : `${deviation.toFixed(1)} cents`
          }
          style={{
            position: "relative",
            height: 36,
            borderBottom: "2px solid var(--line)",
          }}
        >
          <span style={{ position: "absolute", left: "50%" }}>│</span>
          <span
            style={{
              position: "absolute",
              left: `${50 + (deviation === null ? 0 : Math.max(-50, Math.min(50, deviation)))}%`,
            }}
          >
            ▼
          </span>
        </div>
        <h2>{status}</h2>
        <p>
          {reading.hz
            ? `${reading.hz.toFixed(2)} Hz · ${deviation?.toFixed(1)} cents`
            : "Pluck the selected string"}
        </p>
        <label>
          Input level
          <meter min={0} max={1} value={Math.min(1, reading.rms * 4)} />
        </label>
        <p>
          {reading.rms > 0.8
            ? "Input may be clipping. Move away from the microphone."
            : reading.rms < 0.003 && running
              ? "Input is very quiet. Move closer or check the microphone."
              : ""}
        </p>
      </div>
      <p role="status">{message}</p>
      <Button disabled={pending || running} onClick={() => void start()}>
        {pending ? "Starting…" : "Start microphone"}
      </Button>{" "}
      <Button
        variant="outline"
        disabled={!running && !pending}
        onClick={() => {
          stop();
          setMessage("Microphone stopped and released.");
        }}
      >
        Stop
      </Button>
      <p className="hint">
        Bass E1 is 41.20 Hz; some microphones filter low frequencies. Ukulele
        uses re-entrant G4 C4 E4 A4, not ascending pitch order. The ±5-cent
        indicator is an engineering target; real-device calibration is pending.
      </p>
    </section>
  );
}
