import { useState } from "react"
import { Spinner, Button } from "react-bootstrap"
import { useParams, Link, useNavigate } from "react-router-dom"
import { FaArrowLeft } from "react-icons/fa"
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../features/social/followApi"

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
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="alert alert-danger">Impossibile caricare la lista.</div>
    )
  }

  return (
    <div style={{ maxWidth: "540px", margin: "0 auto" }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="outline-light" size="sm" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </Button>
        <div>
          <h4 className="mb-0">{title}</h4>
          <small className="text-secondary">@{username}</small>
        </div>
      </div>

      {data.content.length === 0 ? (
        <p className="text-secondary text-center py-5">{emptyText}</p>
      ) : (
        <div
          className="d-flex flex-column"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
          {data.content.map((user) => (
            <Link
              key={user.id}
              to={`/profile/${user.username}`}
              className="d-flex align-items-center gap-3 p-3 border-bottom border-secondary text-decoration-none text-light"
            >
              <img
                src={user.profilePicture}
                alt={user.username}
                className="rounded-circle"
                style={{ width: "48px", height: "48px", objectFit: "cover" }}
              />
              <div>
                <div className="fw-semibold">{user.username}</div>
                <small className="text-secondary">
                  {user.name} {user.surname}
                </small>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
          <Button
            variant="outline-light"
            size="sm"
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Precedente
          </Button>
          <span className="text-secondary">
            {data.number + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline-light"
            size="sm"
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Successiva
          </Button>
        </div>
      )}
    </div>
  )
}

export default FollowListPage
