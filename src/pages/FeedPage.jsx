import { useState } from "react"
import { Nav, Spinner, Button } from "react-bootstrap"
import { useGetFeedQuery } from "../features/social/postsApi"
import PostCard from "../features/social/components/PostCard"

function FeedPage() {
  const [type, setType] = useState("FOLLOWING")
  const [page, setPage] = useState(0)

  const feedArgs = { type, page }
  const {
    data: feed,
    isLoading,
    isFetching,
    isError,
  } = useGetFeedQuery(feedArgs)

  const handleTabChange = (newType) => {
    setType(newType)
    setPage(0)
  }

  return (
    <>
      <Nav variant="tabs" activeKey={type} className="mb-4">
        <Nav.Item>
          <Nav.Link
            eventKey="FOLLOWING"
            onClick={() => handleTabChange("FOLLOWING")}
          >
            Seguiti
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            eventKey="EXPLORE"
            onClick={() => handleTabChange("EXPLORE")}
          >
            Esplora
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="light" />
        </div>
      )}

      {isError && (
        <div className="alert alert-danger">Impossibile caricare il feed.</div>
      )}

      {feed && feed.content.length === 0 && (
        <p className="text-secondary text-center py-5">
          {type === "FOLLOWING"
            ? "Non ci sono ancora post dagli utenti che segui."
            : "Nessun post da esplorare al momento."}
        </p>
      )}

      {feed && feed.content.length > 0 && (
        <div
          className="d-flex flex-column gap-4"
          style={{
            opacity: isFetching ? 0.6 : 1,
            maxWidth: "540px",
            margin: "0 auto",
          }}
        >
          {feed.content.map((post) => (
            <PostCard key={post.id} post={post} feedArgs={feedArgs} />
          ))}
        </div>
      )}

      {feed && feed.totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
          <Button
            variant="outline-light"
            size="sm"
            disabled={feed.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Precedente
          </Button>
          <span className="text-secondary">
            {feed.number + 1} / {feed.totalPages}
          </span>
          <Button
            variant="outline-light"
            size="sm"
            disabled={feed.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Successiva
          </Button>
        </div>
      )}
    </>
  )
}

export default FeedPage
