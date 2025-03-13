/** @format */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import postService from "../../services/post-service";

const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) {
      setError("User not found");
      return;
    }
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (currentUser._id) formData.append("userId", currentUser._id);
    if (image) formData.append("image", image);
    try {
      const response = await postService.createPost(formData);
      console.log("Post created successfully:", response.data);
      navigate("/posts");
    } catch (error) {
      console.error("Failed to create post:", error);
      setError("Failed to create post");
    }
  };
  return (
    <div className="container mt-4">
      <h2>Create New Post</h2>
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
          <label className="form-label">Image</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary">
          Submit
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
