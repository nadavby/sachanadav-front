/** @format */

import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faSave,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
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
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );
  const [editContent, setEditContent] = useState("");

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
    if (!currentUser?._id) return setError("You need to be logged in");
    if (!postId) return setError("Post ID not found");

    setIsLoading(true);
    try {
      const commentData: Comment = {
        content: newComment,
        postId,
        owner: currentUser._id,
      };
      const createdComment = await commentService.create(commentData);
      setComments([...comments, createdComment]);
      setNewComment("");
    } catch (err) {
      console.error(err);
      setError("An error occurred while creating the comment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser?._id) return setError("You need to be logged in");
    setIsLoading(true);
    try {
      await commentService.deleteById(commentId);
      setComments(comments.filter((comment) => comment._id !== commentId));
    } catch (err) {
      console.error(err);
      setError("An error occurred while deleting the comment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setSelectedCommentId(comment._id!);
    setEditContent(comment.content);
  };

  const handleSaveComment = async (commentId: string) => {
    if (!currentUser?._id) return setError("You need to be logged in");
    if (!postId) return setError("Post ID not found");

    setIsLoading(true);
    try {
      const updatedComment = await commentService.updateById(commentId, {
        content: editContent,
      });
      setComments(
        comments.map((comment) =>
          comment._id === commentId ? updatedComment : comment
        )
      );
      setSelectedCommentId(null);
    } catch (err) {
      console.error(err);
      setError("An error occurred while updating the comment");
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
        />{" "}
        Back
      </button>
      <h2>Comments</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {isLoading && (
        <div
          className="spinner-border"
          role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      {comments.length > 0 ? (
        <div className="comment-list">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="card mb-3">
              <div className="card-body">
                {selectedCommentId === comment._id ? (
                  <>
                    <textarea
                      className="form-control"
                      value={editContent}
                      onChange={(e) =>
                        setEditContent(e.target.value)
                      }></textarea>
                    <button
                      className="btn btn-success mt-2"
                      onClick={() => handleSaveComment(comment._id!)}>
                      <FontAwesomeIcon icon={faSave} /> Save
                    </button>
                  </>
                ) : (
                  <>
                    <p className="card-text">{comment.content}</p>
                    <small className="text-muted">
                      Author: {comment.owner}
                    </small>
                    {currentUser?._id === comment.owner && (
                      <div className="mt-2">
                        <button
                          className="btn btn-warning me-2"
                          onClick={() => handleEditComment(comment)}>
                          <FontAwesomeIcon icon={faEdit} /> Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteComment(comment._id!)}>
                          <FontAwesomeIcon icon={faTrash} /> Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">Be the first to comment!</div>
      )}
      <div className="card-body">
        <h5 className="card-title mb-1">Add comment:</h5>
        <textarea
          className="form-control mb-2"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}></textarea>
        <button
          className="btn btn-primary"
          onClick={handleCreateComment}
          disabled={isLoading || !newComment.trim()}>
          <FontAwesomeIcon
            icon={faPlus}
            className="me-2"
          />{" "}
          Publish
        </button>
      </div>
    </div>
  );
};

export default ListComments;
