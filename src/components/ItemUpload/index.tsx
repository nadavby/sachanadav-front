/** @format */

import { FC, useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import itemService, { Item } from "../../services/item-service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faCamera,
  faArrowLeft,
  faTag,
  faMapMarkerAlt,
  faCalendarAlt
} from "@fortawesome/free-solid-svg-icons";
import { itemCategories, ItemCategoryGroup } from "../../data/itemCategories";

const ItemUpload: FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    categoryLabel: "",
    location: "",
    date: new Date().toISOString().split('T')[0],
    itemType: "lost" as "lost" | "found",
  });
  
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<ItemCategoryGroup | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<any[] | null>(null);
  const [otherCategory, setOtherCategory] = useState<string>("");

  if (!loading && !isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleCategoryGroupChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const groupLabel = e.target.value;
    const group = itemCategories.find(g => g.label === groupLabel) || null;
    setSelectedCategoryGroup(group);
    setFormData({
      ...formData,
      category: "",
      categoryLabel: "",
      name: ""
    });
    setOtherCategory("");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "category") {
      const selectedOption = selectedCategoryGroup?.options.find(option => option.value === value);
      
      setFormData({
        ...formData,
        category: value,
        categoryLabel: selectedOption?.label || value,
        name: selectedOption?.label || value // Set the name to match the selected category item
      });
      
      if (value !== "other") {
        setOtherCategory("");
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleOtherCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherCategory(value);
    setFormData({
      ...formData,
      category: "other",
      categoryLabel: value || "Other",
      name: value || "Other"
    });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !currentUser._id) {
      setError("You must be logged in to upload an item");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Enhanced logging for debugging token issues
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      console.log("Access token exists:", !!token);
      console.log("Access token length:", token ? token.length : 0);
      if (token) {
        console.log("Access token format check:", 
          token.startsWith("ey") ? "JWT format detected" : "Unexpected token format");
        
        try {
          // Try to decode the token payload to check format
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log("Token payload contains:", Object.keys(payload));
          console.log("Token expiry:", new Date(payload.exp * 1000).toISOString());
          console.log("Current time:", new Date().toISOString());
          console.log("Token expired:", payload.exp * 1000 < Date.now());
        } catch (e) {
          console.error("Error decoding token:", e);
        }
      }
      
      console.log("Refresh token exists:", !!refreshToken);
      console.log("Current user info:", {
        id: currentUser._id, 
        hasId: !!currentUser._id,
        userLoaded: !!currentUser
      });
      
      if (!token) {
        setError("Authentication error: No access token found. Please log in again.");
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      // Debug logs
      console.log("Form data being sent:", {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        date: formData.date,
        itemType: formData.itemType,
        owner: currentUser._id,
        hasImage: !!uploadedImage
      });
      
      // Create the new item object
      const newItem: Omit<Item, '_id'> = {
        ...formData,
        owner: currentUser._id,
      };
      
      console.log("Calling itemService.addItem with user ID:", currentUser._id);
      const response = await itemService.addItem(newItem, uploadedImage || undefined);
      
      console.log("Item upload successful:", response.data);
      
      // If there are match results, set them
      if (response.data.matchResults && response.data.matchResults.length > 0) {
        setMatchResults(response.data.matchResults);
      } else {
        // Navigate based on item type if no matches
        if (formData.itemType === 'lost') {
          navigate('/lost-items');
        } else {
          navigate('/found-items');
        }
      }
    } catch (err: any) {
      console.error("Error uploading item:", err);
      
      // Check for specific authentication errors
      if (err.response?.status === 401) {
        setError("Authentication error: Your session may have expired. Please log in again.");
        // Force logout and redirect to login after a short delay
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 500) {
        // Log detailed information about the 500 error
        console.error("Server error details:", {
          data: err.response.data,
          headers: err.response.headers,
          config: {
            url: err.config.url,
            method: err.config.method,
            headers: err.config.headers,
          }
        });
        
        // Try to extract HTML error message if present
        if (typeof err.response.data === 'string' && err.response.data.includes('<pre>')) {
          const errorMessage = err.response.data.match(/<pre>(.*?)<\/pre>/s);
          if (errorMessage && errorMessage[1]) {
            console.error("Server error details:", errorMessage[1].trim());
            setError(`Server error: ${errorMessage[1].trim().split('\n')[0]}`);
          } else {
            setError(`Server error (500): ${err.message}`);
          }
        } else {
          setError(`Server error (500): ${err.message}`);
        }
      } else if (err.response) {
        setError(`Error ${err.response.status}: ${err.response.data?.message || err.response.data || err.message}`);
      } else if (err.request) {
        setError("No response from server. Please check your connection.");
      } else {
        setError(`Failed to upload item: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-4">
        <button
          className="btn btn-outline-secondary me-3"
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h1 className="mb-0">Upload {formData.itemType === 'lost' ? 'Lost' : 'Found'} Item</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {matchResults ? (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="card-title">Match Results</h2>
            <p className="card-text">
              We found potential matches for your {formData.itemType} item!
            </p>
            
            <div className="row">
              {matchResults.map((match) => (
                <div key={match._id} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100">
                    {match.itemImgURL && (
                      <img
                        src={match.itemImgURL}
                        className="card-img-top"
                        alt={match.itemName}
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                    )}
                    <div className="card-body">
                      <h5 className="card-title">{match.itemName}</h5>
                      <p className="card-text">{match.itemDescription}</p>
                      <p className="card-text">
                        <small className="text-muted">
                          Similarity: {(match.similarity * 100).toFixed(2)}%
                        </small>
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/item/${match.matchedItemId}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <button 
                className="btn btn-outline-secondary me-3"
                onClick={() => navigate(formData.itemType === 'lost' ? '/lost-items' : '/found-items')}
              >
                Go to {formData.itemType === 'lost' ? 'Lost' : 'Found'} Items
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <h5 className="card-title mb-4">Item Information</h5>
                  
                  <div className="mb-3">
                    <label htmlFor="itemType" className="form-label">Lost/Found</label>
                    <select
                      id="itemType"
                      name="itemType"
                      className="form-select"
                      value={formData.itemType}
                      onChange={handleChange}
                      required
                    >
                      <option value="lost">Lost Item</option>
                      <option value="found">Found Item</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="categoryGroup" className="form-label">
                      <FontAwesomeIcon icon={faTag} className="me-2 text-secondary" />
                      Category Group
                    </label>
                    <select
                      className="form-select"
                      id="categoryGroup"
                      value={selectedCategoryGroup?.label || ""}
                      onChange={handleCategoryGroupChange}
                      required
                    >
                      <option value="">Select a category group</option>
                      {itemCategories.map((group) => (
                        <option key={group.label} value={group.label}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategoryGroup && (
                    <div className="mb-3">
                      <label htmlFor="category" className="form-label">Item Type</label>
                      <select
                        className="form-select"
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select an item type</option>
                        {selectedCategoryGroup.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.category === "other" && (
                    <div className="mb-3">
                      <label htmlFor="otherCategory" className="form-label">
                        Specify Item Type
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="otherCategory"
                        value={otherCategory}
                        onChange={handleOtherCategoryChange}
                        placeholder="Please specify the item type"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the item in detail"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="location" className="form-label">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-danger" />
                      Location
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Where was the item lost/found?"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-info" />
                      Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <h5 className="card-title mb-4">Item Photo</h5>
                  
                  <div className="mb-3">
                    <label htmlFor="image" className="form-label">Upload Image</label>
                    <input
                      type="file"
                      className="form-control"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <small className="form-text text-muted">
                      An image helps in identifying the item.
                    </small>
                  </div>
                  
                  {imagePreview && (
                    <div className="mb-3 text-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="img-thumbnail"
                        style={{ maxHeight: "300px" }}
                      />
                    </div>
                  )}
                  
                  {!imagePreview && (
                    <div className="text-center py-5 border rounded mb-3">
                      <FontAwesomeIcon icon={faCamera} size="3x" className="text-secondary mb-3" />
                      <p className="text-muted">No image uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="d-grid gap-2 col-md-6 mx-auto mb-4">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </span>
              ) : (
                <span>
                  <FontAwesomeIcon icon={faUpload} className="me-2" />
                  Upload {formData.itemType === 'lost' ? 'Lost' : 'Found'} Item
                </span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ItemUpload; 