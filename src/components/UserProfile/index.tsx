/* eslint-disable @typescript-eslint/no-explicit-any */
/** @format */

import { FC, useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUserItems } from "../../hooks/useItems";
import { Item } from "../../services/item-service";
import userService from "../../services/user-service";
import itemService from "../../services/item-service";
import defaultAvatar from "../../assets/avatar.png";
import { Navigate, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isValidPhoneNumber, formatPhoneNumber } from 'react-phone-number-input';
import { 
  faArrowLeft, 
  faImage, 
  faMapMarkerAlt,
  faCalendarAlt,
  faTag
} from "@fortawesome/free-solid-svg-icons";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const profileFormSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  userName: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phoneNumber: z.string().refine((val) => {
    // Check if the phone number is valid using the library's validation
    return isValidPhoneNumber(val) || val === '';
  }, "Please enter a valid phone number"),
  profileImage: z.optional(z.instanceof(FileList))
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface UserData {
  _id?: string;
  email: string;
  userName: string;
  password?: string;
  phoneNumber?: string;
  imgURL?: string;
  accessToken?: string;
  refreshToken?: string;
}

const UserProfile: FC = () => {
  const { currentUser, updateAuthState, isAuthenticated, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localUser, setLocalUser] = useState<UserData | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [tempImageURL, setTempImageUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Get user items
  const { items: Items, isLoading: itemsLoading, error: itemsError } = 
    useUserItems(currentUser?._id || "");

  // Transform items to match the expected structure
  const items = (Items as Item[]).map((item:Item) => ({
    _id: item._id,
    name: item.name,
    description: item.description,
    category: item.category,
    location: item.location ,
    date: item.date,
    itemType: (item.itemType) as 'lost' | 'found',
    imageUrl: item.imageUrl, 
    userId: item.userId,
    ownerName: item.ownerName,
    ownerEmail: item.ownerEmail,
    isResolved: item.isResolved ,
   matchId: item.matchedId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }));

  const lostItems = items.filter(item => (item.itemType).toLowerCase() === 'lost');
  const foundItems = items.filter(item => (item.itemType ).toLowerCase() === 'found');

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
      password: "",
      phoneNumber: ""
    }
  });

  const watchProfileImage = watch("profileImage");

  useEffect(() => {
    if (currentUser) {
      setLocalUser({ ...currentUser });
      setValue("email", currentUser.email);
      setValue("userName", currentUser.userName || "");
      setValue("password", ""); 
      setValue("phoneNumber", currentUser.phoneNumber || "");
    }
  }, [currentUser, setValue]);

  useEffect(() => {
    if (watchProfileImage && watchProfileImage.length > 0) {
      const file = watchProfileImage[0];
      setSelectedImage(file);
      
      // Create and set the temporary URL for preview
      const newTempUrl = URL.createObjectURL(file);
      setTempImageUrl(newTempUrl);
      
      // Cleanup function to revoke the object URL
      return () => {
        URL.revokeObjectURL(newTempUrl);
      };
    }
  }, [watchProfileImage]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!localUser || !localUser._id) return;
    
    setIsUploading(true);
    
    try {
      const updatedUserData: Partial<UserData> = {
        email: data.email,
        userName: data.userName,
        phoneNumber: data.phoneNumber
      };
      
      if (data.password && data.password.length >= 8) {
        updatedUserData.password = data.password;
      }

      if (data.phoneNumber && isValidPhoneNumber(data.phoneNumber)) {
        updatedUserData.phoneNumber = data.phoneNumber;
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
      setValue("phoneNumber", localUser.phoneNumber || "");
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
        window.location.href = "/login";
      } catch (error) {
        console.error("Failed to delete user account:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await userService.logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const { request } = itemService.deleteItem(itemId);
      await request;
      window.location.reload();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const formatLocation = (location: any): string => {
    if (!location) return "Unknown location";
    
    if (typeof location === 'string') return location;
    
    if (location && typeof location === 'object') {
      if (location.lat !== undefined && location.lng !== undefined) {
        return `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`;
      }
    }
    
    return String(location);
  };

  if (!loading && !isAuthenticated) return <Navigate to="/login" />;
  if (!localUser) return <div>Loading...</div>;

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
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
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
                  <p>
                    <strong>Phone Number:</strong> {localUser.phoneNumber ? formatPhoneNumber(localUser.phoneNumber) : "Not set"}
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
                  
                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label">Phone Number:</label>
                    <input
                      id="phoneNumber"
                      {...register("phoneNumber")}
                      type="tel"
                      className={`form-control ${errors.phoneNumber ? "is-invalid" : ""}`}
                    />
                    {errors.phoneNumber && (
                      <div className="invalid-feedback">{errors.phoneNumber.message}</div>
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
        <h3>My Lost Items</h3>
        {itemsLoading ? (
          <p>Loading items...</p>
        ) : itemsError ? (
          <p className="alert alert-danger">Error loading items: {itemsError}</p>
        ) : lostItems.length === 0 ? (
          <p className="alert alert-info">No lost items reported</p>
        ) : (
          <div className="row">
            {lostItems.map((item: Item) => (
              <div key={item._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card shadow-sm h-100">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      className="card-img-top" 
                      alt={item.name}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-text">{item.description}</h5>
                    <div className="mt-auto">
                      <p className="card-text mb-1">
                        <FontAwesomeIcon icon={faTag} className="me-2 text-secondary" />
                        {item.category}
                      </p>
                      <p className="card-text mb-1">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-danger" />
                        {formatLocation(item.location)}
                      </p>
                      <p className="card-text">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-info" />
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                  <div className="card-footer bg-transparent d-flex justify-content-between">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/item/${item._id}`)}
                    >
                      View Details
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteItem(item._id!)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h3>My Found Items</h3>
        {itemsLoading ? (
          <p>Loading items...</p>
        ) : itemsError ? (
          <p className="alert alert-danger">Error loading items: {itemsError}</p>
        ) : foundItems.length === 0 ? (
          <p className="alert alert-info">No found items reported</p>
        ) : (
          <div className="row">
            {foundItems.map((item: Item) => (
              <div key={item._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card shadow-sm h-100">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      className="card-img-top" 
                      alt={item.name}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-text">{item.description}</h5>
                    <div className="mt-auto">
                      <p className="card-text mb-1">
                        <FontAwesomeIcon icon={faTag} className="me-2 text-secondary" />
                        {item.category}
                      </p>
                      <p className="card-text mb-1">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-danger" />
                        {formatLocation(item.location)}
                      </p>
                      <p className="card-text">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-info" />
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                  <div className="card-footer bg-transparent d-flex justify-content-between">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/item/${item._id}`)}
                    >
                      View Details
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteItem(item._id!)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="my-4 text-center">
        <button 
          className="btn btn-success btn-lg"
          onClick={() => navigate("/upload-item")}
        >
          <FontAwesomeIcon icon={faImage} className="me-2" />
          Upload New Item
        </button>
      </div>
    </div>
  );
};

export default UserProfile;