import { tuning, noteName, type Instrument } from "./music";
export function Diagram({
  instrument,
  frets,
  fingers,
  name,
}: {
  instrument: Instrument;
  frets: number[];
  fingers: number[];
  name: string;
}) {
  const n = frets.length;
  const positive = frets.filter((f) => f > 0);
  const start = positive.length ? Math.max(1, Math.min(...positive)) : 1;
  const x = (i: number) => 50 + i * 40;
  return (
    <svg
      role="img"
      aria-label={`${name} ${instrument} chord diagram`}
      viewBox={`0 0 ${100 + (n - 1) * 40} 300`}
      style={{
        width: "100%",
        maxWidth: 340,
        display: "block",
        marginInline: "auto",
      }}
    >
      <title>{`${name}: string frets ${frets.map((f) => (f < 0 ? "muted" : f === 0 ? "open" : f)).join(", ")}`}</title>
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <line
            x1={50}
            x2={x(n - 1)}
            y1={65 + i * 36}
            y2={65 + i * 36}
            stroke="currentColor"
            strokeWidth={i === 0 && start === 1 ? 5 : 1}
          />
          {i < 5 && (
            <text x={12} y={88 + i * 36} fill="currentColor" fontSize={12}>
              {start + i}
            </text>
          )}
        </g>
      ))}
      {frets.map((f, i) => (
        <g key={i}>
          <line x1={x(i)} x2={x(i)} y1={65} y2={245} stroke="currentColor" />
          <text x={x(i)} y={40} textAnchor="middle" fill="currentColor">
            {f < 0 ? "X" : f === 0 ? "O" : ""}
          </text>
          {f > 0 && (
            <>
              <circle
                cx={x(i)}
                cy={65 + (f - start + 0.5) * 36}
                r={13}
                fill="var(--accent)"
              />
              <text
                x={x(i)}
                y={70 + (f - start + 0.5) * 36}
                textAnchor="middle"
                fontSize={14}
                fill="var(--accent-ink)"
              >
                {fingers[i]}
              </text>
            </>
          )}
          <text
            x={x(i)}
            y={275}
            textAnchor="middle"
            fill="currentColor"
            fontSize={11}
          >
            {noteName(tuning[instrument][i])}
          </text>
        </g>
      ))}
    </svg>
  );
}
