import { useState } from "react"
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../../social/followApi"
import { useGetCurrentUserQuery } from "../../users/usersApi"
import { useInviteUserMutation } from "../invitesApi"
import Avatar from "../../../components/Avatar"

const STATUS_CLASSES = {
  PENDING: "invite-status-badge--pending",
  ACCEPTED: "invite-status-badge--accepted",
  REJECTED: "invite-status-badge--rejected",
}
const STATUS_TEXT = {
  PENDING: "IN ATTESA",
  ACCEPTED: "ACCETTATO",
  REJECTED: "RIFIUTATO",
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
        className="input"
        style={{ height: 42, marginBottom: 10 }}
        placeholder="Cerca tra i tuoi contatti..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {feedback && (
        <div className="error-text" style={{ fontSize: 12, marginBottom: 10 }}>
          {feedback}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="picker-empty-text">Nessun contatto trovato.</p>
      )}

      <div className="contact-list">
        {filtered.map((contact) => {
          const existingInvite = (existingInvites || []).find(
            (i) => i.invitedUsername === contact.username,
          )
          const isInvited = invitedUsernames.has(contact.username)

          return (
            <div key={contact.username} className="contact-row">
              <Avatar
                src={contact.profilePicture}
                alt={contact.username}
                className="contact-row__avatar"
              />
              <span className="contact-row__name">{contact.username}</span>

              {isInvited ? (
                existingInvite.status === "REJECTED" ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span className="invite-status-badge invite-status-badge--rejected">
                      RIFIUTATO
                    </span>
                    <button
                      type="button"
                      className="btn-accent-xs"
                      disabled={isLoading}
                      onClick={() => handleInvite(contact.username)}
                    >
                      REINVITA
                    </button>
                  </div>
                ) : (
                  <span
                    className={`invite-status-badge ${STATUS_CLASSES[existingInvite.status]}`}
                  >
                    {STATUS_TEXT[existingInvite.status]}
                  </span>
                )
              ) : (
                <button
                  type="button"
                  className="btn-accent-xs"
                  disabled={isLoading}
                  onClick={() => handleInvite(contact.username)}
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
