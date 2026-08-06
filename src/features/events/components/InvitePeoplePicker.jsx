import { useState } from "react"
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../../social/followApi"
import { useGetCurrentUserQuery } from "../../users/usersApi"
import { useInviteUserMutation } from "../invitesApi"
import { COLORS, FONTS, styles } from "../../../styles/theme"

const STATUS_LABELS = {
  PENDING: { text: "IN ATTESA", color: COLORS.accent, bg: COLORS.accentSoftBg },
  ACCEPTED: { text: "ACCETTATO", color: "#4ADE80", bg: "#173323" },
  REJECTED: { text: "RIFIUTATO", color: COLORS.textMuted, bg: COLORS.cardAlt },
}

function InvitePeoplePicker({ eventId, existingInvites }) {
  const { data: me } = useGetCurrentUserQuery()
  const { data: followersPage } = useGetFollowersQuery(
    { username: me?.username, page: 0, size: 50 },
    { skip: !me?.username },
  )
  const { data: followingPage } = useGetFollowingQuery(
    { username: me?.username, page: 0, size: 50 },
    { skip: !me?.username },
  )
  const [inviteUser, { isLoading }] = useInviteUserMutation()

  const [search, setSearch] = useState("")
  const [feedback, setFeedback] = useState("")

  const invitedUsernames = new Set(
    (existingInvites || []).map((i) => i.invitedUsername),
  )

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

  const handleInvite = async (username) => {
    setFeedback("")
    try {
      await inviteUser({ eventId, username }).unwrap()
    } catch (err) {
      setFeedback(err.data?.message || "Impossibile inviare l'invito.")
    }
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

      {feedback && (
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 12,
            color: COLORS.danger,
            marginBottom: 10,
          }}
        >
          {feedback}
        </div>
      )}

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
          maxHeight: 260,
          overflowY: "auto",
        }}
      >
        {filtered.map((contact) => {
          const existingInvite = (existingInvites || []).find(
            (i) => i.invitedUsername === contact.username,
          )
          const isInvited = invitedUsernames.has(contact.username)

          return (
            <div
              key={contact.username}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 11px",
                borderRadius: 11,
                background: COLORS.cardAlt,
                border: `1px solid ${COLORS.borderSoft}`,
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
              <span style={{ flex: 1, fontFamily: FONTS.body, fontSize: 14 }}>
                {contact.username}
              </span>

              {isInvited ? (
                existingInvite.status === "REJECTED" ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        padding: "4px 9px",
                        borderRadius: 8,
                        fontFamily: FONTS.mono,
                        fontSize: 9.5,
                        background: STATUS_LABELS.REJECTED.bg,
                        color: STATUS_LABELS.REJECTED.color,
                      }}
                    >
                      RIFIUTATO
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInvite(contact.username)}
                      disabled={isLoading}
                      style={{
                        height: 30,
                        padding: "0 12px",
                        borderRadius: 9,
                        background: COLORS.accent,
                        border: "none",
                        color: COLORS.onAccent,
                        fontFamily: FONTS.mono,
                        fontSize: 10,
                        cursor: "pointer",
                      }}
                    >
                      REINVITA
                    </button>
                  </div>
                ) : (
                  <span
                    style={{
                      padding: "4px 9px",
                      borderRadius: 8,
                      fontFamily: FONTS.mono,
                      fontSize: 9.5,
                      background: STATUS_LABELS[existingInvite.status].bg,
                      color: STATUS_LABELS[existingInvite.status].color,
                    }}
                  >
                    {STATUS_LABELS[existingInvite.status].text}
                  </span>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => handleInvite(contact.username)}
                  disabled={isLoading}
                  style={{
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 9,
                    background: COLORS.accent,
                    border: "none",
                    color: COLORS.onAccent,
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  INVITA
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InvitePeoplePicker
