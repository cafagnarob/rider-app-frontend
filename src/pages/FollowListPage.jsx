import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { useParams, Link, useNavigate } from "react-router-dom"
import { FaArrowLeft } from "react-icons/fa"
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../features/social/followApi"
import { COLORS, FONTS, styles } from "../styles/theme"

function FollowListPage({ type }) {
  const { username } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const followersQuery = useGetFollowersQuery(
    { username, page },
    { skip: type !== "followers" },
  )
  const followingQuery = useGetFollowingQuery(
    { username, page },
    { skip: type !== "following" },
  )

  const { data, isLoading, isFetching, isError } =
    type === "followers" ? followersQuery : followingQuery

  const title = type === "followers" ? "Follower" : "Seguiti"
  const emptyText =
    type === "followers"
      ? `@${username} non ha ancora follower.`
      : `@${username} non segue ancora nessuno.`

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
        Impossibile caricare la lista.
      </div>
    )
  }

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px 18px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={styles.iconButton}
        >
          <FaArrowLeft />
        </button>
        <div>
          <div style={{ ...styles.pageTitle, fontSize: 22 }}>{title}</div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.textMuted,
              marginTop: 2,
            }}
          >
            @{username}
          </div>
        </div>
      </div>

      {data.content.length === 0 ? (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          {emptyText}
        </p>
      ) : (
        <div style={{ opacity: isFetching ? 0.6 : 1 }}>
          {data.content.map((user) => (
            <Link
              key={user.id}
              to={`/profile/${user.username}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                padding: "13px 20px",
                borderBottom: `1px solid ${COLORS.borderSoft}`,
                textDecoration: "none",
              }}
            >
              <img
                src={user.profilePicture}
                alt={user.username}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  objectFit: "cover",
                  background: COLORS.surfaceRaised,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 600,
                    fontSize: 15,
                    color: COLORS.text,
                  }}
                >
                  {user.username}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    color: COLORS.textMuted,
                    marginTop: 2,
                  }}
                >
                  {user.name} {user.surname}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            padding: "24px 20px",
          }}
        >
          <button
            type="button"
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: data.first ? 0.4 : 1,
            }}
          >
            PRECEDENTE
          </button>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
            }}
          >
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: data.last ? 0.4 : 1,
            }}
          >
            SUCCESSIVA
          </button>
        </div>
      )}
    </div>
  )
}

export default FollowListPage
