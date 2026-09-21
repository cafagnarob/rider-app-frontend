import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useGetAdminDashboardQuery } from "../features/auth/adminApi"
import { Spinner } from "react-bootstrap"
import { useState } from "react"

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

function StatBox({ label, value, onClick, active }) {
  return (
    <div
      className="stat-cell"
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        backgroundColor: active ? "var(--color-accent)" : undefined,
        borderColor: active ? "var(--color-accent)" : undefined,
      }}
    >
      <span
        className="stat-label"
        style={{ color: active ? "#08080A" : "var(--color-text-secondary)" }}
      >
        {label}
      </span>
      <span
        className="stat-value"
        style={{ color: active ? "#08080A" : "#fff" }}
      >
        {value}
      </span>
    </div>
  )
}

const PIE_COLORS = {
  accent: "#FF7A2F",
  blue: "#5B9FFF",
  green: "#4ADE80",
  danger: "#FF5C5C",
  muted: "rgba(255,255,255,.25)",
}

function BreakdownChart({ title, segments, highlightIndex }) {
  const tooltipStyle = {
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10,
    fontFamily: FONTS.body,
    fontSize: 12,
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <div className="chart-section-title" style={{ marginBottom: 12 }}>
        {title}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            isAnimationActive={false}
          >
            {segments.map((seg, i) => (
              <Cell
                key={seg.name}
                fill={seg.color}
                opacity={
                  highlightIndex == null || highlightIndex === i ? 1 : 0.35
                }
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: COLORS.text }}
          />
          <Legend
            wrapperStyle={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function TrendChart({ title, data, color, valueFormatter }) {
  const chartData = data.map((d) => ({
    week: new Date(d.weekStart).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    }),
    value: d.value,
  }))

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
  const gradientId = `dashGradient-${title.replace(/\s/g, "")}`

  return (
    <div
      className="card"
      style={{
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div className="chart-section-title" style={{ marginBottom: 12 }}>
        {title}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} />
          <XAxis dataKey="week" stroke={COLORS.textMuted} tick={axisStyle} />
          <YAxis
            stroke={COLORS.textMuted}
            tick={axisStyle}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: COLORS.text }}
            itemStyle={{ color }}
            formatter={(value) => [
              valueFormatter ? valueFormatter(value) : value,
              "",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function AdminDashboardPage() {
  const { data, isLoading, isError } = useGetAdminDashboardQuery()
  const [tab, setTab] = useState("community")
  const [communitySubTab, setCommunitySubTab] = useState("overview")
  const [communityChartKey, setCommunityChartKey] = useState("totalUsers")

  const handleCommunitySubTabChange = (key) => {
    setCommunitySubTab(key)
    setCommunityChartKey(
      key === "overview"
        ? "totalUsers"
        : key === "onboarding"
          ? "neverLoggedIn"
          : null,
    )
  }

  if (isLoading) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Impossibile caricare la dashboard.
      </div>
    )
  }

  return (
    <div>
      <div className="page-title" style={{ fontSize: 26, marginBottom: 16 }}>
        DASHBOARD
      </div>

      <div className="stat-grid stat-grid--cols-3" style={{ marginBottom: 20 }}>
        <StatBox
          label="SEGNALAZIONI CONTENUTI"
          value={data.pendingContentReports}
        />
        <StatBox
          label="SEGNALAZIONI CATALOGO"
          value={data.pendingCatalogSuggestions}
        />
      </div>

      <div className="tab-pills" style={{ marginBottom: 16 }}>
        {[
          { key: "community", label: "COMMUNITY" },
          { key: "content", label: "CONTENUTI" },
          { key: "events", label: "EVENTI" },
          { key: "trends", label: "ANDAMENTO" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab-pill ${tab === t.key ? "tab-pill--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "community" && (
        <>
          <div className="tab-pills" style={{ marginBottom: 16 }}>
            {[
              { key: "overview", label: "PANORAMICA" },
              { key: "accountStatus", label: "STATO ACCOUNT" },
              { key: "onboarding", label: "ONBOARDING" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={`tab-pill ${communitySubTab === t.key ? "tab-pill--active" : ""}`}
                onClick={() => handleCommunitySubTabChange(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {communitySubTab === "overview" && (
            <>
              <div
                className="stat-grid stat-grid--cols-3"
                style={{ marginBottom: 20 }}
              >
                <StatBox
                  label="UTENTI TOTALI"
                  value={data.totalUsers}
                  active={communityChartKey === "totalUsers"}
                  onClick={() => setCommunityChartKey("totalUsers")}
                />
                <StatBox
                  label="NUOVI (30GG)"
                  value={data.newUsersLast30Days}
                  active={communityChartKey === "newUsersLast30Days"}
                  onClick={() => setCommunityChartKey("newUsersLast30Days")}
                />
                <StatBox
                  label="ATTIVI (7GG)"
                  value={data.activeLast7Days}
                  active={communityChartKey === "activeLast7Days"}
                  onClick={() => setCommunityChartKey("activeLast7Days")}
                />
              </div>

              {communityChartKey === "totalUsers" &&
                (() => {
                  const priorBase =
                    data.totalUsers -
                    data.newUsersPerWeek.reduce((sum, p) => sum + p.value, 0)
                  let running = priorBase
                  const cumulative = data.newUsersPerWeek.map((p) => {
                    running += p.value
                    return { weekStart: p.weekStart, value: running }
                  })
                  return (
                    <TrendChart
                      title="CRESCITA UTENTI TOTALI"
                      data={cumulative}
                      color={PIE_COLORS.accent}
                    />
                  )
                })()}

              {communityChartKey === "newUsersLast30Days" && (
                <TrendChart
                  title="NUOVE REGISTRAZIONI PER SETTIMANA"
                  data={data.newUsersPerWeek}
                  color={PIE_COLORS.accent}
                />
              )}
            </>
          )}

          {communityChartKey === "activeLast7Days" && (
            <BreakdownChart
              title="ATTIVI NEGLI ULTIMI 7 GIORNI"
              segments={[
                {
                  name: "Attivi (7gg)",
                  value: data.activeLast7Days,
                  color: PIE_COLORS.green,
                },
                {
                  name: "Altri utenti attivi",
                  value: data.activeUsers - data.activeLast7Days,
                  color: PIE_COLORS.muted,
                },
              ]}
            />
          )}

          {communitySubTab === "accountStatus" && (
            <>
              <div
                className="stat-grid stat-grid--cols-3"
                style={{ marginBottom: 20 }}
              >
                <StatBox
                  label="ATTIVI"
                  value={data.activeUsers}
                  active={communityChartKey === "activeUsers"}
                  onClick={() =>
                    setCommunityChartKey((k) =>
                      k === "activeUsers" ? null : "activeUsers",
                    )
                  }
                />
                <StatBox
                  label="DISATTIVATI"
                  value={data.deactivatedUsers}
                  active={communityChartKey === "deactivatedUsers"}
                  onClick={() =>
                    setCommunityChartKey((k) =>
                      k === "deactivatedUsers" ? null : "deactivatedUsers",
                    )
                  }
                />
                <StatBox
                  label="ELIMINATI"
                  value={data.deletedUsers}
                  active={communityChartKey === "deletedUsers"}
                  onClick={() =>
                    setCommunityChartKey((k) =>
                      k === "deletedUsers" ? null : "deletedUsers",
                    )
                  }
                />
              </div>
              <BreakdownChart
                title="STATO ACCOUNT"
                segments={[
                  {
                    name: "Attivi",
                    value: data.activeUsers,
                    color: PIE_COLORS.green,
                  },
                  {
                    name: "Disattivati",
                    value: data.deactivatedUsers,
                    color: PIE_COLORS.accent,
                  },
                  {
                    name: "Eliminati",
                    value: data.deletedUsers,
                    color: PIE_COLORS.danger,
                  },
                ]}
                highlightIndex={
                  { activeUsers: 0, deactivatedUsers: 1, deletedUsers: 2 }[
                    communityChartKey
                  ]
                }
              />
            </>
          )}

          {communitySubTab === "onboarding" && (
            <>
              <div
                className="stat-grid stat-grid--cols-2"
                style={{ marginBottom: 20 }}
              >
                <StatBox
                  label="MAI ACCEDUTO"
                  value={data.neverLoggedIn}
                  active={communityChartKey === "neverLoggedIn"}
                  onClick={() => setCommunityChartKey("neverLoggedIn")}
                />
                <StatBox
                  label="EMAIL NON VERIFICATE"
                  value={data.unverifiedEmails}
                  active={communityChartKey === "unverifiedEmails"}
                  onClick={() => setCommunityChartKey("unverifiedEmails")}
                />
              </div>

              {communityChartKey === "neverLoggedIn" && (
                <BreakdownChart
                  title="MAI EFFETTUATO IL LOGIN"
                  segments={[
                    {
                      name: "Mai acceduto",
                      value: data.neverLoggedIn,
                      color: PIE_COLORS.danger,
                    },
                    {
                      name: "Ha effettuato login",
                      value: data.totalUsers - data.neverLoggedIn,
                      color: PIE_COLORS.muted,
                    },
                  ]}
                />
              )}

              {communityChartKey === "unverifiedEmails" && (
                <BreakdownChart
                  title="VERIFICA EMAIL"
                  segments={[
                    {
                      name: "Verificate",
                      value: data.totalUsers - data.unverifiedEmails,
                      color: PIE_COLORS.green,
                    },
                    {
                      name: "Non verificate",
                      value: data.unverifiedEmails,
                      color: PIE_COLORS.accent,
                    },
                  ]}
                />
              )}
            </>
          )}
        </>
      )}

      {tab === "content" && (
        <div className="stat-grid stat-grid--cols-3">
          <StatBox label="POST" value={data.totalPosts} />
          <StatBox label="GIRI REGISTRATI" value={data.totalRides} />
          <StatBox label="PERCORSI" value={data.totalRoutes} />
          <StatBox
            label="KM TOTALI"
            value={Math.round(data.totalKmRidden).toLocaleString("it-IT")}
          />
        </div>
      )}

      {tab === "events" && (
        <div className="stat-grid stat-grid--cols-3">
          <StatBox label="TOTALI" value={data.totalEvents} />
          <StatBox label="TAPPE STANDARD" value={data.standardEvents} />
          <StatBox label="RADUNI" value={data.radunoEvents} />
          <StatBox label="VIAGGI MULTIGIORNO" value={data.multiDayTrips} />
        </div>
      )}

      {tab === "trends" && (
        <div>
          <TrendChart
            title="NUOVE REGISTRAZIONI PER SETTIMANA"
            data={data.newUsersPerWeek}
            color={COLORS.accent}
          />
          <TrendChart
            title="CHILOMETRI PERCORSI PER SETTIMANA"
            data={data.kmRiddenPerWeek}
            color="#5B9FFF"
            valueFormatter={(v) => `${Math.round(v)} km`}
          />
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
