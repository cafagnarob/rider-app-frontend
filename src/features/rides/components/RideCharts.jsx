import { useMemo, useState } from "react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceLine,
  AreaChart,
  Brush,
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

function StatBox({ label, value, unit }) {
  return (
    <div className="ride-chart-statbox">
      <span className="ride-chart-statbox__label">{label}</span>
      <span className="ride-chart-statbox__value">
        {value}
        {unit && <span className="ride-chart-statbox__unit">{unit}</span>}
      </span>
    </div>
  )
}

function CustomTraveler(props) {
  const { x, y, height, color } = props
  const cy = y + height / 2
  const cx = x + 5
  return (
    <circle
      cx={cx}
      cy={cy}
      r={7}
      fill={color}
      stroke="#0B0B0C"
      strokeWidth={2}
    />
  )
}

function findClosestByKm(chartData, targetKm) {
  let lo = 0
  let hi = chartData.length - 1

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (chartData[mid].km < targetKm) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }

  if (lo > 0) {
    const prevDiff = Math.abs(chartData[lo - 1].km - targetKm)
    const currDiff = Math.abs(chartData[lo].km - targetKm)
    if (prevDiff < currDiff) return chartData[lo - 1]
  }
  return chartData[lo]
}

function RideCharts({ points, onHoverPoint }) {
  const [speedRange, setSpeedRange] = useState(null)
  const [altitudeRange, setAltitudeRange] = useState(null)

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
        latitude: p.latitude,
        longitude: p.longitude,
      }
    })
  }, [points])

  const [activeChart, setActiveChart] = useState("speed")

  const speedStats = useMemo(() => {
    if (chartData.length === 0) return null
    const slice = speedRange
      ? chartData.slice(speedRange.startIndex, speedRange.endIndex + 1)
      : chartData
    const speeds = slice.map((d) => d.speed)
    const max = Math.max(...speeds)
    const avg = speeds.reduce((sum, s) => sum + s, 0) / speeds.length
    return { max: Math.round(max), avg: Math.round(avg) }
  }, [chartData, speedRange])

  const altitudeStats = useMemo(() => {
    const slice = altitudeRange
      ? chartData.slice(altitudeRange.startIndex, altitudeRange.endIndex + 1)
      : chartData
    const altitudes = slice.map((d) => d.altitude).filter((a) => a != null)
    if (altitudes.length === 0) return null
    const max = Math.max(...altitudes)
    const min = Math.min(...altitudes)
    return { max: Math.round(max), min: Math.round(min) }
  }, [chartData, altitudeRange])

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

  const formatKmAxis = (km) => km.toFixed(1)

  const handleChartMouseMove = (state) => {
    if (state?.activeLabel == null || chartData.length === 0) return
    const closest = findClosestByKm(chartData, state.activeLabel)
    onHoverPoint?.({ latitude: closest.latitude, longitude: closest.longitude })
  }

  const handleChartMouseLeave = () => {
    onHoverPoint?.(null)
  }

  return (
    <div>
      <div className="ride-chart-tabs">
        <button
          type="button"
          className={`ride-chart-tab ${activeChart === "speed" ? "ride-chart-tab--active" : ""}`}
          onClick={() => setActiveChart("speed")}
        >
          VELOCITÀ
        </button>
        {hasAltitude && altitudeStats && (
          <button
            type="button"
            className={`ride-chart-tab ${activeChart === "altitude" ? "ride-chart-tab--active" : ""}`}
            onClick={() => setActiveChart("altitude")}
          >
            ALTIMETRIA
          </button>
        )}
      </div>

      {activeChart === "speed" && (
        <div>
          <div className="ride-chart-header">
            {speedRange && (
              <span className="ride-chart-zoom-hint">TRATTO SELEZIONATO</span>
            )}
            <div className="ride-chart-statbox-row">
              <StatBox label="MEDIA" value={speedStats.avg} unit=" KM/H" />
              <StatBox label="MASSIMA" value={speedStats.max} unit=" KM/H" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 45 }}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
              <defs>
                <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={COLORS.accent}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor={COLORS.accent}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} />
              <XAxis
                dataKey="km"
                stroke={COLORS.textMuted}
                tick={axisStyle}
                tickFormatter={formatKmAxis}
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
              <ReferenceLine
                y={speedStats.avg}
                stroke={COLORS.accent}
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: `Media ${speedStats.avg}`,
                  position: "insideTopRight",
                  fill: COLORS.accent,
                  fontSize: 10,
                  fontFamily: FONTS.mono,
                }}
              />
              <Area
                type="monotone"
                dataKey="speed"
                stroke={COLORS.accent}
                strokeWidth={2}
                fill="url(#speedFill)"
                dot={false}
                isAnimationActive={false}
              />
              <Brush
                dataKey="km"
                height={12}
                y={225}
                stroke={COLORS.accent}
                fill="rgba(255,122,47,.08)"
                travellerWidth={10}
                alwaysShowText={false}
                onChange={(range) => {
                  const isFullRange =
                    range.startIndex === 0 &&
                    range.endIndex === chartData.length - 1
                  setSpeedRange(isFullRange ? null : range)
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeChart === "altitude" && hasAltitude && altitudeStats && (
        <div>
          <div className="ride-chart-header">
            {altitudeRange && (
              <span className="ride-chart-zoom-hint">TRATTO SELEZIONATO</span>
            )}
            <div className="ride-chart-statbox-row">
              <StatBox label="MIN" value={altitudeStats.min} unit=" M" />
              <StatBox label="MAX" value={altitudeStats.max} unit=" M" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 45 }}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
              <defs>
                <linearGradient id="altitudeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B9FFF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#5B9FFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} />
              <XAxis
                dataKey="km"
                stroke={COLORS.textMuted}
                tick={axisStyle}
                tickFormatter={formatKmAxis}
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
                domain={["dataMin - 20", "dataMax + 20"]}
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
              <Area
                type="monotone"
                dataKey="altitude"
                stroke="#5B9FFF"
                strokeWidth={2}
                fill="url(#altitudeFill)"
                dot={false}
                isAnimationActive={false}
              />
              <Brush
                dataKey="km"
                height={12}
                y={225}
                stroke="#5B9FFF"
                fill="rgba(91,159,255,.08)"
                travellerWidth={10}
                alwaysShowText={false}
                traveler={(props) => (
                  <CustomTraveler {...props} color="#5B9FFF" />
                )}
                onChange={(range) => {
                  const isFullRange =
                    range.startIndex === 0 &&
                    range.endIndex === chartData.length - 1
                  setAltitudeRange(isFullRange ? null : range)
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default RideCharts
