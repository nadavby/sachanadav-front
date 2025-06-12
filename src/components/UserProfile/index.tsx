/* eslint-disable @typescript-eslint/no-explicit-any */
/** @format */

import { FC, useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUserItems } from "../../hooks/useItems";
import { useMatch } from "../../hooks/useMatch";
import { useMatchItems } from "../../hooks/useMatch";
import { Item } from "../../services/item-service";
import userService from "../../services/user-service";
import itemService from "../../services/item-service";
import defaultAvatar from "../../assets/avatar.png";
import { Navigate, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isValidPhoneNumber, formatPhoneNumber } from "../../utils/phoneUtils";
import { 
  faArrowLeft, 
  faImage, 
  faMapMarkerAlt,
  faCalendarAlt,
  faTag,
  faHandshake,
  faExchangeAlt,
  faCheckCircle,
  faSearch,
  faHandHoldingHeart
} from "@fortawesome/free-solid-svg-icons";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import "./styles.css";

interface Location {
  lat: number;
  lng: number;
}

interface UserData {
  _id: string;
  email: string;
  userName: string;
  phoneNumber?: string;
  imgURL?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
}

const profileFormSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  userName: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  phoneNumber: z.string().refine((val) => {
    return !val || isValidPhoneNumber(val);
  }, "Please enter a valid phone number").optional(),
  profileImage: z.instanceof(FileList).optional()
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

