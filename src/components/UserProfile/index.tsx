/** @format */

import { FC, useRef, useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usePosts } from "../../hooks/usePost";
import { Post } from "../../services/post-service";
import userService from "../../services/user-service";
import defaultAvatar from "../../assets/avatar.png";
import { Navigate, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const UserProfile: FC = () => {
  const { currentUser, updateAuthState, isAuthenticated, loading } = useAuth();
  const { posts } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [userNameError, setUserNameError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [localUser, setLocalUser] = useState<{
    _id?: string;
    email: string;
    userName: string;
    password?: string;
    imgUrl?: string;
    accessToken?: string;
    refreshToken?: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
      setUserName(currentUser.userName || "");
      setPassword("");
      setLocalUser({ ...currentUser });
    }
  }, [currentUser]);

  if (!loading && !isAuthenticated) return <Navigate to="/login" />;
  if (!localUser) return <div>Loading...</div>;

  const userPosts = posts.filter((post: Post) => post.owner === localUser._id);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data } = await userService.uploadImage(file);
      if (!localUser || !localUser._id) {
        console.error("User ID is missing. Cannot update user.");
        return;
      }
      const { request } = userService.updateUser(localUser._id, {
        imgUrl: data.url,
      });
      await request;
      setLocalUser((prev) => {
        if (!prev) return { email: "", userName: "", imgUrl: data.url };
        return {
          ...prev,
          imgUrl: data.url,
        };
      });

      await updateAuthState();
    } catch (error) {
      console.error("Image upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const validateFields = () => {
    let isValid = true;
    if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
      setEmailError("Please enter a valid email.");
      isValid = false;
    } else {
      setEmailError("");
    }
    if (userName.trim() === "") {
      setUserNameError("Username cannot be empty.");
      isValid = false;
    } else {
      setUserNameError("");
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      isValid = false;
    } else {
      setPasswordError("");
    }
    return isValid;
  };

  const handleLogoutClick = async () => {
    try {
      await userService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to logout user details:", error);
    }
  };

  const handleDeleteClick = async () => {
    try {
      if (!localUser || !localUser._id) return;
      const { request } = userService.deleteUser(localUser._id);
      await request;
      navigate("/login");
    } catch (error) {
      console.error("Failed to delete user details:", error);
    }
  };

  const handleSaveClick = async () => {
    if (!validateFields()) return;
    try {
      if (!localUser || !localUser._id) return;

      const updatedUserData = {
        email,
        userName,
        password,
      };

      const { request } = userService.updateUser(
        localUser._id,
        updatedUserData
      );

      const response = await request;
      const updatedUser = response.data;

      setLocalUser({
        ...localUser,
        email: updatedUser.email,
        userName: updatedUser.userName,
      });

      setIsEditing(false);
      await updateAuthState();
    } catch (error) {
      console.error("Failed to update user details:", error);
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
      <div className="card p-4">
        <div className="row align-items-center text-center text-md-start">
          <div className="col-md-3 text-center">
            <img
              src={localUser.imgUrl ? localUser.imgUrl : defaultAvatar}
              alt="Profile"
              className="rounded-circle img-thumbnail"
              style={{ width: "120px", height: "120px", cursor: "pointer" }}
              onClick={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              className="d-none"
              accept="image/*"
              onChange={handleFileChange}
            />
            {isUploading && <p className="text-primary mt-2">Uploading...</p>}
          </div>
          <div className="col-md-9">
            {!isEditing ? (
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
                  onClick={handleEditClick}
                  className="btn btn-primary pe-3 me-2">
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="btn btn-danger">
                  Delete
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="btn btn-secondary ms-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <label className="form-label">Username:</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="form-control"
                  />
                  {userNameError && (
                    <p className="text-danger">{userNameError}</p>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Email:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                  />
                  {emailError && <p className="text-danger">{emailError}</p>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Password:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    placeholder="Enter new password"
                  />
                  {passwordError && (
                    <p className="text-danger">{passwordError}</p>
                  )}
                </div>
                <button
                  onClick={handleSaveClick}
                  className="btn btn-success me-2">
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
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
                className="col-md-4 mb-3">
                <div className="card p-3">
                  <h5>{post.title}</h5>
                  <p>{post.content}</p>
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="img-fluid my-2"
                    />
                  )}
                  <p className="text-success">
                    {" "}
                    Likes {post.likes.length} | Comments {post.comments.length}
                  </p>
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
