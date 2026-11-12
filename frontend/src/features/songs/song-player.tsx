"use client";

import { useEffect, useId, useRef, useState } from "react";

export function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  return `${Math.floor(value / 60)}:${Math.floor(value % 60)
    .toString()
    .padStart(2, "0")}`;
}

type PlayerProps = { src: string; title: string; artist: string };

export function SongPlayer(props: PlayerProps) {
  return <Player key={props.src} {...props} />;
}

function Player({
  src,
  title,
  artist,
}: {
  src: string;
  title: string;
  artist: string;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const seekId = useId();
  const attempt = useRef(0);
  useEffect(() => {
    const element = audio.current;
    const generation = attempt;
    if (element && element.getAttribute("src") !== src)
      element.setAttribute("src", src);
    return () => {
      generation.current++;
      if (element) {
        element.pause();
        element.removeAttribute("src");
        element.load();
      }
    };
  }, [src]);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loop, setLoop] = useState(false);
  const [ready, setReady] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    const element = audio.current;
    if (!element) return;
    if (!element.paused) {
      element.pause();
      return;
    }
    if (pending) return;
    if (error) element.load();
    setPending(true);
    setWaiting(true);
    setError("");
    const turn = ++attempt.current;
    try {
      await element.play();
      if (turn !== attempt.current) element.pause();
    } catch {
      if (turn !== attempt.current) return;
      setError("Playback could not start. Try again or refresh the song.");
    } finally {
      if (turn === attempt.current) {
        setPending(false);
        setWaiting(false);
      }
    }
  }
  function seek(value: number) {
    if (!audio.current || !ready) return;
    const time = Math.min(duration, Math.max(0, value));
    audio.current.currentTime = time;
    setPosition(time);
  }
  return (
    <section className="song-player" aria-label={`Player for ${title}`}>
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        loop={loop}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : 0);
          setReady(Number.isFinite(d) && d > 0);
        }}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          setWaiting(false);
        }}
        onEnded={() => {
          setPlaying(false);
          setWaiting(false);
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onError={() => {
          setPlaying(false);
          setWaiting(false);
          setReady(false);
          setError(
            "This recording could not be loaded. Check the MP3 file or refresh to retry.",
          );
        }}
      />
      <div className="song-player-heading">
        <div
          className={`song-record ${playing ? "is-playing" : ""}`}
          aria-hidden="true"
        >
          <span>♪</span>
        </div>
        <div>
          <p className="eyebrow">YOUR LISTENING ROOM</p>
          <h2>{title}</h2>
          <p>
            {artist === "Artist not specified"
              ? "Your song collection"
              : artist}
          </p>
        </div>
        <span className="player-status" role="status">
          {waiting
            ? "Buffering…"
            : playing
              ? "Now playing"
              : "Ready when you are"}
        </span>
      </div>
      <div className="song-player-transport">
        <button
          type="button"
          className="player-skip"
          aria-label="Rewind 10 seconds"
          disabled={!ready}
          onClick={() => seek(position - 10)}
        >
          ↶<span>10</span>
        </button>
        <button
          type="button"
          className="player-play"
          disabled={pending}
          aria-busy={pending}
          aria-label={playing ? "Pause song" : "Play song"}
          onClick={() => void toggle()}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 4v16l13-8z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="player-skip"
          aria-label="Forward 10 seconds"
          disabled={!ready}
          onClick={() => seek(position + 10)}
        >
          ↷<span>10</span>
        </button>
        <div className="player-timeline">
          <label className="sr-only" htmlFor={seekId}>
            Seek in song
          </label>
          <input
            id={seekId}
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(position, duration || 1)}
            disabled={!ready}
            aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`}
            onChange={(e) => seek(Number(e.target.value))}
          />
          <div className="player-times">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      <div className="player-options">
        <button
          type="button"
          className="player-repeat"
          aria-pressed={loop}
          onClick={() => setLoop(!loop)}
        >
          <span aria-hidden="true">↻</span> Repeat {loop ? "on" : "off"}
        </button>
        <label className="player-volume">
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => {
              const value = Number(e.target.value);
              setVolume(value);
              if (audio.current) audio.current.volume = value;
            }}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="player-error">
          {error}
        </p>
      )}
    </section>
  );
}
