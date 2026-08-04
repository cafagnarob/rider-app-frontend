import {
  FaUserPlus,
  FaHeart,
  FaComment,
  FaEnvelope,
  FaCalendarPlus,
  FaUserClock,
  FaCheckCircle,
  FaTimesCircle,
  FaBell,
} from "react-icons/fa"

export const NOTIFICATION_ICONS = {
  FOLLOW: { Icon: FaUserPlus, color: "#0d6efd" },
  LIKE: { Icon: FaHeart, color: "#dc3545" },
  COMMENT: { Icon: FaComment, color: "#6c757d" },
  MESSAGE: { Icon: FaEnvelope, color: "#6c757d" },
  EVENT_INVITE: { Icon: FaCalendarPlus, color: "#FFBE5D" },
  PARTICIPATION_REQUEST: { Icon: FaUserClock, color: "#FFBE5D" },
  PARTICIPATION_ACCEPTED: { Icon: FaCheckCircle, color: "#198754" },
  PARTICIPATION_REJECTED: { Icon: FaTimesCircle, color: "#dc3545" },
  SYSTEM: { Icon: FaBell, color: "#adb5bd" },
}

export function buildNotificationLink(referenceType, referenceId) {
  switch (referenceType) {
    case "POST":
      return `/posts/${referenceId}`
    case "EVENT":
      return `/events/${referenceId}`
    default:
      return null
  }
}
