import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaArrowLeft } from "react-icons/fa"
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../features/social/followApi"
import Avatar from "../components/Avatar"

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
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Impossibile caricare la lista.
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <button type="button" className="btn-icon" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div>
          <div className="page-header__title">{title}</div>
          <div className="page-header__subtitle">@{username}</div>
        </div>
      </div>

      {data.content.length === 0 ? (
        <p className="empty-list-text">{emptyText}</p>
      ) : (
        <div style={{ opacity: isFetching ? 0.6 : 1 }}>
          {data.content.map((user) => (
            <Link
              key={user.id}
              to={`/profile/${user.username}`}
              className="user-row"
            >
              <Avatar
                src={user.profilePicture}
                alt={user.username}
                className="user-row__avatar"
              />
              <div>
                <div className="user-row__username">{user.username}</div>
                <div className="user-row__fullname">
                  {user.name} {user.surname}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <div className="pagination-row">
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: data.first ? 0.4 : 1,
            }}
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            PRECEDENTE
          </button>
          <span className="pagination-row__label">
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: data.last ? 0.4 : 1,
            }}
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            SUCCESSIVA
          </button>
        </div>
      )}
    </div>
  )
}

export default FollowListPage
