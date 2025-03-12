import { FC } from "react";
import { usePosts } from "../../hooks/usePost";
import { useAuth } from "../../hooks/useAuth";
import { Post } from "../../services/post-service";
import { apiClient } from "../../services/api-client";
import { useNavigate, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignInAlt, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import postService from "../../services/post-service";

const ListPosts: FC = () => {
  const { posts, isLoading, error, setPosts } = usePosts();
  const { isAuthenticated, loading: authLoading, currentUser } = useAuth();
  const navigate = useNavigate();

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${apiClient.defaults.baseURL}${imagePath}`;
  };
  
  const user = currentUser;
  const handleLike = async (postId: string) => {
    if (!user || typeof user._id !== "string") {
      console.error("User is not valid:", user);
      return;
    }
  
    try {
      await postService.likePost(postId); // Backend handles like/unlike
  
      setPosts((prevPosts: Post[]) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            // Check if user has already liked the post
            const hasLiked = user._id ? post.likes.includes(user._id) : false;
  
            return {
              ...post,
              likes: hasLiked
                ? post.likes.filter((id) => id !== user._id) // Unlike (remove user ID)
                : [...post.likes, user._id], // Like (add user ID)
            } as Post;
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };
  
  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        {!authLoading && (
          isAuthenticated ? (
            <button className="btn btn-outline-primary me-3" onClick={() => navigate("/profile")}>
              <FontAwesomeIcon icon={faUser} className="me-2" />
              My Profile
            </button>
          ) : (
            <button className="btn btn-outline-secondary me-3" onClick={() => navigate("/login")}>
              <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
              Login
            </button>
          )
        )}
      </div>

      {error && <p className="alert alert-danger">Error: {error}</p>}
      {isLoading && !error && <p>Loading...</p>}
      {!isLoading && posts.length === 0 && !error && <p className="alert alert-warning">No posts available.</p>}

      {posts.length > 0 && (
        <div className="row">
          {posts.map((post: Post) => (
            <div key={post._id} className="row-mb-4">
              <div className="card m-3 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{post.title}</h5>
                  {post.image && <img src={getImageUrl(post.image)} alt={post.title} style={{ width: "10%", marginTop: 10 }} />}
                  <p className="card-text">{post.content}</p>
                  <p className="text-muted">Author: {post.owner}</p>
                  <div className="d-flex align-items-center">
                    <p className="text-success me-2 mb-0">{post.likes.length} Likes</p>
                    <button 
                      className={`btn ${user?._id && post.likes.includes(user._id) ? "btn-danger" : "btn-outline-primary"}`} 
                      onClick={() => handleLike(post._id)}
                    >
                      <FontAwesomeIcon icon={faThumbsUp} className="me-2" /> 
                      {user?._id && post.likes.includes(user._id) ? "Unlike" : "Like"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary m-3" onClick={() => setPosts([...posts])}>
        Refresh
      </button>
    </div>
  );
};

export default ListPosts;