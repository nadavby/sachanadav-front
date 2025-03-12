import { FC } from "react";
import { usePosts } from "../../hooks/usePost";
import { useAuth } from "../../hooks/useAuth";
import { Post } from "../../services/post-service";
import { useNavigate, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignInAlt, faThumbsUp, faPlus } from "@fortawesome/free-solid-svg-icons";
import postService from "../../services/post-service";

const ListPosts: FC = () => {
  const { posts, isLoading, error, setPosts } = usePosts();
  const { isAuthenticated, loading: authLoading, currentUser } = useAuth();
  const navigate = useNavigate();

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  const user = currentUser;
  const handleLike = async (postId: string) => {
    if (!user || typeof user._id !== "string") {
      console.error("User is not valid:", user);
      return;
    }
  
    try {
      await postService.likePost(postId);
  
      setPosts((prevPosts: Post[]) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            const hasLiked = user._id ? post.likes.includes(user._id) : false;
  
            return {
              ...post,
              likes: hasLiked
                ? post.likes.filter((id) => id !== user._id)
                : [...post.likes, user._id],
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
    <div className="container mt-3">
      <div className="d-flex justify-content-between mb-3">
        {!authLoading && (
          isAuthenticated ? (
            <button className="btn btn-outline-primary" onClick={() => navigate("/profile")}>
              <FontAwesomeIcon icon={faUser} className="me-2" />
              My Profile
            </button>
          ) : (
            <button className="btn btn-outline-secondary" onClick={() => navigate("/login")}>
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
            <div key={post._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{post.title}</h5>
                  <p className="card-text flex-grow-1">{post.content}</p>
                  {post.image && <img src={post.image} alt={post.title} className="img-fluid my-2" style={{ height: "200px", objectFit: "cover" }} />}
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

      <button 
        className="btn btn-success position-fixed bottom-0 end-0 m-3" 
        onClick={() => navigate("/create-post")}
      >
        <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Post
      </button>
    </div>
  );
};

export default ListPosts;
