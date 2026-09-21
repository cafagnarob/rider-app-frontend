import { FaHeart, FaRegHeart } from "react-icons/fa"
import {
  useGetRepliesQuery,
  useReportCommentMutation,
  useToggleCommentLikeMutation,
} from "../postsApi"
import { formatRelativeTime } from "../../../utils/dateFormat"
import { useState } from "react"
import Avatar from "../../../components/Avatar"
import ReportModal from "./ReportModal"

function CommentActions({
  comment,
  postId,
  parentCommentId,
  canDelete,
  canReport,
  onReply,
  onDelete,
  onReport,
}) {
  const [toggleCommentLike] = useToggleCommentLikeMutation()
  return (
    <div className="comment-row__actions">
      <button
        type="button"
        className={`comment-row__like-btn ${comment.likedByCurrentUser ? "comment-row__like-btn--liked" : ""}`}
        onClick={() =>
          toggleCommentLike({ postId, commentId: comment.id, parentCommentId })
        }
      >
        {comment.likedByCurrentUser ? (
          <FaHeart size={11} />
        ) : (
          <FaRegHeart size={11} />
        )}
        {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
      </button>
      <button
        type="button"
        className="comment-row__reply-link"
        onClick={onReply}
      >
        Rispondi
      </button>
      {canDelete && (
        <button
          type="button"
          className="comment-row__delete-link"
          onClick={onDelete}
        >
          Elimina
        </button>
      )}
      {canReport && (
        <button
          type="button"
          className="comment-row__delete-link"
          onClick={onReport}
        >
          Segnala
        </button>
      )}
    </div>
  )
}

function CommentBody({ comment }) {
  return (
    <div className="comment-row__body">
      <div className="comment-row__header">
        <span className="comment-row__author">{comment.authorUsername}</span>
        <span className="comment-row__time">
          {formatRelativeTime(comment.createdAt)}
        </span>
      </div>
      <p className="comment-row__text">{comment.text}</p>
    </div>
  )
}

function CommentThread({
  comment,
  postId,
  isPostAuthor,
  currentUsername,
  replyingTo,
  onStartReply,
  onSubmitReply,
  replyText,
  setReplyText,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [reportComment] = useReportCommentMutation()
  const { data: replies } = useGetRepliesQuery(
    { postId, commentId: comment.id },
    { skip: !expanded },
  )

  const canDeleteTop =
    currentUsername === comment.authorUsername || isPostAuthor
  const canReportTop = currentUsername !== comment.authorUsername
  const isReplyingHere = replyingTo?.commentId === comment.id

  return (
    <div className="comment-thread">
      <div className="comment-row">
        <Avatar
          src={comment.authorProfilePicture}
          alt={comment.authorUsername}
          className="comment-row__avatar"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <CommentBody comment={comment} />
          <CommentActions
            comment={comment}
            postId={postId}
            canDelete={canDeleteTop}
            canReport={canReportTop}
            onReply={() => onStartReply(comment.id, comment.authorUsername)}
            onDelete={() => onDelete(comment.id)}
            onReport={() => setReportTarget(comment.id)}
          />
        </div>
      </div>

      {comment.replyCount > 0 && (
        <button
          type="button"
          className="comment-row__show-replies"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? "Nascondi risposte"
            : `Mostra ${comment.replyCount} risposte`}
        </button>
      )}

      {expanded && (
        <div className="comment-row__replies">
          {replies?.map((reply) => {
            const canDeleteReply =
              currentUsername === reply.authorUsername || isPostAuthor
            const canReportReply = currentUsername !== reply.authorUsername
            return (
              <div key={reply.id} className="comment-row comment-row--reply">
                <Avatar
                  src={reply.authorProfilePicture}
                  alt={reply.authorUsername}
                  className="comment-row__avatar comment-row__avatar--reply"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CommentBody comment={reply} />
                  <CommentActions
                    comment={reply}
                    postId={postId}
                    parentCommentId={comment.id}
                    canDelete={canDeleteReply}
                    canReport={canReportReply}
                    onReply={() =>
                      onStartReply(comment.id, reply.authorUsername)
                    }
                    onDelete={() => onDelete(reply.id, comment.id)}
                    onReport={() => setReportTarget(reply.id)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isReplyingHere && (
        <form
          className="comment-row__reply-form"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmitReply(comment.id)
            setExpanded(true)
          }}
        >
          <input
            type="text"
            className="input reel-comments__input"
            placeholder={`Rispondi a @${replyingTo.username}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="reel-comments__send-btn"
            disabled={!replyText.trim()}
          >
            INVIA
          </button>
        </form>
      )}

      {reportTarget && (
        <ReportModal
          title="SEGNALA COMMENTO"
          onClose={() => setReportTarget(null)}
          onSubmit={async ({ reason, note }) => {
            await reportComment({
              postId,
              commentId: reportTarget,
              reason,
              note,
            }).unwrap()
          }}
        />
      )}
    </div>
  )
}

export default CommentThread
