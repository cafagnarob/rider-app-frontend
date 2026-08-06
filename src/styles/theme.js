export const COLORS = {
  // sfondo e superfici
  bg: "#0B0B0C",
  card: "#13141A",
  cardAlt: "#15161A",
  surfaceRaised: "#1D1E23",
  surfaceActive: "#1E2027",
  imagePlaceholder: "#191A20",

  // bordi
  border: "rgba(255,255,255,.09)",
  borderSoft: "rgba(255,255,255,.08)",
  borderStrong: "rgba(255,255,255,.14)",

  // testo
  text: "#F4F2F0",
  textSecondary: "rgba(255,255,255,.55)",
  textMuted: "rgba(255,255,255,.42)",
  textFaint: "rgba(255,255,255,.35)",

  // accento
  accent: "#FF7A2F",
  accentHover: "#FFA469",
  accentSoftBg: "#2A1508",
  accentSoftBorder: "rgba(255,122,47,.35)",
  onAccent: "#100C08",

  // stato negativo
  danger: "#E04A3A",
  dangerBg: "#1B0F0D",
  dangerBorder: "rgba(224,74,58,.35)",
}

export const FONTS = {
  body: "Archivo, system-ui, sans-serif",
  heading: "'Barlow Condensed', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
}

// blocchi di stile pronti per gli usi che si ripetono in ogni schermata
export const styles = {
  pageBg: {
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: FONTS.body,
    minHeight: "100%",
  },

  screenLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: ".16em",
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },

  pageTitle: {
    fontFamily: FONTS.heading,
    fontWeight: 700,
    fontSize: 28,
    lineHeight: 1,
  },

  sectionTitle: {
    fontFamily: FONTS.heading,
    fontWeight: 600,
    fontSize: 21,
    letterSpacing: ".02em",
  },

  fieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: ".14em",
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },

  card: {
    borderRadius: RADIUS.xl,
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
  },

  input: {
    width: "100%",
    height: 52,
    borderRadius: RADIUS.md,
    background: COLORS.card,
    border: `1px solid ${COLORS.borderStrong}`,
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 15,
    padding: "0 15px",
    outline: "none",
    boxSizing: "border-box",
  },

  primaryButton: {
    height: 56,
    borderRadius: 15,
    background: COLORS.accent,
    border: "none",
    color: COLORS.onAccent,
    fontFamily: FONTS.heading,
    fontWeight: 700,
    fontSize: 19,
    letterSpacing: ".06em",
    textTransform: "uppercase",
    cursor: "pointer",
  },

  secondaryButton: {
    height: 48,
    borderRadius: RADIUS.md,
    background: COLORS.card,
    border: `1px solid ${COLORS.borderStrong}`,
    color: COLORS.text,
    fontFamily: FONTS.heading,
    fontWeight: 600,
    fontSize: 16,
    letterSpacing: ".05em",
    cursor: "pointer",
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    background: COLORS.cardAlt,
    border: `1px solid ${COLORS.borderStrong}`,
    color: COLORS.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },

  statGrid: {
    display: "grid",
    gap: 1,
    background: COLORS.borderSoft,
    border: `1px solid ${COLORS.borderSoft}`,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },

  statCell: {
    background: COLORS.card,
    padding: "14px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },

  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: ".1em",
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },

  statValue: {
    fontFamily: FONTS.heading,
    fontWeight: 700,
    fontSize: 21,
    lineHeight: 1,
  },

  emptyState: {
    padding: 22,
    borderRadius: RADIUS.lg,
    background: COLORS.card,
    border: `1px dashed ${COLORS.borderStrong}`,
    fontSize: 13,
    lineHeight: 1.5,
    color: COLORS.textSecondary,
  },
}

// per i numeri "alla italiana" (virgola come separatore decimale)
export function formatNumberIT(value, decimals = 1) {
  return Number(value).toLocaleString("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
