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
      <p className="text-secondary small">
        Dati insufficienti per generare i grafici.
      </p>
    )
  }

  const hasAltitude = chartData.some((d) => d.altitude != null)

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <p className="text-secondary small mb-2">Velocità lungo il percorso</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#495057" />
            <XAxis
              dataKey="km"
              stroke="#adb5bd"
              tick={{ fontSize: 11 }}
              label={{
                value: "km",
                position: "insideBottomRight",
                offset: -5,
                fill: "#adb5bd",
                fontSize: 11,
              }}
            />
            <YAxis
              stroke="#adb5bd"
              tick={{ fontSize: 11 }}
              label={{
                value: "km/h",
                angle: -90,
                position: "insideLeft",
                fill: "#adb5bd",
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#212529",
                border: "1px solid #495057",
              }}
              labelStyle={{ color: "#fff" }}
              formatter={(value) => [`${value} km/h`, "Velocità"]}
              labelFormatter={(km) => `${km} km`}
            />
            <Line
              type="monotone"
              dataKey="speed"
              stroke="#FFBE5D"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {hasAltitude && (
        <div>
          <p className="text-secondary small mb-2">Altimetria</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#495057" />
              <XAxis
                dataKey="km"
                stroke="#adb5bd"
                tick={{ fontSize: 11 }}
                label={{
                  value: "km",
                  position: "insideBottomRight",
                  offset: -5,
                  fill: "#adb5bd",
                  fontSize: 11,
                }}
              />
              <YAxis
                stroke="#adb5bd"
                tick={{ fontSize: 11 }}
                label={{
                  value: "m",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#adb5bd",
                  fontSize: 11,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#212529",
                  border: "1px solid #495057",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => [`${value} m`, "Altitudine"]}
                labelFormatter={(km) => `${km} km`}
              />
              <Line
                type="monotone"
                dataKey="altitude"
                stroke="#0d6efd"
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
