const BASE = "https://api.maptiler.com/geocoding"

export async function searchPlaces(
  query,
  { limit = 5, proximity = "12.4964,41.9028" } = {},
) {
  if (!query || query.trim().length < 3) return []

  const url =
    `${BASE}/${encodeURIComponent(query.trim())}.json` +
    `?key=${import.meta.env.VITE_MAPTILER_KEY}` +
    `&limit=${limit}&language=it&proximity=${proximity}`

  const response = await fetch(url)
  if (!response.ok) throw new Error("Errore nella ricerca")

  const data = await response.json()

  return (data.features || []).map((f) => ({
    id: f.id,
    name: f.place_name || f.text,
    longitude: f.center[0],
    latitude: f.center[1],
  }))
}
