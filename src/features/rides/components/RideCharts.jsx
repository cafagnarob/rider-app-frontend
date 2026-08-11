import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { haversineDistance } from "../../../utils/geo"

// valori letti da theme.js: qui servono come dati JS per Recharts, non come CSS applicabile al DOM
const COLORS = {
  accent: "#FF7A2F",
  borderSoft: "rgba(255,255,255,.08)",
  borderStrong: "rgba(255,255,255,.14)",
  text: "#F4F2F0",
  textMuted: "rgba(255,255,255,.42)",
  card: "#13141A",
}
const FONTS = {
  body: "Archivo, system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

function RideCharts({ points }) {
  const chartData = useMemo(() => {
    if (!points || points.length < 2) return []

    let cumulativeKm = 0
    return points.map((p, index) => {
      if (index > 0) {
        cumulativeKm += haversineDistance(points[index - 1], p)
      }
      return {
        km: Number(cumulativeKm.toFixed(2)),
        speed: p.speedKmh != null ? Number(p.speedKmh.toFixed(1)) : 0,
        altitude: p.altitude != null ? Math.round(p.altitude) : null,
      }
    })
  }, [points])

  if (chartData.length === 0) {
    return (
      <p className="picker-empty-text">
        Dati insufficienti per generare i grafici.
      </p>
    )
  }

  const hasAltitude = chartData.some((d) => d.altitude != null)

  const axisStyle = {
    fontSize: 10,
    fontFamily: FONTS.mono,
    fill: COLORS.textMuted,
  }
  const tooltipStyle = {
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10,
    fontFamily: FONTS.body,
    fontSize: 12,
  }

  return (
    <div className="chart-sections">
      <div>
        <p className="chart-section-title">VELOCITÀ LUNGO IL PERCORSO</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} />
            <XAxis
              dataKey="km"
              stroke={COLORS.textMuted}
              tick={axisStyle}
              label={{
                value: "km",
                position: "insideBottomRight",
                offset: -5,
                fill: COLORS.textMuted,
                fontSize: 10,
              }}
            />
            <YAxis
              stroke={COLORS.textMuted}
              tick={axisStyle}
              label={{
                value: "km/h",
                angle: -90,
                position: "insideLeft",
                fill: COLORS.textMuted,
                fontSize: 10,
              }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: COLORS.text }}
              itemStyle={{ color: COLORS.accent }}
              formatter={(value) => [`${value} km/h`, "Velocità"]}
              labelFormatter={(km) => `${km} km`}
            />
            <Line
              type="monotone"
              dataKey="speed"
              stroke={COLORS.accent}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {hasAltitude && (
        <div>
          <p className="chart-section-title">ALTIMETRIA</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} />
              <XAxis
                dataKey="km"
                stroke={COLORS.textMuted}
                tick={axisStyle}
                label={{
                  value: "km",
                  position: "insideBottomRight",
                  offset: -5,
                  fill: COLORS.textMuted,
                  fontSize: 10,
                }}
              />
              <YAxis
                stroke={COLORS.textMuted}
                tick={axisStyle}
                label={{
                  value: "m",
                  angle: -90,
                  position: "insideLeft",
                  fill: COLORS.textMuted,
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: COLORS.text }}
                itemStyle={{ color: "#5B9FFF" }}
                formatter={(value) => [`${value} m`, "Altitudine"]}
                labelFormatter={(km) => `${km} km`}
              />
              <Line
                type="monotone"
                dataKey="altitude"
                stroke="#5B9FFF"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default RideCharts
