'use client'

export interface Point {
  t: number
  v: number
}

export interface ChartSeries {
  id: string
  label: string
  points: Point[]
  tone?: 'primary' | 'secondary'
}

/**
 * Small SVG line chart. Hand-rolled rather than pulling a charting library —
 * the whole need here is "plot a series with an optional target band", and this
 * is less code than configuring one, with no client bundle cost.
 */
export function LineChart({
  points,
  series,
  targetMin,
  targetMax,
  unit,
  height = 180,
}: {
  points?: Point[]
  series?: ChartSeries[]
  targetMin?: number | null
  targetMax?: number | null
  unit?: string | null
  height?: number
}) {
  const lines: ChartSeries[] =
    series ??
    (points ? [{ id: 'main', label: '', points, tone: 'primary' }] : [])

  const hasTrend = lines.some((s) => s.points.length >= 2)
  if (!hasTrend) {
    return <p className="hint">Not enough readings yet to draw a trend.</p>
  }

  const width = 720
  const padL = 44
  const padR = 12
  const padT = 12
  const padB = 26

  const allPoints = lines.flatMap((s) => s.points)
  const xs = allPoints.map((p) => p.t)
  const ys = allPoints.map((p) => p.v)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
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

  const bandTop = typeof targetMax === 'number' ? y(targetMax) : null
  const bandBottom = typeof targetMin === 'number' ? y(targetMin) : null

  const ticks = [minY, (minY + maxY) / 2, maxY]
  const fmtDate = (t: number) =>
    new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  const showLegend = lines.length > 1 && lines.some((s) => s.label)

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

        {lines.map((s) => {
          if (s.points.length < 2) return null
          const sorted = [...s.points].sort((a, b) => a.t - b.t)
          const path = sorted
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v)}`)
            .join(' ')
          const lineClass =
            s.tone === 'secondary' ? 'chart-line chart-line-secondary' : 'chart-line'
          const dotClass =
            s.tone === 'secondary' ? 'chart-dot chart-dot-secondary' : 'chart-dot'
          return (
            <g key={s.id}>
              <path d={path} className={lineClass} fill="none" />
              {sorted.length <= 60 &&
                sorted.map((p) => (
                  <circle
                    key={`${s.id}-${p.t}`}
                    cx={x(p.t)}
                    cy={y(p.v)}
                    r={2.5}
                    className={dotClass}
                  />
                ))}
            </g>
          )
        })}

        <text x={padL} y={height - 6} className="chart-label">
          {fmtDate(minX)}
        </text>
        <text x={width - padR} y={height - 6} className="chart-label" textAnchor="end">
          {fmtDate(maxX)}
        </text>
      </svg>
      {showLegend && (
        <div className="chart-legend" aria-hidden="true">
          {lines.map((s) => (
            <span key={s.id} className="chart-legend-item">
              <span
                className={
                  s.tone === 'secondary' ? 'chart-legend-swatch secondary' : 'chart-legend-swatch'
                }
              />
              {s.label}
            </span>
          ))}
        </div>
      )}
      {unit && <p className="hint">Values in {unit}</p>}
    </div>
  )
}
