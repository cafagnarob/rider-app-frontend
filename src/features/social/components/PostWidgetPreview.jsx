import {
  FaTachometerAlt,
  FaRoute,
  FaCalendarAlt,
  FaMotorcycle,
} from "react-icons/fa"
import { decodePolyline } from "../../../utils/polyline"
import { formatDuration } from "../../../utils/geo"
import { useMemo } from "react"

const TYPE_ICONS = {
  RIDE: FaTachometerAlt,
  ROUTE: FaRoute,
  EVENT: FaCalendarAlt,
  VEHICLE: FaMotorcycle,
}

function polylineToSvgPath(encodedPolyline, viewBoxSize = 100) {
  const points = decodePolyline(encodedPolyline)
  if (!points || points.length < 2) return null

  const lats = points.map((p) => p[1])
  const lngs = points.map((p) => p[0])
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs),
    maxLng = Math.max(...lngs)
  const spanLat = maxLat - minLat || 0.0001
  const spanLng = maxLng - minLng || 0.0001
  const pad = viewBoxSize * 0.12

  const scaled = points.map(([lng, lat]) => {
    const x = pad + ((lng - minLng) / spanLng) * (viewBoxSize - pad * 2)
    const y = pad + (1 - (lat - minLat) / spanLat) * (viewBoxSize - pad * 2)
    return [x, y]
  })

  return scaled
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ")
}

function generateSpeedWave(seed, pointCount) {
  let state = seed
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }

  const points = [next() * 0.4 + 0.3]
  for (let i = 1; i < pointCount; i++) {
    const drift = (next() - 0.5) * 0.35
    const value = Math.min(0.95, Math.max(0.08, points[i - 1] + drift))
    points.push(value)
  }
  return points
}

function hashStringToInt(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) || 1
}

function MiniLabel({ type }) {
  const Icon = TYPE_ICONS[type]
  return (
    <span className="post-widget__mini">
      <Icon size={11} />
    </span>
  )
}

// --- RIDE ---

