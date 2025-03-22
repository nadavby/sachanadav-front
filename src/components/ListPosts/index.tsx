import { FC, useState } from "react";
import { usePosts } from "../../hooks/usePost";
import { useAuth } from "../../hooks/useAuth";
import { Post } from "../../services/post-service";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faUser,
  faSignInAlt,
  faThumbsUp,
  faPlus,
  faEdit,
  faTrash,
  faRobot,
  faSort,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";
import postService from "../../services/post-service";

type SortOption = 'newest' | 'oldest' | 'mostLiked' | 'leastLiked';

const ListPosts: FC = () => {
  const { posts, isLoading, error, setPosts } = usePosts();
  const { isAuthenticated, loading: authLoading, currentUser } = useAuth();
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!authLoading && !isAuthenticated) {
    navigate("/login");
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

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await postService.deletePost(postId);
      setPosts((prevPosts: Post[]) =>
        prevPosts.filter((post) => post._id !== postId)
      );
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setDropdownOpen(false);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSortedPosts = () => {
    if (!posts) return [];
    
    const postsCopy = [...posts];
    
    switch (sortOption) {
      case 'newest':
        return postsCopy.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      case 'oldest':
        return postsCopy.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
          return dateA.getTime() - dateB.getTime();
        });
      case 'mostLiked':
        return postsCopy.sort((a, b) => b.likes.length - a.likes.length);
      case 'leastLiked':
        return postsCopy.sort((a, b) => a.likes.length - b.likes.length);
      default:
        return postsCopy;
    }
  };

  const sortedPosts = getSortedPosts();
  const getSortOptionText = () => {
    switch (sortOption) {
      case 'newest': return 'Newest';
      case 'oldest': return 'Oldest';
      case 'mostLiked': return 'Most Liked';
      case 'leastLiked': return 'Least Liked';
      default: return 'Sort by';
    }
  };

  return (
    <div className="container mt-3">
      <div className="d-flex justify-content-between mb-3">
        {!authLoading &&
          (isAuthenticated ? (
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/profile")}>
              <FontAwesomeIcon icon={faUser} className="me-2" /> My Profile
            </button>
          ) : (
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/login")}>
              <FontAwesomeIcon icon={faSignInAlt} className="me-2" /> Login
            </button>
          ))}
          <h1 className="text-center">TripBuddy✈️</h1>
        <button
          className="btn btn-info"
          onClick={() => navigate("/chatbot")}>
          <FontAwesomeIcon icon={faRobot} className="me-2" /> Chatbot
        </button>
      </div>
      <div className="mb-4 position-relative">
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-outline-secondary dropdown-toggle" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <FontAwesomeIcon icon={faSort} className="me-2" />
            {getSortOptionText()}
            <FontAwesomeIcon icon={faCaretDown} className="ms-2" />
          </button>
        </div>
        {dropdownOpen && (
          <div className="dropdown-menu show position-absolute mt-1">
            <button 
              className="dropdown-item"
              onClick={() => handleSortChange('newest')}>
              Newest
            </button>
            <button 
              className="dropdown-item"
              onClick={() => handleSortChange('oldest')}>
              Oldest
            </button>
            <button 
              className="dropdown-item"
              onClick={() => handleSortChange('mostLiked')}>
              Most Liked
            </button>
            <button 
              className="dropdown-item"
              onClick={() => handleSortChange('leastLiked')}>
              Least Liked
            </button>
          </div>
        )}
      </div>

      {error && <p className="alert alert-danger">Error: {error}</p>}
      {isLoading && !error && <p>Loading...</p>}
      {!isLoading && posts.length === 0 && !error && (
        <p className="alert alert-warning">No posts available.</p>
      )}

      {posts.length > 0 && (
        <div className="row">
          {sortedPosts.map((post: Post) => (
            <div key={post._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                <h5 className="card-title text-center">{post.title}</h5>
                <p className="card-text flex-grow-1">{post.content}</p>
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="img-fluid my-2"
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                  )}
                  <p className="text-muted mb-2">Author: {post.owner}</p>
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    <button
                      className={`btn btn-sm d-flex align-items-center gap-2 ${
                        user?._id && post.likes.includes(user._id)
                          ? "btn-danger"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => handleLike(post._id)}>
                      <FontAwesomeIcon icon={faThumbsUp} />
                      {post.likes.length}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
                      onClick={() =>
                        navigate("/comments", {
                          state: { comments: post.comments, postId: post._id },
                        })
                      }>
                      <FontAwesomeIcon icon={faComment} />
                      {post.comments.length}
                    </button>
                    
                    {user?.userName === post.owner && (
                      <>
                        <button
                          className="btn btn-sm btn-warning d-flex align-items-center gap-2"
                          onClick={() => navigate(`/update-post/${post._id}`)}>
                          <FontAwesomeIcon icon={faEdit} /> Update
                        </button>
                        <button
                          className="btn btn-sm btn-danger d-flex align-items-center gap-2"
                          onClick={() => handleDelete(post._id)}>
                          <FontAwesomeIcon icon={faTrash} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                  <div className="d-flex justify-content-between mt-auto">
                    <small className="text-muted fst-italic">
                      Created: {formatDate(post.createdAt)}
                    </small>
                    {post.updatedAt && 
                     (!post.createdAt || 
                      (post.updatedAt instanceof Date && post.createdAt instanceof Date && 
                       post.updatedAt.getTime() !== post.createdAt.getTime()) ||
                      (!(post.updatedAt instanceof Date) && !(post.createdAt instanceof Date) && 
                       new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime())
                     ) && (
                      <small className="text-muted fst-italic">
                        Updated: {formatDate(post.updatedAt)}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary position-fixed bottom-0 start-0 m-3" onClick={() => setPosts([...posts])}>
        Refresh
      </button>
      <button
        className="btn btn-success position-fixed bottom-0 end-0 m-3"
        onClick={() => navigate("/create-post")}>
        <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Post
      </button>
    </div>
  );
};

export default ListPosts;