const UserProfile: FC = () => {
  const { currentUser, updateAuthState, isAuthenticated, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localUser, setLocalUser] = useState<UserData | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [tempImageURL, setTempImageUrl] = useState<string | null>(null);
  const [matchesWithItems, setMatchesWithItems] = useState<any[]>([]);
  const navigate = useNavigate();
  
  // Get user items
  const { items: Items, isLoading: itemsLoading, error: itemsError } = 
    useUserItems(currentUser?._id || "");

  // Get user matches
  const { matches, isLoading: matchesLoading, error: matchesError } = useMatch();

  // Get match items
  const matchIds = useMemo(() => {
    return matches.map(match => [match.item1Id, match.item2Id]).flat();
  }, [matches]);
  
  const { matchItems } = useMatchItems(matchIds);

  // Update matches with items when matchItems change
  useEffect(() => {
    if (!matches.length || !matchItems.length) {
      setMatchesWithItems([]);
      return;
    }
    
    const matchesWithDetails = matches.map(match => {
      const item1 = matchItems.find(item => item._id === match.item1Id);
      const item2 = matchItems.find(item => item._id === match.item2Id);

      return {
        ...match,
        item1,
        item2
      };
    });

    setMatchesWithItems(matchesWithDetails);
  }, [matches, matchItems]);

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
      email: currentUser?.email || "",
      userName: currentUser?.userName || "",
      password: "",
      phoneNumber: currentUser?.phoneNumber || ""
    }
  });

  const watchProfileImage = watch("profileImage");

  useEffect(() => {
    if (currentUser) {
      setLocalUser({
        _id: currentUser._id || "",
        email: currentUser.email || "",
        userName: currentUser.userName || "",
        phoneNumber: currentUser.phoneNumber,
        imgURL: currentUser.imgURL,
        password: currentUser.password,
        accessToken: currentUser.accessToken,
        refreshToken: currentUser.refreshToken
      });
    }
  }, [currentUser]);

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

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!localUser || !localUser._id) return;
    
    setIsUploading(true);
    
    try {
      const updatedUserData: Partial<UserData> = {
        email: data.email,
        userName: data.userName,
        phoneNumber: data.phoneNumber
      };
      
      if (data.password) {
        updatedUserData.password = data.password;
      }

      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        const imageData = await response.json();
        updatedUserData.imgURL = imageData.url;
      }
      
      const response = await fetch(`/api/users/${localUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedUserData)
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user");
      }
      
      const updatedUser = await response.json();
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

  const formatLocation = (location: string | Location): string => {
    if (typeof location === 'string') {
      return location;
    }
    return `${location.lat}, ${location.lng}`;
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
      
      {/* Profile Card */}
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

      {/* My Matches Section */}
      <div className="section-card mb-5">
        <div className="section-header">
          <h2 className="section-title">
            <FontAwesomeIcon icon={faHandshake} />
            <span>My Matches</span>
          </h2>
        </div>
        <div className="row g-4">
          {matchesWithItems.map((match) => (
            <div key={match._id} className="col-md-6 col-lg-4">
              <div className="match-card">
                <div className="match-items">
                  <div className="match-item">
                    <div className="match-item-image-container">
                      <img
                        src={match.item1?.imageUrl}
                        alt={match.item1?.name}
                        className="match-item-image"
                      />
                    </div>
                    <div className="match-item-details">
                      <h5>{match.item1?.name}</h5>
                      <p className="text-muted small">{match.item1?.category}</p>
                    </div>
                  </div>
                  <div className="match-connector">
                    <FontAwesomeIcon icon={faExchangeAlt} />
                  </div>
                  <div className="match-item">
                    <div className="match-item-image-container">
                      <img
                        src={match.item2?.imageUrl}
                        alt={match.item2?.name}
                        className="match-item-image"
                      />
                    </div>
                    <div className="match-item-details">
                      <h5>{match.item2?.name}</h5>
                      <p className="text-muted small">{match.item2?.category}</p>
                    </div>
                  </div>
                </div>
                <div className="match-actions">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => navigate(`/match-confirmation/${match._id}`)}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    Verify Match Details
                  </button>
                </div>
              </div>
            </div>
          ))}
          {matchesWithItems.length === 0 && (
            <div className="col-12">
              <div className="text-center py-5">
                <FontAwesomeIcon icon={faSearch} className="display-1 text-muted mb-4" />
                <p className="h4 text-muted">No matches found</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Lost Items Section */}
      <div className="section-card mb-5">
        <div className="section-header">
          <h2 className="section-title">
            <FontAwesomeIcon icon={faSearch} />
            <span>My Lost Items</span>
          </h2>
        </div>
        <div className="row g-4">
          {lostItems.map((item) => (
            <div key={item._id} className="col-sm-6 col-lg-4 col-xl-3">
              <div 
                className="item-card"
                onClick={() => navigate(`/item/${item._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-img-wrapper">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name || 'Unnamed Item'}
                    className="card-img-top"
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  {item.isResolved && (
                    <div className="badge-resolved">
                      Found
                    </div>
                  )}
                  <div className="card-overlay">
                    <h6 className="mb-1">{item.name}</h6>
                    <p className="mb-0 small">{item.description || 'No description'}</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="item-details">
                    <div className="detail">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                      {formatLocation(item.location) || 'Location not specified'}
                    </div>
                    <div className="detail">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                    <div className="detail">
                      <FontAwesomeIcon icon={faTag} className="me-2" />
                      {item.category || 'Uncategorized'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {lostItems.length === 0 && (
            <div className="col-12">
              <div className="text-center py-5">
                <FontAwesomeIcon icon={faSearch} className="display-1 text-muted mb-4" />
                <p className="h4 text-muted">No lost items</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Found Items Section */}
      <div className="section-card mb-5">
        <div className="section-header">
          <h2 className="section-title">
            <FontAwesomeIcon icon={faHandHoldingHeart} />
            <span>My Found Items</span>
          </h2>
        </div>
        <div className="row g-4">
          {foundItems.map((item) => (
            <div key={item._id} className="col-sm-6 col-lg-4 col-xl-3">
              <div 
                className="item-card"
                onClick={() => navigate(`/item/${item._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-img-wrapper">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name || 'Unnamed Item'}
                    className="card-img-top"
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  {item.isResolved && (
                    <div className="badge-resolved">
                      Returned
                    </div>
                  )}
                  <div className="card-overlay">
                    <h6 className="mb-1">{item.name}</h6>
                    <p className="mb-0 small">{item.description || 'No description'}</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="item-details">
                    <div className="detail">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                      {formatLocation(item.location) || 'Location not specified'}
                    </div>
                    <div className="detail">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                    <div className="detail">
                      <FontAwesomeIcon icon={faTag} className="me-2" />
                      {item.category || 'Uncategorized'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {foundItems.length === 0 && (
            <div className="col-12">
              <div className="text-center py-5">
                <FontAwesomeIcon icon={faHandHoldingHeart} className="display-1 text-muted mb-4" />
                <p className="h4 text-muted">No found items</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;