/* eslint-disable @typescript-eslint/no-explicit-any */
/** @format */

import { FC, useState, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import itemService from "../../services/item-service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faCamera,
  faArrowLeft,
  faTag,
  faMapMarkerAlt,
  faCalendarAlt,
  faLocationCrosshairs
} from "@fortawesome/free-solid-svg-icons";
import { itemCategories, ItemCategoryGroup } from "../../data/itemCategories";
import { useLoadScript } from "@react-google-maps/api";
import { itemColors } from "../../data/itemColors";
import { getAvailableMaterials } from "../../data/ItemMaterials";


interface Location {
  lat: number;
  lng: number;
}

interface ItemFormData {
  kind: "lost" | "found";
  categoryGroup: string;
  itemType: string;
  otherItemType?: string;
  description: string;
  colors?: string[];
  brand?: string;
  condition?: string;
  flaws?: string;
  material?: string;
  date: string;
  location: Location;
}

const defaultLocation = {
  lat: 32.0853, 
  lng: 34.7818
};

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  marginBottom: "1rem",
  borderRadius: "0.5rem"
};

const libraries = ["places"];

const ItemUpload: FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loading } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  
  const [apiKey] = useState("AIzaSyAlx_vvH0P5fepk8bHpzO54syb5heCvJXI");
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: libraries as any
  });

  const [formData, setFormData] = useState<ItemFormData>({
    kind: "lost",
    categoryGroup: "",
    itemType: "",
    otherItemType: "",
    description: "",
    colors: [],
    brand: "",
    condition: "",
    flaws: "",
    material: "",
    date: new Date().toISOString().split('T')[0],
    location: defaultLocation
  });
  
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<ItemCategoryGroup | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedItemName, setUploadedItemName] = useState<string | null>(null);
  const [otherCategory, setOtherCategory] = useState<string>("");
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (isLoaded && !loadError && mapContainerRef.current && !mapInitialized) {
      try {
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: formData.location,
          zoom: 13,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true
        });
        
        const marker = new window.google.maps.Marker({
          position: formData.location,
          map: map,
          draggable: true
        });
        
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            marker.setPosition(e.latLng);
            setFormData(prev => ({
              ...prev,
              location: {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              }
            }));
          }
        });
        
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) {
            setFormData(prev => ({
              ...prev,
              location: {
                lat: position.lat(),
                lng: position.lng()
              }
            }));
          }
        });
        
        googleMapRef.current = map;
        markerRef.current = marker;
        setMapInitialized(true);
      } catch (err) {
        console.error("Error initializing Google Map:", err);
        setError("Failed to initialize the map. Please try again later.");
      }
    }
  }, [isLoaded, loadError, mapInitialized, formData.location]);
  
  useEffect(() => {
    if (mapInitialized && markerRef.current) {
      markerRef.current.setPosition(formData.location);
      googleMapRef.current?.setCenter(formData.location);
    }
  }, [formData.location, mapInitialized]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setFormData(prev => ({
            ...prev,
            location: newLocation
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Could not get your current location. Please select manually on the map.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser. Please select location manually on the map.");
    }
  };

  if (!loading && !isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleCategoryGroupChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const groupLabel = e.target.value;
    const group = itemCategories.find(g => g.label === groupLabel) || null;
    setSelectedCategoryGroup(group);
    setFormData(prev => ({
      ...prev,
      categoryGroup: groupLabel,
      itemType: ""
    }));
    setOtherCategory("");
    const materials = getAvailableMaterials(groupLabel);
    setAvailableMaterials(materials);
  };
  
  const handleColorChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedColor = e.target.value;
    if (selectedColor && !selectedColors.includes(selectedColor)) {
      const newColors = [...selectedColors, selectedColor];
      setSelectedColors(newColors);
      setFormData(prev => ({
        ...prev,
        colors: newColors
      }));
    }
    // Reset the select to show placeholder
    e.target.value = "";
  };
  
  const removeColor = (colorToRemove: string) => {
    const newColors = selectedColors.filter(color => color !== colorToRemove);
    setSelectedColors(newColors);
    setFormData(prev => ({
      ...prev,
      colors: newColors
    }));
  };
  
  const getColorDisplay = (colorValue: string) => {
    const color = itemColors.find(c => c.value === colorValue);
    return color ? color.label : colorValue;
  };

  const getColorHex = (colorValue: string) => {
    const color = itemColors.find(c => c.value === colorValue);
    return color?.hexCode;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "category") {
      setFormData(prev => ({
        ...prev,
        itemType: value
      }));
      
      if (value !== "other") {
        setOtherCategory("");
      }
    } else if (name === "itemType") {
      setFormData(prev => ({
        ...prev,
        kind: value as "lost" | "found"
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleOtherCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherCategory(value);
    setFormData(prev => ({
      ...prev,
      itemType: "other",
      otherItemType: value || "Other"
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedImage(file);
      
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
      const submitData = new FormData();
      
      const itemName = formData.itemType === "other" && otherCategory ? otherCategory : formData.itemType;
      submitData.append('name', itemName);
      submitData.append('description', formData.description);
      submitData.append('category', formData.categoryGroup);
      submitData.append('colors', formData.colors?.join(', ') || '');
      submitData.append('brand', formData.brand || '');
      submitData.append('condition', formData.condition || '');
      submitData.append('flaws', formData.flaws || '');
      submitData.append('material', formData.material || '');
      submitData.append('location', formData.location ? JSON.stringify(formData.location) : '');
      submitData.append('date', formData.date);
      submitData.append('itemType', formData.kind); 
      submitData.append('owner', currentUser._id);
      
      if (uploadedImage) {
        submitData.append('image', uploadedImage);
      }
      
      const response = await itemService.addItem(submitData);
      
      console.log("Item upload response:", {
        fullResponse: response,
        data: response.data,
        nestedData: response.data?.data,
        nestedId: response.data?.data?._id
      });
      
      let uploadedId = null;
      let matchResultsData = null;
      
      if (response.data?.data?.id) {
        uploadedId = response.data.data.id;
        matchResultsData = response.data.matchResults;
      } 
      
      if (uploadedId) {
        setUploadedItemName(itemName);
        
        console.log("Successfully extracted item ID:", uploadedId);
      } else {
        console.error("Could not find item ID in response:", response);
      }
      
      if (matchResultsData && matchResultsData.length > 0) {
        const formattedMatches = matchResultsData.map((match: any) => ({
          matchedItemId: match.item._id || match.item.id || match._id || match.id,
          similarity: match.score / 100, 
          itemName: match.item.name || match.itemName || match.name,
          itemDescription: match.item.description || match.itemDescription || match.description,
          itemImgURL: match.item.imgURL || match.item.imageUrl || match.imgURL || match.imageUrl,
          ownerName: match.item.ownerName || match.ownerName,
          ownerEmail: match.item.ownerEmail || match.ownerEmail
        }));

        // Log modal props before showing
        console.log("Showing modal with props:", {
          showMatchesModal: true,
          uploadedItemId: uploadedId,
          uploadedItemName,
          matchResults: formattedMatches
        });
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      console.error("Error uploading item:", err);
      
      if (err.response?.status === 401) {
        setError("Authentication error: Your session may have expired. Please log in again.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to upload item");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-4">
        <button
          className="btn btn-outline-secondary me-3"
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h1 className="mb-0">Upload {formData.kind === 'lost' ? 'Lost' : 'Found'} Item</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

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
                    value={formData.kind}
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
                      value={formData.itemType}
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

                {formData.itemType === "other" && (
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
                  {/* Add Colors field here */}
                  <div className="mb-3">
                  <label className="form-label">
                    <FontAwesomeIcon icon={faTag} className="me-2 text-secondary" />
                    Colors
                  </label>
                  
                  {/* Selected colors display */}
                  {selectedColors.length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted">Selected colors:</small>
                      <div className="d-flex flex-wrap gap-2 mt-1">
                        {selectedColors.map((colorValue, index) => (
                          <span
                            key={index}
                            className="badge bg-secondary d-flex align-items-center"
                            style={{ fontSize: '0.9em' }}
                          >
                            {getColorHex(colorValue) && (
                              <span
                                className="me-2"
                                style={{
                                  display: 'inline-block',
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: getColorHex(colorValue),
                                  border: '1px solid #ccc',
                                  borderRadius: '2px'
                                }}
                              ></span>
                            )}
                            {getColorDisplay(colorValue)}
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-2"
                              style={{ fontSize: '0.7em' }}
                              onClick={() => removeColor(colorValue)}
                              aria-label="Remove color"
                            ></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Color selection dropdown */}
                  <select
                    className="form-select"
                    onChange={handleColorChange}
                    value=""
                  >
                    <option value="">Add a color...</option>
                    {itemColors
                      .filter(color => !selectedColors.includes(color.value))
                      .map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                  </select>
                  
                  <small className="form-text text-muted">
                    You can select multiple colors for your item.
                  </small>
                </div>
                {/* Brand Field */}
                <div className="mb-3">
                  <label htmlFor="brand" className="form-label">Brand (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g., Apple, Nike, Samsung..."
                  />
                  <small className="form-text text-muted">
                    Enter the brand name if known.
                  </small>
                </div>
                
                 {/* Condition Field */}
                 <div className="mb-3">
                  <label htmlFor="condition" className="form-label">Condition</label>
                  <select
                    className="form-select"
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select condition</option>
                    <option value="new">New - Like new, unused</option>
                    <option value="worn">Worn - Used but in good condition</option>
                    <option value="damaged">Damaged - Has visible damage or defects</option>
                    <option value="other">Other - Please specify in flaws</option>
                  </select>
                </div>
                
                {/* Material Field - only show if category is selected */}
                {formData.categoryGroup && availableMaterials.length > 0 && (
                  <div className="mb-3">
                    <label htmlFor="material" className="form-label">Material</label>
                    <select
                      className="form-select"
                      id="material"
                      name="material"
                      value={formData.material}
                      onChange={handleChange}
                    >
                      <option value="">Select material (optional)</option>
                      {availableMaterials.map((material) => (
                        <option key={material.value} value={material.value}>
                          {material.label}
                        </option>
                      ))}
                    </select>
                    <small className="form-text text-muted">
                      Select the primary material of the item.
                    </small>
                  </div>
                )}
                
                {/* Flaws Field */}
                <div className="mb-3">
                  <label htmlFor="flaws" className="form-label">
                    Flaws & Additional Details (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    id="flaws"
                    name="flaws"
                    rows={3}
                    value={formData.flaws}
                    onChange={handleChange}
                    placeholder="Describe any scratches, dents, missing parts, or other specific details that would help identify the item..."
                  />
                  <small className="form-text text-muted">
                    Be specific about any damage, wear marks, or unique characteristics. 
                    This information is crucial for proper identification.
                  </small>
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

                <div className="mb-3">
                  <label className="form-label">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-danger" />
                    Location
                  </label>
                  <div className="mb-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleGetCurrentLocation}
                    >
                      <FontAwesomeIcon icon={faLocationCrosshairs} className="me-2" />
                      Use My Current Location
                    </button>
                  </div>
                  
                  <div 
                    ref={mapContainerRef} 
                    style={mapContainerStyle} 
                    className="border rounded"
                  ></div>
                  
                  {(!isLoaded || loadError) && (
                    <div className="mt-3">
                      <p className="text-muted mb-2">Enter coordinates manually:</p>
                      <div className="input-group mb-3">
                        <span className="input-group-text">Latitude</span>
                        <input 
                          type="number" 
                          className="form-control"
                          value={formData.location.lat}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            location: {
                              ...prev.location,
                              lat: parseFloat(e.target.value) || prev.location.lat
                            }
                          }))}
                          step="0.000001"
                        />
                      </div>
                      <div className="input-group">
                        <span className="input-group-text">Longitude</span>
                        <input 
                          type="number" 
                          className="form-control"
                          value={formData.location.lng}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            location: {
                              ...prev.location,
                              lng: parseFloat(e.target.value) || prev.location.lng
                            }
                          }))}
                          step="0.000001"
                        />
                      </div>
                    </div>
                  )}
                  
                  <small className="form-text text-muted mt-2">
                    {isLoaded && !loadError 
                      ? "Click on the map to set location or drag the marker"
                      : "Enter coordinates manually or use current location"
                    }
                  </small>
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
                    required
                  />
                  <small className="form-text text-muted">
                    An image helps in identifying the item.
                  </small>
                </div>
                
                {imagePreview ? (
                  <div className="mb-3 text-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="img-thumbnail"
                      style={{ maxHeight: "300px" }}
                    />
                  </div>
                ) : (
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
                Upload {formData.kind === 'lost' ? 'Lost' : 'Found'} Item
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemUpload; 