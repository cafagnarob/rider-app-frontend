import { useState } from "react"

function EventCard({ title, date }) {
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)

  const handleLikeClick = () => {
    setLikeCount(liked ? likesCount - 1 : likesCount + 1)
    setLiked(true)
  }

  return (
    <div className="card">
      <h5>{title}</h5>
      <p>{date}</p>
      <button onClick={handleLikeClick}>
        {liked ? "❤️" : "🤍"} ({likesCount})
      </button>
    </div>
  )
}

export default EventCard
