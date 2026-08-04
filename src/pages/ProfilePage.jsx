import { useState } from "react"
import {
  useGetCurrentUserQuery,
  useUpdateProfilePictureMutation,
} from "../features/users/usersApi"
import { Badge, Button, Card, Spinner } from "react-bootstrap"
import { Link } from "react-router-dom"
import ProfileEditModal from "../features/users/components/ProfileEditModal"
import ProfileLinksSection from "../features/users/components/ProfileLinksSection"
import SecuritySection from "../features/users/components/SecuritySection"

function ProfilePage() {
  const { data: profile, isLoading, isError } = useGetCurrentUserQuery()
  const [updatePicture, { isLoading: isUploading }] =
    useUpdateProfilePictureMutation()

  const [showEdit, setShowEdit] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Il file selezionato non è un'immagine.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("L'immagine non può superare i 5 MB.")
      return
    }
    setErrorMsg("")
    try {
      await updatePicture(file).unwrap()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante il caricamento.")
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="alert alert-danger">Impossibile caricare il profilo.</div>
    )
  }

  return (
    <>
      <Card className="bg-dark text-light border-secondary mb-4">
        <Card.Body>
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="position-relative">
              <img
                src={profile.profilePicture}
                alt={profile.username}
                className="rounded-circle"
                style={{ width: "96px", height: "96px", objectFit: "cover" }}
              />
              {isUploading && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-circle"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                >
                  <Spinner size="sm" animation="border" variant="light" />
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-1">
                {profile.name} {profile.surname}
              </h3>
              <p className="text-secondary mb-2">@{profile.username}</p>

              <label className="btn btn-outline-light btn-sm mb-0">
                Cambia foto
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={isUploading}
                  onChange={handlePictureChange}
                />
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="alert alert-danger py-2">{errorMsg}</div>
          )}

          {profile.description && <p className="mb-3">{profile.description}</p>}

          <dl className="row mb-3">
            {profile.location && (
              <>
                <dt className="col-4 col-md-3 text-secondary fw-normal">
                  Località
                </dt>
                <dd className="col-8 col-md-9">{profile.location}</dd>
              </>
            )}
            {profile.birthDate && (
              <>
                <dt className="col-4 col-md-3 text-secondary fw-normal">
                  Data di nascita
                </dt>
                <dd className="col-8 col-md-9">
                  {new Date(profile.birthDate).toLocaleDateString("it-IT")}
                </dd>
              </>
            )}
            <dt className="col-4 col-md-3 text-secondary fw-normal">
              Iscritto dal
            </dt>
            <dd className="col-8 col-md-9">
              {new Date(profile.createdAt).toLocaleDateString("it-IT")}
            </dd>
          </dl>

          {profile.currentVehicle && (
            <div className="mb-3">
              <p className="text-secondary small mb-1">Moto attiva</p>
              <Link to="/garage" className="text-decoration-none">
                <Badge bg="warning" text="dark" className="fs-6">
                  {profile.currentVehicle.nickname ||
                    `${profile.currentVehicle.brandName} ${profile.currentVehicle.modelName}`}
                </Badge>
              </Link>
            </div>
          )}

          <Button
            className="rounded-pill px-4 fw-bold border-0"
            style={{ backgroundColor: "#FFBE5D", color: "#000" }}
            onClick={() => setShowEdit(true)}
          >
            Modifica profilo
          </Button>
        </Card.Body>
      </Card>
      <ProfileLinksSection links={profile.links || []} />
      <SecuritySection profile={profile} />

      <ProfileEditModal
        key={showEdit ? "open" : "closed"}
        profile={showEdit ? profile : null}
        onClose={() => setShowEdit(false)}
      />
    </>
  )
}

export default ProfilePage
