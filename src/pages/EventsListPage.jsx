import { useRef, useState } from "react"
import { Card, Spinner, Button, Badge, Form, Nav } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import { FaLock } from "react-icons/fa"
import {
  useSearchEventsQuery,
  useGetOrganizedEventsQuery,
  useGetParticipatingEventsQuery,
} from "../features/events/eventsApi"
import { VISIBILITY_LABELS } from "../utils/constants"

function EventsListPage() {
  const [tab, setTab] = useState("search")
  const [page, setPage] = useState(0)
  const [title, setTitle] = useState("")
  const navigate = useNavigate()

  const [titleInput, setTitleInput] = useState("")
  const timerRef = useRef(null)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setTitleInput(value)

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setTitle(value)
      setPage(0)
    }, 400)
  }

  const searchQuery = useSearchEventsQuery(
    { title: title || undefined, page },
    { skip: tab !== "search" },
  )
  const organizedQuery = useGetOrganizedEventsQuery(
    { page },
    { skip: tab !== "organized" },
  )
  const participatingQuery = useGetParticipatingEventsQuery(
    { page },
    { skip: tab !== "participating" },
  )

  const { data, isLoading, isFetching, isError } =
    tab === "search"
      ? searchQuery
      : tab === "organized"
        ? organizedQuery
        : participatingQuery

  const handleTab = (key) => {
    setTab(key)
    setPage(0)
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Eventi</h2>
        <Link to="/events/new">
          <Button
            className="rounded-pill px-3 fw-bold border-0"
            style={{ backgroundColor: "#FFBE5D", color: "#000" }}
          >
            + Crea evento
          </Button>
        </Link>
      </div>

      <Nav variant="tabs" activeKey={tab} className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="search" onClick={() => handleTab("search")}>
            Scopri
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="organized" onClick={() => handleTab("organized")}>
            Organizzati
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            eventKey="participating"
            onClick={() => handleTab("participating")}
          >
            A cui partecipo
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {tab === "search" && (
        <Form.Control
          type="search"
          placeholder="Cerca per titolo..."
          className="bg-transparent text-light mb-3"
          value={titleInput}
          onChange={handleSearchChange}
        />
      )}

      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="light" />
        </div>
      )}

      {isError && (
        <div className="alert alert-danger">
          Impossibile caricare gli eventi.
        </div>
      )}

      {data && data.content.length === 0 && (
        <p className="text-secondary text-center py-5">
          Nessun evento trovato.
        </p>
      )}

      {data && data.content.length > 0 && (
        <div
          className="d-flex flex-column gap-3"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
          {data.content.map((event) => (
            <Card
              key={event.id}
              className="bg-dark text-light border-secondary"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Card.Title className="fs-6 mb-0 d-flex align-items-center gap-2">
                    {event.locked && (
                      <FaLock
                        className="text-secondary"
                        style={{ fontSize: "0.8rem" }}
                      />
                    )}
                    {event.title}
                  </Card.Title>
                  {event.organizer && (
                    <Badge bg="warning" text="dark">
                      Tuo
                    </Badge>
                  )}
                </div>

                <p className="text-secondary small mb-2">
                  {event.organizerUsername} ·{" "}
                  {new Date(event.startDateTime).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <div className="d-flex gap-2 flex-wrap">
                  <Badge bg="secondary">
                    {VISIBILITY_LABELS[event.visibility]}
                  </Badge>
                  <Badge bg="secondary">
                    {event.currentParticipants}/{event.maxParticipants}
                  </Badge>
                  {event.myParticipationStatus && (
                    <Badge
                      bg={
                        event.myParticipationStatus === "ACCEPTED"
                          ? "success"
                          : "info"
                      }
                    >
                      {event.myParticipationStatus === "ACCEPTED"
                        ? "Confermato"
                        : "In attesa"}
                    </Badge>
                  )}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
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

export default EventsListPage
