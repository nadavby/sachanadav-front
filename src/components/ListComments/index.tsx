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
import { useComments } from "../../hooks/useComment";

const ListComments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { comments, error: fetchError, isLoading: fetchLoading, setComments, setError: setFetchError, setIsLoading: setFetchLoading } = useComments();
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | undefined>();
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (location.state?.postId) {
      setPostId(location.state.postId);
    } else {
      setFetchError("Post ID not found in navigation state");
    }
  }, [location.state, setFetchError]);

  useEffect(() => {
    if (comments.length > 0 && postId) {
      const filtered = comments.filter(comment => comment.postId === postId);
      setFilteredComments(filtered);
    } else {
      setFilteredComments([]);
    }
  }, [comments, postId]);

  useEffect(() => {
    if (fetchError) {
      setError(fetchError);
    }
  }, [fetchError]);

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser?._id) {
      setFetchError("You need to be logged in");
      return;
    }
    if (!postId) {
      setFetchError("Post ID not found");
      return;
    }

    setFetchLoading(true);
    try {
      const commentData: Comment = {
        content: newComment,
        postId,
        owner: currentUser.userName,
      };
      const createdComment = await commentService.create(commentData);
      setComments([...comments, createdComment]);
      setFilteredComments([...filteredComments, createdComment]);
      setNewComment("");
      setFetchError(null);
    } catch (err) {
      console.error(err);
      setFetchError("An error occurred while creating the comment");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser?._id) {
      setFetchError("You need to be logged in");
      return;
    }
    
    setFetchLoading(true);
    try {
      await commentService.deleteById(commentId);
      const updatedComments = comments.filter((comment) => comment._id !== commentId);
      setComments(updatedComments);
      setFilteredComments(filteredComments.filter((comment) => comment._id !== commentId));
      setFetchError(null);
    } catch (err) {
      console.error(err);
      setFetchError("An error occurred while deleting the comment");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setSelectedCommentId(comment._id!);
    setEditContent(comment.content);
  };

  const handleSaveComment = async (commentId: string) => {
    if (!currentUser?._id) {
      setFetchError("You need to be logged in");
      return;
    }
    if (!postId) {
      setFetchError("Post ID not found");
      return;
    }

    setFetchLoading(true);
    try {
      const updatedComment = await commentService.updateById(commentId, {
        content: editContent,
        postId,
        owner: currentUser.userName,
      });
      
      const updatedMainComments = comments.map((comment) =>
        comment._id === commentId ? updatedComment : comment
      );
      setComments(updatedMainComments);
      
      setFilteredComments(
        filteredComments.map((comment) =>
          comment._id === commentId ? updatedComment : comment
        )
      );
      
      setSelectedCommentId(null);
      setFetchError(null);
    } catch (err) {
      console.error(err);
      setFetchError("An error occurred while updating the comment");
    } finally {
      setFetchLoading(false);
    }
  };

  const isLoading = fetchLoading;
  const displayError = error || fetchError;

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
      {displayError && <div className="alert alert-danger">{displayError}</div>}
      {isLoading && (
        <div
          className="spinner-border"
          role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      {filteredComments.length > 0 ? (
        <div className="comment-list">
          {filteredComments.map((comment) => (
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
                    {currentUser?.userName === comment.owner && (
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