function RideWaveSvg({ seed, height, pointCount = 40 }) {
  const points = useMemo(
    () => generateSpeedWave(hashStringToInt(seed), pointCount),
    [seed, pointCount],
  )
  const path = points
    .map((v, i) => `${(i / (points.length - 1)) * 100},${(1 - v) * height}`)
    .map((coords, i) => `${i === 0 ? "M" : "L"}${coords}`)
    .join(" ")

  return (
    <svg
      className="post-widget__ride-wave"
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ height }}
    >
      <path
        d={path}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RideRow({ data, full }) {
  return (
    <div className="post-widget__body">
      <RideWaveSvg seed={data.id} height={36} pointCount={40} />
      <div className="post-widget__stats-row">
        <div className="post-widget__stat">
          <span className="post-widget__stat-value">
            {data.avgSpeedKmH?.toFixed(0) ?? "—"}
          </span>
          <span className="post-widget__stat-unit">KM/H MEDIA</span>
        </div>
        {full && (
          <>
            <div className="post-widget__stat">
              <span className="post-widget__stat-value">
                {data.distanceKm?.toFixed(1).replace(".", ",") ?? "—"}
              </span>
              <span className="post-widget__stat-unit">KM</span>
            </div>
            {data.startedAt && data.endedAt && (
              <div className="post-widget__stat">
                <span className="post-widget__stat-value">
                  {formatDuration(
                    (new Date(data.endedAt) - new Date(data.startedAt)) / 1000,
                  )}
                </span>
                <span className="post-widget__stat-unit">DURATA</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function RideStack({ data }) {
  return (
    <div className="post-widget__stack">
      <RideWaveSvg seed={data.id} height={40} pointCount={40} />
      <span className="post-widget__stat-value post-widget__stat-value--big">
        {data.avgSpeedKmH?.toFixed(0) ?? "—"}
      </span>
      <span className="post-widget__stat-unit">KM/H MEDIA</span>
      {data.distanceKm != null && (
        <>
          <span className="post-widget__stat-value">
            {data.distanceKm.toFixed(1).replace(".", ",")}
          </span>
          <span className="post-widget__stat-unit">KM</span>
        </>
      )}
    </div>
  )
}

function RideContent({ data, size }) {
  if (size === "MINI")
    return <MiniLabel type="RIDE" text={data.title || "Giro"} />
  if (size === "TALL") return <RideStack data={data} />
  return <RideRow data={data} full={size === "LARGE"} />
}

// --- ROUTE ---

function RouteRow({ data, full }) {
  const path = polylineToSvgPath(data.encodedPolyline)
  return (
    <div className="post-widget__body post-widget__body--row">
      {path && (
        <svg
          className="post-widget__route-line"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={path}
            fill="none"
            stroke="#ff7b00"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <div className="post-widget__info">
        <span className="post-widget__title">{data.name}</span>
        <span className="post-widget__stat-unit">
          {(data.distanceMeters / 1000).toFixed(1).replace(".", ",")} KM
          {full &&
            ` · ${Math.round(data.durationSeconds / 60)} MIN · ${data.waypoints?.length ?? 0} TAPPE`}
        </span>
      </div>
    </div>
  )
}

function RouteStack({ data }) {
  const path = polylineToSvgPath(data.encodedPolyline)
  return (
    <div className="post-widget__stack">
      {path && (
        <svg
          className="post-widget__route-line post-widget__route-line--tall"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={path}
            fill="none"
            stroke="#ff7b00"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="post-widget__title">{data.name}</span>
      <span className="post-widget__stat-unit">
        {(data.distanceMeters / 1000).toFixed(1).replace(".", ",")} KM
      </span>
    </div>
  )
}

function RouteContent({ data, size }) {
  if (size === "MINI") return <MiniLabel type="ROUTE" text={data.name} />
  if (size === "TALL") return <RouteStack data={data} />
  return <RouteRow data={data} full={size === "LARGE"} />
}

// --- EVENT ---

function EventBadge({ size }) {
  return (
    <div className="post-widget__event-badge">
      <FaCalendarAlt size={size} />
    </div>
  )
}

function EventRow({ data, full }) {
  const date = new Date(data.startDateTime)
  return (
    <div className="post-widget__body post-widget__body--row">
      <EventBadge size={17} />
      <div className="post-widget__info">
        <span className="post-widget__title">{data.title}</span>
        <span className="post-widget__stat-unit">
          {date.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
          {full &&
            ` · ${data.currentParticipants}/${data.maxParticipants} ISCRITTI`}
        </span>
      </div>
    </div>
  )
}

function EventStack({ data }) {
  const date = new Date(data.startDateTime)
  return (
    <div className="post-widget__stack">
      <EventBadge size={22} />
      <span className="post-widget__title">{data.title}</span>
      <span className="post-widget__stat-unit">
        {date.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
      </span>
    </div>
  )
}

function EventContent({ data, size }) {
  if (size === "MINI") return <MiniLabel type="EVENT" text={data.title} />
  if (size === "TALL") return <EventStack data={data} />
  return <EventRow data={data} full={size === "LARGE"} />
}

// --- VEHICLE ---

function VehicleRow({ data, full }) {
  const model = data.model
  const label = data.nickname || `${model.brand.name} ${model.name}`
  return (
    <div className="post-widget__body post-widget__body--row">
      {model.imageUrl && (
        <img src={model.imageUrl} alt="" className="post-widget__vehicle-img" />
      )}
      <div className="post-widget__info">
        <span className="post-widget__title">{label}</span>
        <span className="post-widget__stat-unit">
          {model.brand.name} {model.name}
          {full && ` · ${model.engineCc} CC`}
        </span>
      </div>
    </div>
  )
}

function VehicleStack({ data }) {
  const model = data.model
  const label = data.nickname || `${model.brand.name} ${model.name}`
  return (
    <div className="post-widget__stack">
      {model.imageUrl && (
        <img
          src={model.imageUrl}
          alt=""
          className="post-widget__vehicle-img post-widget__vehicle-img--tall"
        />
      )}
      <span className="post-widget__title">{label}</span>
      <span className="post-widget__stat-unit">
        {model.brand.name} {model.name}
      </span>
    </div>
  )
}

function VehicleLarge({ data }) {
  const model = data.model
  const label = data.nickname || `${model.brand.name} ${model.name}`
  return (
    <div className="post-widget__vehicle-large">
      {model.imageUrl && (
        <img
          src={model.imageUrl}
          alt=""
          className="post-widget__vehicle-large-img"
        />
      )}
      <span className="post-widget__vehicle-large-title">{label}</span>
      <span className="post-widget__vehicle-large-subtitle">
        {model.brand.name} {model.name} · {model.engineCc} CC
      </span>
    </div>
  )
}

function VehicleContent({ data, size }) {
  const label = data.nickname || `${data.model.brand.name} ${data.model.name}`
  if (size === "MINI") return <MiniLabel type="VEHICLE" text={label} />
  if (size === "TALL") return <VehicleStack data={data} />
  if (size === "LARGE") return <VehicleLarge data={data} />
  return <VehicleRow data={data} full={false} />
}

function PostWidgetPreview({ type, size, data }) {
  return (
    <div
      className={`post-widget post-widget--${size.toLowerCase()} post-widget--${type.toLowerCase()}`}
    >
      {type === "RIDE" && <RideContent data={data} size={size} />}
      {type === "ROUTE" && <RouteContent data={data} size={size} />}
      {type === "EVENT" && <EventContent data={data} size={size} />}
      {type === "VEHICLE" && <VehicleContent data={data} size={size} />}
    </div>
  )
}

export default PostWidgetPreview
