'use client'

export interface Point {
  t: number
  v: number
}

/**
 * Small SVG line chart. Hand-rolled rather than pulling a charting library —
 * the whole need here is "plot a series with an optional target band", and this
 * is less code than configuring one, with no client bundle cost.
 */
export function LineChart({
  points,
  targetMin,
  targetMax,
  unit,
  height = 180,
}: {
  points: Point[]
  targetMin?: number | null
  targetMax?: number | null
  unit?: string | null
  height?: number
}) {
  if (points.length < 2) {
    return <p className="hint">Not enough readings yet to draw a trend.</p>
  }

  const width = 720
  const padL = 44
  const padR = 12
  const padT = 12
  const padB = 26

  const sorted = [...points].sort((a, b) => a.t - b.t)
  const xs = sorted.map((p) => p.t)
  const ys = sorted.map((p) => p.v)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  // Include the target band in the y-range so it is always visible.
  const candidates = [...ys, targetMin, targetMax].filter(
    (n): n is number => typeof n === 'number',
  )
  const rawMin = Math.min(...candidates)
  const rawMax = Math.max(...candidates)
  const pad = (rawMax - rawMin) * 0.1 || 1
  const minY = rawMin - pad
  const maxY = rawMax + pad

  const x = (t: number) =>
    padL + ((t - minX) / (maxX - minX || 1)) * (width - padL - padR)
  const y = (v: number) =>
    padT + (1 - (v - minY) / (maxY - minY || 1)) * (height - padT - padB)

  const path = sorted.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v)}`).join(' ')

  const bandTop = typeof targetMax === 'number' ? y(targetMax) : null
  const bandBottom = typeof targetMin === 'number' ? y(targetMin) : null

  const ticks = [minY, (minY + maxY) / 2, maxY]
  const fmtDate = (t: number) =>
    new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img">
        {bandTop !== null && bandBottom !== null && (
          <rect
            x={padL}
            y={bandTop}
            width={width - padL - padR}
            height={Math.max(0, bandBottom - bandTop)}
            className="chart-band"
          />
        )}

        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={padL - 8} y={y(t) + 4} className="chart-label" textAnchor="end">
              {t.toFixed(t > 20 ? 0 : 1)}
            </text>
          </g>
        ))}

        <path d={path} className="chart-line" fill="none" />

        {sorted.length <= 60 &&
          sorted.map((p) => (
            <circle key={p.t} cx={x(p.t)} cy={y(p.v)} r={2.5} className="chart-dot" />
          ))}

        <text x={padL} y={height - 6} className="chart-label">
          {fmtDate(minX)}
        </text>
        <text x={width - padR} y={height - 6} className="chart-label" textAnchor="end">
          {fmtDate(maxX)}
        </text>
      </svg>
      {unit && <p className="hint">Values in {unit}</p>}
    </div>
  )
}
