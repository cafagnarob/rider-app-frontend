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
import { Badge, Button, Card, Spinner } from "react-bootstrap"
import { FaInstagram } from "react-icons/fa6"

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
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError) {
    return <div className="alert alert-danger">Utente non trovato.</div>
  }

  const isFollowing = stats?.isFollowedByCurrentUser

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <Card className="bg-dark text-light border-secondary mb-4">
        <Card.Body>
          <div className="d-flex align-items-center gap-3 mb-3">
            <img
              src={profile.profilePicture}
              alt={profile.username}
              className="rounded-circle"
              style={{ width: "88px", height: "88px", objectFit: "cover" }}
            />
            <div className="flex-grow-1">
              <h4 className="mb-1">
                {profile.name} {profile.surname}
              </h4>
              <p className="text-secondary mb-2">@{profile.username}</p>
              <Button
                size="sm"
                variant={isFollowing ? "outline-light" : "warning"}
                disabled={isToggling}
                onClick={() => toggleFollow({ username, isFollowing })}
                className="rounded-pill px-3 fw-semibold"
              >
                {isFollowing ? "Smetti di seguire" : "Segui"}
              </Button>
            </div>
          </div>

          <div className="d-flex gap-4 mb-3">
            <Link
              to={`/users/${username}/followers`}
              className="text-decoration-none text-light"
            >
              <strong>{stats?.followersCount ?? 0}</strong>{" "}
              <span className="text-secondary small">follower</span>
            </Link>
            <Link
              to={`/users/${username}/following`}
              className="text-decoration-none text-light"
            >
              <strong>{stats?.followingCount ?? 0}</strong>{" "}
              <span className="text-secondary small">seguiti</span>
            </Link>
            <span>
              <strong>{posts?.totalElements ?? 0}</strong>{" "}
              <span className="text-secondary small">post</span>
            </span>
          </div>

          {profile.description && <p className="mb-2">{profile.description}</p>}
          {profile.location && (
            <p className="text-secondary small mb-2">{profile.location}</p>
          )}

          {profile.currentVehicle && (
            <Badge bg="warning" text="dark" className="mb-2">
              {profile.currentVehicle.nickname ||
                `${profile.currentVehicle.brandName} ${profile.currentVehicle.modelName}`}
            </Badge>
          )}

          {profile.links?.length > 0 && (
            <div className="d-flex gap-3 mt-2">
              {profile.links.map((link) => {
                const Icon = PLATFORM_ICONS[link.platform] || FaGlobe
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#FFBE5D" }}
                  >
                    <Icon className="fs-5" />
                  </a>
                )
              })}
            </div>
          )}
        </Card.Body>
      </Card>

      <h5 className="mb-3">Post</h5>

      {posts?.content.length === 0 ? (
        <p className="text-secondary">
          Questo utente non ha ancora pubblicato nulla.
        </p>
      ) : (
        <div className="row g-1">
          {posts?.content.map((post) => (
            <div className="col-4" key={post.id}>
              <Link to={`/posts/${post.id}`}>
                <div className="ratio ratio-1x1">
                  <img
                    src={post.media?.[0]?.mediaUrl}
                    alt=""
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PublicProfilePage
