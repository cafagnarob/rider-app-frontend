export function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "ora"
  if (diffMin < 60) return `${diffMin} min fa`

  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} h fa`

  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD} g fa`

  return date.toLocaleDateString("it-IT")
}
