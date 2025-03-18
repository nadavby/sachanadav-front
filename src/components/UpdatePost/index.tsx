/** @format */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import postService from "../../services/post-service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const UpdatePost = () => {
  const { postId } = useParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!postId) {
          setError("Post ID is missing");
          return;
        }
        const response = await postService.getPostById(postId);
        const post = response.data;

        setTitle(post.title);
        setContent(post.content);
      } catch (error) {
        console.error("Failed to fetch post:", error);
        setError("Failed to fetch post details");
      }
    };
    fetchPost();
  }, [postId, currentUser]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) {
      setError("User not found");
      return;
    }
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (image) formData.append("image", image);
    try {
      if (!postId) {
        setError("Post ID is missing");
        return;
      }
      await postService.updatePost(postId, formData);
      navigate("/posts");
    } catch (error) {
      console.error("Failed to update post:", error);
      setError("Failed to update post");
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
    <div className="container mt-4">
      <h2>Update Post</h2>
      {error && <p className="alert alert-danger">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Content</label>
          <textarea
            className="form-control"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">New Image (optional)</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary">
          Update
        </button>
      </form>
    </div>
    </div>
  );
};

export default UpdatePost;
