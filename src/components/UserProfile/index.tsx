/** @format */

import { FC, useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usePosts } from "../../hooks/usePost";
import { Post } from "../../services/post-service";
import userService from "../../services/user-service";
import postService from "../../services/post-service";
import defaultAvatar from "../../assets/avatar.png";
import { Navigate, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faImage, 
  faThumbsUp, 
  faComment, 
  faEdit, 
  faTrash 
} from "@fortawesome/free-solid-svg-icons";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const profileFormSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  userName: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  profileImage: z.optional(z.instanceof(FileList))
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface UserData {
  _id?: string;
  email: string;
  userName: string;
  password?: string;
  imgURL?: string;
  accessToken?: string;
  refreshToken?: string;
}

const UserProfile: FC = () => {
  const { currentUser, updateAuthState, isAuthenticated, loading } = useAuth();
  const { posts, setPosts } = usePosts();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localUser, setLocalUser] = useState<UserData | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [tempImageURL, setTempImageUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: "",
      userName: "",
      password: ""
    }
  });

  const watchProfileImage = watch("profileImage");

  useEffect(() => {
    if (currentUser) {
      setLocalUser({ ...currentUser });
      setValue("email", currentUser.email);
      setValue("userName", currentUser.userName || "");
      setValue("password", ""); 
    }
  }, [currentUser, setValue]);

  useEffect(() => {
    if (watchProfileImage && watchProfileImage.length > 0) {
      const file = watchProfileImage[0];
      setSelectedImage(file);
      setTempImageUrl(URL.createObjectURL(file));
      
      return () => {
        if (tempImageURL) URL.revokeObjectURL(tempImageURL);
      };
    }
  }, [watchProfileImage]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!localUser || !localUser._id) return;
    
    setIsUploading(true);
    
    try {
      const updatedUserData: Partial<UserData> = {
        email: data.email,
        userName: data.userName
      };
      
      if (data.password && data.password.length >= 8) {
        updatedUserData.password = data.password;
      }
      
      if (selectedImage) {
        const { data: imageData } = await userService.uploadImage(selectedImage);
        updatedUserData.imgURL = imageData.url;
      }
      
      const { request } = userService.updateUser(localUser._id, updatedUserData);
      const response = await request;
      const updatedUser = response.data;
      console.log("User updated:", updatedUser);
      setLocalUser({
        ...localUser,
        ...updatedUserData,
        imgURL: updatedUserData.imgURL || localUser.imgURL
      });
      setSelectedImage(null);
      setTempImageUrl(null);
      setIsEditing(false);
      
      await updateAuthState();
    } catch (error) {
      console.error("Failed to update user details:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelEdit = () => {
    if (localUser) {
      setValue("email", localUser.email);
      setValue("userName", localUser.userName || "");
      setValue("password", "");
    }
    setSelectedImage(null);
    setTempImageUrl(null);
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (!localUser || !localUser._id) return;
    
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        const { request } = userService.deleteUser(localUser._id);
        await request;
        navigate("/login");
      } catch (error) {
        console.error("Failed to delete user account:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await userService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!localUser || typeof localUser._id !== "string") {
      console.error("User is not valid:", localUser);
      return;
    }

    try {
      await postService.likePost(postId);
      setPosts((prevPosts: Post[]) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            const hasLiked = localUser._id ? post.likes.includes(localUser._id) : false;

            return {
              ...post,
              likes: hasLiked
                ? post.likes.filter((id) => id !== localUser._id)
                : [...post.likes, localUser._id],
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

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!loading && !isAuthenticated) return <Navigate to="/login" />;
  if (!localUser) return <div>Loading...</div>;
  const userPosts = posts.filter((post: Post) => post.owner === localUser.userName);

  const { ref: profileImageRef, ...profileImageRest } = register("profileImage");

  return (
    <div className="container mt-4">
      <button
        className="btn btn-outline-primary mb-3"
        onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
        Back
      </button>
      
      <div className="card p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row align-items-center text-center text-md-start">
            <div className="col-md-3 text-center position-relative">
              <img
                src={tempImageURL || localUser.imgURL || defaultAvatar}
                alt="Profile"
                className="rounded-circle img-thumbnail"
                style={{ width: "120px", height: "120px", objectFit: "cover" }}
              />
              
              {isEditing && (
                <div className="position-absolute bottom-0 end-0" style={{ marginRight: "30%" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-circle"
                    onClick={() => document.getElementById("profileImageInput")?.click()}
                  >
                    <FontAwesomeIcon icon={faImage} />
                  </button>
                  <input
                    id="profileImageInput"
                    {...profileImageRest}
                    ref={(e) => {
                      profileImageRef(e);
                    }}
                    type="file"
                    className="d-none"
                    accept="image/jpeg,image/png"
                    disabled={!isEditing}
                  />
                </div>
              )}
              
              {isUploading && <p className="text-primary mt-2">Uploading...</p>}
            </div>
            
            <div className="col-md-9">
              {!isEditing ? (
                // Read-only view
                <>
                  <p>
                    <strong>Username:</strong> {localUser.userName || "Not set"}
                  </p>
                  <p>
                    <strong>Email:</strong> {localUser.email}
                  </p>
                  <p>
                    <strong>Password:</strong> ********
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary me-2">
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="btn btn-danger">
                    Delete Account
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-secondary ms-2">
                    Logout
                  </button>
                </>
              ) : (
                // Edit mode
                <>
                  <div className="mb-3">
                    <label htmlFor="userName" className="form-label">Username:</label>
                    <input
                      id="userName"
                      {...register("userName")}
                      type="text"
                      className={`form-control ${errors.userName ? "is-invalid" : ""}`}
                    />
                    {errors.userName && (
                      <div className="invalid-feedback">{errors.userName.message}</div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email:</label>
                    <input
                      id="email"
                      {...register("email")}
                      type="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email.message}</div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">New Password:</label>
                    <input
                      id="password"
                      {...register("password")}
                      type="password"
                      className={`form-control ${errors.password ? "is-invalid" : ""}`}
                      placeholder="Enter new password"
                    />
                    {errors.password && (
                      <div className="invalid-feedback">{errors.password.message}</div>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-success me-2"
                    disabled={isUploading}>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn btn-secondary">
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
      
      <div className="mt-4">
        <h3>My Posts</h3>
        {userPosts.length === 0 ? (
          <p className="alert alert-info">No posts yet</p>
        ) : (
          <div className="row">
            {userPosts.map((post) => (
              <div
                key={post._id}
                className="col-md-6 col-lg-4 mb-4">
                <div className="card shadow-sm h-100">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title text-center">{post.title}</h5>
                    <p className="card-text flex-grow-1">{post.content}</p>
                    <div className="image-container" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="img-fluid my-2"
                          style={{ height: "200px", objectFit: "cover", width: "100%" }}
                        />
                      ) : (
                        <div className="no-image-placeholder" style={{ height: "200px", width: "100%", backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="text-muted">No image</span>
                        </div>
                      )}
                    </div>
                    <p className="text-muted mb-2">Author: {post.owner}</p>
                    <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                      <button
                        className={`btn btn-sm d-flex align-items-center gap-2 ${
                          localUser._id && post.likes.includes(localUser._id)
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
      </div>
    </div>
  );
};

export default UserProfile;