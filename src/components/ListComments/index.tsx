/** @format */

import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import commentService, { Comment } from "../../services/comment-service";
import { useAuth } from "../../hooks/useAuth";

const ListComments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | undefined>();

  useEffect(() => {
    if (location.state?.comments && location.state.comments.length > 0) {
      setComments(location.state.comments);
      setPostId(location.state.postId);
      setIsLoading(false);
    } else if (location.state?.postId) {
      setPostId(location.state.postId);
      setIsLoading(false);
    }
  }, [location.state]);

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    if (!currentUser?._id) {
      setError("You need to be Logged");
      return;
    }

    if (!postId) {
      setError("ID post not found");
      return;
    }

    setIsLoading(true);

    try {
      const commentData: Comment = {
        content: newComment,
        postId: postId,
        owner: currentUser._id,
      };

      const createdComment = await commentService.create(commentData);

      setComments([...comments, createdComment]);
      setNewComment("");
    } catch (err) {
      console.log(err);
      setError("An error occurred while creating the comment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <button
        className="btn btn-outline-primary mb-3"
        onClick={() => navigate(-1)}>
        <FontAwesomeIcon
          icon={faArrowLeft}
          className="me-2"
        />
        Back
      </button>

      <h2>Comments</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading && (
        <div className="d-flex justify-content-center">
          <div
            className="spinner-border"
            role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {comments.length > 0 ? (
        <div className="comment-list">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="card mb-3">
              <div className="card-body">
                <p className="card-text">{comment.content}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Author:{" "}
                    {typeof comment.owner === "string"
                      ? comment.owner
                      : "Unknown"}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">
          Claim your spot: Be the very first comment!
        </div>
      )}
      <div className="card-body">
        <h5 className="card-title mb-1">Add comment:</h5>
        <div className="mb-2">
          <textarea
            style={{
              borderRadius: "5px",
              backgroundColor: "lightgray",
              opacity: "0.7",
            }}
            className="form-control"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}></textarea>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleCreateComment}
          disabled={isLoading || !newComment.trim()}>
          <FontAwesomeIcon
            icon={faPlus}
            className="me-2"
          />
          Publish
        </button>
      </div>
    </div>
  );
};

export default ListComments;
