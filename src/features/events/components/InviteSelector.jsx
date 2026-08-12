import { useState } from "react"
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../../social/followApi"
import { useGetCurrentUserQuery } from "../../users/usersApi"

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
        className="input"
        style={{ height: 42, marginBottom: 10 }}
        placeholder="Cerca tra i tuoi contatti..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 && (
        <p className="picker-empty-text">Nessun contatto trovato.</p>
      )}

      <div className="contact-list">
        {filtered.map((contact) => {
          const isSelected = selected.includes(contact.username)
          return (
            <button
              type="button"
              key={contact.username}
              className={`selectable-contact-row ${isSelected ? "selectable-contact-row--selected" : ""}`}
              onClick={() => toggle(contact.username)}
            >
              <img
                src={contact.profilePicture}
                alt={contact.username}
                className="contact-row__avatar"
              />
              <span className="selectable-contact-row__name">
                {contact.username}
              </span>
              <span
                className={`selectable-contact-row__checkbox ${isSelected ? "selectable-contact-row__checkbox--checked" : ""}`}
              >
                {isSelected ? "✓" : ""}
              </span>
            </button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <div className="selection-count">
          {selected.length} SELEZIONAT{selected.length === 1 ? "O" : "I"}
        </div>
      )}
    </div>
  )
}

export default InviteSelector
