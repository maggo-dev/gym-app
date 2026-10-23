import { motion } from 'framer-motion'

export interface ChartPoint {
  label: string
  value: number
}

interface MiniLineChartProps {
  data: ChartPoint[]
  unit?: string
  color?: string
}

/**
 * Gráfico de linha/área leve em SVG puro + Framer Motion (zero dependências extras no bundle).
 */
export function MiniLineChart({
  data,
  unit = '',
  color = 'var(--color-primary)',
}: MiniLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl bg-elevated text-xs text-muted">
        Sem dados suficientes ainda
      </div>
    )
  }

  const width = 320
  const height = 110
  const padX = 24
  const padTop = 22
  const padBottom = 22
  const innerW = width - padX * 2
  const innerH = height - padTop - padBottom

  const values = data.map((d) => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const span = maxVal === minVal ? 1 : maxVal - minVal

  const coords = data.map((d, i) => {
    const x =
      data.length === 1 ? width / 2 : padX + (i / (data.length - 1)) * innerW
    const norm = maxVal === minVal ? 0.5 : (d.value - minVal) / span
    const y = padTop + (1 - norm) * innerH
    return { x, y, ...d }
  })

  const polyline = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const areaPath =
    coords.length > 1
      ? `M ${coords[0].x},${padTop + innerH} L ${coords.map((c) => `${c.x},${c.y}`).join(' L ')} L ${coords[coords.length - 1].x},${padTop + innerH} Z`
      : ''

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-elevated p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full overflow-visible">
        {areaPath && (
          <path d={areaPath} fill={color} fillOpacity={0.12} />
        )}
        {coords.length > 1 && (
          <motion.polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyline}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
        {coords.map((c, i) => {
          const showValue =
            i === 0 || i === coords.length - 1 || coords.length <= 5
          return (
            <g key={`${c.label}-${i}`}>
              <circle cx={c.x} cy={c.y} r={4} fill={color} />
              {showValue && (
                <text
                  x={c.x}
                  y={c.y - 7}
                  textAnchor="middle"
                  className="num fill-fg text-[9px] font-bold"
                >
                  {c.value}
                  {unit}
                </text>
              )}
              <text
                x={c.x}
                y={height - 5}
                textAnchor="middle"
                className="fill-muted text-[9px]"
              >
                {c.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
