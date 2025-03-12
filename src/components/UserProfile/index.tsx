/** @format */
import { FC, useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usePosts } from "../../hooks/usePost";
import { Post } from "../../services/post-service";
import userService from "../../services/user-service";
import defaultAvatar from "../../assets/avatar.png";
import { Navigate } from "react-router-dom";

const UserProfile: FC = () => {
  const { currentUser, updateAuthState, isAuthenticated, loading } = useAuth();
  const { posts } = usePosts();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!loading && !isAuthenticated) return <Navigate to="/login" />;
  if (!currentUser) return <div>Loading...</div>;

  const userPosts = posts.filter((post: Post) => post.owner === currentUser._id);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data } = await userService.uploadImage(file);
      if (!currentUser || !currentUser._id) {
        console.error("User ID is missing. Cannot update user.");
        return;
      }
      await userService.updateUser(currentUser._id, { imgUrl: data.url });
      await updateAuthState();
    } catch (error) {
      console.error("Image upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card p-4">
        <div className="text-center">
          <img
            src={currentUser.imgUrl? currentUser.imgUrl : defaultAvatar}
            alt="Profile"
            className="rounded-circle"
            style={{ width: "120px", height: "120px", cursor: "pointer" }}
            onClick={() => fileInputRef.current?.click()}
          />
          <input ref={fileInputRef} type="file" className="d-none" accept="image/*" onChange={handleFileChange} />
          {isUploading && <p className="text-primary">Uploading...</p>}

          <h4 className="mt-2">{currentUser.email || "User"}</h4>
        </div>
      </div>

      <div className="mt-4">
        <h3>My Posts</h3>
        {userPosts.length === 0 ? (
          <p className="alert alert-info">No posts yet</p>
        ) : (
          <div className="row">
            {userPosts.map((post) => (
              <div key={post._id} className="col-md-4 mb-3">
                <div className="card p-3">
                  <h5>{post.title}</h5>
                  {post.image && <img src={post.image} alt={post.title} className="img-fluid my-2" />}
                  <p>{post.content}</p>
                  <p className="text-success">{post.likes.length} Likes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;