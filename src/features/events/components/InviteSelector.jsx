import { useState } from "react"
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../../social/followApi"
import { useGetCurrentUserQuery } from "../../users/usersApi"
import { COLORS, FONTS, styles } from "../../../styles/theme"

function InviteSelector({ selected, onChange }) {
  const { data: me } = useGetCurrentUserQuery()
  const { data: followersPage } = useGetFollowersQuery(
    { username: me?.username, page: 0, size: 50 },
    { skip: !me?.username },
  )
  const { data: followingPage } = useGetFollowingQuery(
    { username: me?.username, page: 0, size: 50 },
    { skip: !me?.username },
  )

  const [search, setSearch] = useState("")

  const contacts = [
    ...(followersPage?.content || []),
    ...(followingPage?.content || []),
  ]
  const uniqueContacts = Array.from(
    new Map(contacts.map((c) => [c.username, c])).values(),
  )
  const filtered = uniqueContacts.filter((c) =>
    c.username.toLowerCase().includes(search.toLowerCase()),
  )

  const toggle = (username) => {
    onChange(
      selected.includes(username)
        ? selected.filter((u) => u !== username)
        : [...selected, username],
    )
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Cerca tra i tuoi contatti..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...styles.input, height: 42, marginBottom: 10 }}
      />

      {filtered.length === 0 && (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
          }}
        >
          Nessun contatto trovato.
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          maxHeight: 240,
          overflowY: "auto",
        }}
      >
        {filtered.map((contact) => {
          const isSelected = selected.includes(contact.username)
          return (
            <button
              type="button"
              key={contact.username}
              onClick={() => toggle(contact.username)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 11px",
                borderRadius: 11,
                cursor: "pointer",
                textAlign: "left",
                background: isSelected ? COLORS.accentSoftBg : COLORS.cardAlt,
                border: `1px solid ${isSelected ? COLORS.accentSoftBorder : COLORS.borderSoft}`,
              }}
            >
              <img
                src={contact.profilePicture}
                alt={contact.username}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  objectFit: "cover",
                  background: COLORS.surfaceRaised,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  color: COLORS.text,
                }}
              >
                {contact.username}
              </span>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  flexShrink: 0,
                  background: isSelected ? COLORS.accent : "transparent",
                  border: `1px solid ${isSelected ? COLORS.accent : COLORS.borderStrong}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  color: COLORS.onAccent,
                }}
              >
                {isSelected ? "✓" : ""}
              </span>
            </button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.textMuted,
            marginTop: 8,
          }}
        >
          {selected.length} SELEZIONAT{selected.length === 1 ? "O" : "I"}
        </div>
      )}
    </div>
  )
}

export default InviteSelector
