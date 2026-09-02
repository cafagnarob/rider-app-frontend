import { useParams, Link, Navigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaFacebook, FaGlobe, FaTiktok, FaYoutube } from "react-icons/fa"
import { FaInstagram } from "react-icons/fa6"
import {
  useGetCurrentUserQuery,
  useGetPublicProfileQuery,
} from "../features/users/usersApi"
import {
  useGetFollowStatsQuery,
  useToggleFollowMutation,
} from "../features/social/followApi"
import { useGetUserPostsQuery } from "../features/social/postsApi"
import "../pages/CSS/PublicProfilePage.css"
import { useGetUserRoutesQuery } from "../features/routesMap/routesApi"
import { useState } from "react"
import Avatar from "../components/Avatar"

const PLATFORM_ICONS = {
  INSTAGRAM: FaInstagram,
  FACEBOOK: FaFacebook,
  YOUTUBE: FaYoutube,
  TIKTOK: FaTiktok,
  WEBSITE: FaGlobe,
}

function PublicProfilePage() {
  const { username } = useParams()

  const [tab, setTab] = useState("posts")
  const { data: routesPage } = useGetUserRoutesQuery(
    { username },
    { skip: tab !== "routes" },
  )

  const { data: me } = useGetCurrentUserQuery()
  const {
    data: profile,
    isLoading,
    isError,
  } = useGetPublicProfileQuery(username)
  const { data: stats } = useGetFollowStatsQuery(username)
  const { data: posts } = useGetUserPostsQuery(
    { userId: profile?.id },
    { skip: !profile?.id },
  )

  const [toggleFollow, { isLoading: isToggling }] = useToggleFollowMutation()

  if (me?.username === username) {
    return <Navigate to="/profile" replace />
  }

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
        Utente non trovato.
      </div>
    )
  }

  const isFollowing = stats?.isFollowedByCurrentUser

  return (
    <div className="page" key={username}>
      <div className="px-20">
        <div className="public-profile-page__header-row">
          <Avatar
            src={profile.profilePicture}
            alt={profile.username}
            className="public-profile-page__avatar"
          />
          <div className="public-profile-page__info">
            <div className="public-profile-page__fullname">
              {profile.name} {profile.surname}
            </div>
            <div className="public-profile-page__username">
              @{profile.username}
            </div>
            <button
              type="button"
              className={`follow-btn ${isFollowing ? "follow-btn--unfollow" : "follow-btn--follow"}`}
              disabled={isToggling}
              onClick={() => toggleFollow({ username, isFollowing })}
            >
              {isFollowing ? "SMETTI DI SEGUIRE" : "SEGUI"}
            </button>
          </div>
        </div>

        <div className="stats-row public-profile-page__stats">
          <Link to={`/users/${username}/followers`} className="stat-link">
            <span className="stat-count">{stats?.followersCount ?? 0}</span>{" "}
            <span className="stat-label">FOLLOWER</span>
          </Link>
          <Link to={`/users/${username}/following`} className="stat-link">
            <span className="stat-count">{stats?.followingCount ?? 0}</span>{" "}
            <span className="stat-label">SEGUITI</span>
          </Link>
          <span>
            <span className="stat-count">{posts?.totalElements ?? 0}</span>{" "}
            <span className="stat-label">POST</span>
          </span>
        </div>

        {profile.description && (
          <p className="public-profile-page__description">
            {profile.description}
          </p>
        )}
        {profile.location && (
          <p className="public-profile-page__location">{profile.location}</p>
        )}

        {profile.currentVehicle && (
          <span className="pill pill--accent public-profile-page__vehicle-badge">
            {profile.currentVehicle.nickname ||
              `${profile.currentVehicle.brandName} ${profile.currentVehicle.modelName}`}
          </span>
        )}

        {profile.links?.length > 0 && (
          <div className="social-links-row">
            {profile.links.map((link) => {
              const Icon = PLATFORM_ICONS[link.platform] || FaGlobe
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon size={19} />
                </a>
              )
            })}
          </div>
        )}
      </div>

      <div
        className="public-profile-page__posts-header"
        style={{ paddingBottom: 0 }}
      >
        <div className="tab-pills">
          <button
            type="button"
            className={`tab-pill ${tab === "posts" ? "tab-pill--active" : ""}`}
            onClick={() => setTab("posts")}
          >
            POST
          </button>
          <button
            type="button"
            className={`tab-pill ${tab === "routes" ? "tab-pill--active" : ""}`}
            onClick={() => setTab("routes")}
          >
            PERCORSI
          </button>
        </div>
      </div>

      {tab === "posts" ? (
        posts?.content.length === 0 ? (
          <p className="no-results-text">
            Questo utente non ha ancora pubblicato nulla.
          </p>
        ) : (
          <div className="post-grid">
            {posts?.content.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="post-grid__item"
              >
                {post.media?.[0] && <img src={post.media[0].mediaUrl} alt="" />}
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="px-20" style={{ paddingTop: 16 }}>
          {routesPage?.content.length === 0 ? (
            <p className="no-results-text">Nessun percorso condiviso.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {routesPage?.content.map((route) => (
                <Link
                  key={route.id}
                  to={`/routes/${route.id}`}
                  className="card"
                  style={{
                    padding: 16,
                    textDecoration: "none",
                    color: "var(--color-text)",
                    display: "block",
                  }}
                >
                  <div
                    className="route-card__name"
                    style={{ marginBottom: 10 }}
                  >
                    {route.name}
                  </div>
                  <div className="route-card__badges">
                    <span className="meta-badge">
                      {(route.distanceMeters / 1000)
                        .toFixed(1)
                        .replace(".", ",")}{" "}
                      KM
                    </span>
                    <span className="meta-badge">
                      {Math.round(route.durationSeconds / 60)} MIN
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PublicProfilePage
