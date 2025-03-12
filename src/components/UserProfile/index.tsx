/** @format */
import { FC, useRef, useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usePosts } from "../../hooks/usePost";
import { Post } from "../../services/post-service";
import userService from "../../services/user-service";
import defaultAvatar from "../../assets/avatar.png";
import { Navigate } from "react-router-dom";

const UserProfile: FC = () => {
  const { currentUser, updateAuthState, isAuthenticated, loading } = useAuth();
  const { posts } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);

  // כש-`currentUser` משתנה, מעדכנים את הסטייטים של המייל והסיסמה
  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
      setPassword(""); // את הסיסמה נמחק בכל פעם שמבצעים את העדכון
    }
  }, [isSaved] );

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

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const validateFields = () => {
    let isValid = true;

    // בדיקת תקינות המייל
    if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
      setEmailError("Please enter a valid email.");
      isValid = false;
    } else {
      setEmailError("");
    }

    // בדיקת תקינות הסיסמה
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleSaveClick = async () => {
    if (!validateFields()) return;

    try {
      if (!currentUser || !currentUser._id) return;

      const updatedUserData = {
        email,
        password,
      };

      // עדכון פרטי המשתמש בשרת
      const data = await userService.updateUser(currentUser._id, updatedUserData);
      setIsSaved(true);
      // אם ההעדכון הצליח, נשמור את השינויים ונוודא שה-authState מעודכן
      if (data) {
        await updateAuthState();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update user details:", error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card p-4">
        <div className="row align-items-center text-center text-md-start">
          <div className="col-md-3 text-center">
            <img
              src={currentUser.imgUrl ? currentUser.imgUrl : defaultAvatar}
              alt="Profile"
              className="rounded-circle img-thumbnail"
              style={{ width: "120px", height: "120px", cursor: "pointer" }}
              onClick={() => fileInputRef.current?.click()}
            />
            <input ref={fileInputRef} type="file" className="d-none" accept="image/*" onChange={handleFileChange} />
            {isUploading && <p className="text-primary mt-2">Uploading...</p>}
          </div>
          <div className="col-md-9">
            {!isEditing ? (
              <>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Password:</strong> ********</p>
                <button onClick={handleEditClick} className="btn btn-primary">Edit</button>
              </>
            ) : (
              <>
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
                  {passwordError && <p className="text-danger">{passwordError}</p>}
                </div>
                <button onClick={handleSaveClick} className="btn btn-success me-2">Save</button>
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
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
