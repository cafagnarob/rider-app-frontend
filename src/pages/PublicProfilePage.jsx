import { FaFacebook, FaGlobe, FaTiktok, FaYoutube } from "react-icons/fa"
import { Link, Navigate, useParams } from "react-router-dom"
import {
  useGetCurrentUserQuery,
  useGetPublicProfileQuery,
} from "../features/users/usersApi"
import {
  useGetFollowStatsQuery,
  useToggleFollowMutation,
} from "../features/social/followApi"
import { useGetUserPostsQuery } from "../features/social/postsApi"
import { Spinner } from "react-bootstrap"
import { FaInstagram } from "react-icons/fa6"
import { COLORS, FONTS, styles } from "../styles/theme"

const PLATFORM_ICONS = {
  INSTAGRAM: FaInstagram,
  FACEBOOK: FaFacebook,
  YOUTUBE: FaYoutube,
  TIKTOK: FaTiktok,
  WEBSITE: FaGlobe,
}

function PublicProfilePage() {
  const { username } = useParams()

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
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>
        Utente non trovato.
      </div>
    )
  }

  const isFollowing = stats?.isFollowedByCurrentUser

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <img
            src={profile.profilePicture}
            alt={profile.username}
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              objectFit: "cover",
              background: COLORS.surfaceRaised,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 20,
                lineHeight: 1.15,
              }}
            >
              {profile.name} {profile.surname}
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                color: COLORS.textMuted,
                marginBottom: 10,
              }}
            >
              @{profile.username}
            </div>
            <button
              type="button"
              disabled={isToggling}
              onClick={() => toggleFollow({ username, isFollowing })}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 11,
                background: isFollowing ? COLORS.card : COLORS.accent,
                border: `1px solid ${isFollowing ? COLORS.borderStrong : COLORS.accent}`,
                color: isFollowing ? COLORS.textSecondary : COLORS.onAccent,
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              {isFollowing ? "SMETTI DI SEGUIRE" : "SEGUI"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 22, marginBottom: 16 }}>
          <Link
            to={`/users/${username}/followers`}
            style={{ textDecoration: "none", color: COLORS.text }}
          >
            <span
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {stats?.followersCount ?? 0}
            </span>{" "}
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10.5,
                color: COLORS.textMuted,
              }}
            >
              FOLLOWER
            </span>
          </Link>
          <Link
            to={`/users/${username}/following`}
            style={{ textDecoration: "none", color: COLORS.text }}
          >
            <span
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {stats?.followingCount ?? 0}
            </span>{" "}
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10.5,
                color: COLORS.textMuted,
              }}
            >
              SEGUITI
            </span>
          </Link>
          <span>
            <span
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {posts?.totalElements ?? 0}
            </span>{" "}
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10.5,
                color: COLORS.textMuted,
              }}
            >
              POST
            </span>
          </span>
        </div>

        {profile.description && (
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: "rgba(255,255,255,.85)",
              marginBottom: 8,
            }}
          >
            {profile.description}
          </p>
        )}
        {profile.location && (
          <p
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
              marginBottom: 12,
            }}
          >
            {profile.location}
          </p>
        )}

        {profile.currentVehicle && (
          <span
            style={{
              display: "inline-block",
              marginBottom: 14,
              padding: "5px 11px",
              borderRadius: 9,
              background: COLORS.accentSoftBg,
              border: `1px solid ${COLORS.accentSoftBorder}`,
              fontFamily: FONTS.mono,
              fontSize: 10.5,
              color: COLORS.accent,
            }}
          >
            {profile.currentVehicle.nickname ||
              `${profile.currentVehicle.brandName} ${profile.currentVehicle.modelName}`}
          </span>
        )}

        {profile.links?.length > 0 && (
          <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
            {profile.links.map((link) => {
              const Icon = PLATFORM_ICONS[link.platform] || FaGlobe
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: COLORS.textSecondary }}
                >
                  <Icon size={19} />
                </a>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 20px 10px" }}>
        <div style={styles.sectionTitle}>POST</div>
      </div>

      {posts?.content.length === 0 ? (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            textAlign: "center",
            padding: "40px 20px",
          }}
        >
          Questo utente non ha ancora pubblicato nulla.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 3,
            padding: "0 3px",
          }}
        >
          {posts?.content.map((post) => (
            <Link key={post.id} to={`/posts/${post.id}`}>
              <div style={{ aspectRatio: "1", background: COLORS.cardAlt }}>
                {post.media?.[0] && (
                  <img
                    src={post.media[0].mediaUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default PublicProfilePage
