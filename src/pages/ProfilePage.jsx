import { useState } from "react"
import { Link } from "react-router-dom"
import { FaChevronRight } from "react-icons/fa"
import { useGetCurrentUserQuery } from "../features/users/usersApi"
import { useGetMyInvitesQuery } from "../features/events/invitesApi"
import ProfileEditModal from "../features/users/components/ProfileEditModal"
import ProfileLinksSection from "../features/users/components/ProfileLinksSection"
import SecuritySection from "../features/users/components/SecuritySection"
import Avatar from "../components/Avatar"
import "../pages/CSS/ProfilePage.css"
import { Spinner } from "react-bootstrap"
import { useGetFollowStatsQuery } from "../features/social/followApi"
const MENU_ITEMS = [
  { to: "/garage", label: "Garage" },
  { to: "/routes", label: "Percorsi" },
  { to: "/catalog", label: "Catalogo moto" },
  { to: "/notifications", label: "Notifiche" },
]

function ProfilePage() {
  const { data: profile, isLoading, isError } = useGetCurrentUserQuery()
  const { data: myInvites } = useGetMyInvitesQuery()
  const { data: stats } = useGetFollowStatsQuery(profile?.username, {
    skip: !profile?.username,
  })

  const [showEdit, setShowEdit] = useState(false)

  if (isLoading) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Impossibile caricare il profilo.
      </div>
    )
  }

  return (
    <div className="page profile-page">
      <div className="px-20">
        <div className="profile-page__header-row">
          <div className="profile-page__avatar-wrap">
            <Avatar
              src={profile.profilePicture}
              alt={profile.username}
              className="profile-page__avatar"
            />
          </div>

          <div className="profile-page__info">
            <div className="profile-page__fullname">
              {profile.name} {profile.surname}
            </div>
            <div className="profile-page__username">@{profile.username}</div>

            <div className="stats-row profile-page__stats">
              <Link
                to={`/users/${profile.username}/followers`}
                className="stat-link"
              >
                <span className="stat-count">{stats?.followersCount ?? 0}</span>{" "}
                <span className="stat-label">FOLLOWER</span>
              </Link>
              <Link
                to={`/users/${profile.username}/following`}
                className="stat-link"
              >
                <span className="stat-count">{stats?.followingCount ?? 0}</span>{" "}
                <span className="stat-label">SEGUITI</span>
              </Link>
            </div>

            <Link
              to="/profile/avatar"
              className="btn-secondary profile-page__change-photo-btn"
            >
              CAMBIA FOTO
            </Link>
          </div>
        </div>

        {profile.description && (
          <p className="profile-page__description">{profile.description}</p>
        )}

        <div className="info-rows profile-page__info-rows">
          {profile.location && (
            <div className="info-row">
              <span className="info-row__label">Località</span>
              <span>{profile.location}</span>
            </div>
          )}
          {profile.birthDate && (
            <div className="info-row">
              <span className="info-row__label">Data di nascita</span>
              <span>
                {new Date(profile.birthDate).toLocaleDateString("it-IT")}
              </span>
            </div>
          )}
          <div className="info-row">
            <span className="info-row__label">Iscritto dal</span>
            <span>
              {new Date(profile.createdAt).toLocaleDateString("it-IT")}
            </span>
          </div>
        </div>

        {profile.currentVehicle && (
          <Link to="/garage" className="profile-page__vehicle-link">
            <span className="pill pill--accent">
              MOTO ATTIVA ·{" "}
              {profile.currentVehicle.nickname ||
                `${profile.currentVehicle.brandName} ${profile.currentVehicle.modelName}`}
            </span>
          </Link>
        )}

        <button
          type="button"
          className="btn-primary btn-block"
          style={{ marginBottom: 28 }}
          onClick={() => setShowEdit(true)}
        >
          MODIFICA PROFILO
        </button>

        <div className="profile-page__desktop-columns">
          <div className="profile-page__account-column">
            <div className="field-label profile-page__account-label">
              IL MIO ACCOUNT
            </div>
            <div className="menu-list profile-page__menu">
              {MENU_ITEMS.map((item) => (
                <Link key={item.to} to={item.to} className="menu-list-item">
                  {item.label}
                  <FaChevronRight size={11} color="var(--color-text-faint)" />
                </Link>
              ))}

              <Link to="/invites" className="menu-list-item">
                <span>Inviti ricevuti</span>
                <div className="flex-gap-10" style={{ gap: 8 }}>
                  {myInvites?.length > 0 && (
                    <span className="count-badge">{myInvites.length}</span>
                  )}
                  <FaChevronRight size={11} color="var(--color-text-faint)" />
                </div>
              </Link>
            </div>

            {profile?.role === "ADMIN" && (
              <Link
                to="/admin/users"
                className="menu-list-item"
                style={{ marginTop: 8 }}
              >
                Area amministratore
                <FaChevronRight size={11} color="var(--color-text-faint)" />
              </Link>
            )}
          </div>

          <ProfileLinksSection links={profile.links || []} />
          <SecuritySection profile={profile} />
        </div>
      </div>

      <ProfileEditModal
        key={showEdit ? "open" : "closed"}
        profile={showEdit ? profile : null}
        onClose={() => setShowEdit(false)}
      />
    </div>
  )
}

export default ProfilePage
