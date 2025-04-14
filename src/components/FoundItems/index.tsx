/** @format */

import { FC, useState } from "react";
import { useFoundItems } from "../../hooks/useItems";
import { useAuth } from "../../hooks/useAuth";
import { Item } from "../../services/item-service";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faSignInAlt,
  faUpload,
  faSearch,
  faMapMarkerAlt,
  faCalendarAlt,
  faTag
} from "@fortawesome/free-solid-svg-icons";
import itemService, { getItemImageUrl } from "../../services/item-service";

type SortOption = 'newest' | 'oldest' | 'category';

const FoundItems: FC = () => {
  const { items, isLoading, error, setItems } = useFoundItems();
  const { isAuthenticated, loading: authLoading, currentUser } = useAuth();
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  if (!authLoading && !isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleDelete = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const { request } = itemService.deleteItem(itemId);
      await request;
      setItems((prevItems: Item[]) =>
        prevItems.filter((item) => item._id !== itemId)
      );
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setDropdownOpen(false);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatLocation = (location: any): string => {
    if (!location) return "Unknown location";
    
    if (typeof location === 'string') return location;
    
    if (location && typeof location === 'object') {
      if (typeof location === 'string') {
        try {
          const parsedLocation = JSON.parse(location);
          if (parsedLocation.lat && parsedLocation.lng) {
            return `Lat: ${parsedLocation.lat.toFixed(4)}, Lng: ${parsedLocation.lng.toFixed(4)}`;
          }
        } catch (e) {
          console.error("Error parsing location:", e);
        }
      }
      
      if (location.lat !== undefined && location.lng !== undefined) {
        return `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`;
      }
    }
    
    return String(location);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getItemProperty = (item: any, property: string) => {
    if (item && Object.prototype.hasOwnProperty.call(item, property)) {
      return item[property];
    }
    
    if (item && item._doc && Object.prototype.hasOwnProperty.call(item._doc, property)) {
      return item._doc[property];
    }
    
    if (item && item.fields && Object.prototype.hasOwnProperty.call(item.fields, property)) {
      return item.fields[property];
    }
    
    return undefined;
  };

  const getSortedItems = () => {
    if (!items) return [];
    
    let filteredItems = items;
    
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(item => {
        const name = (item.name || getItemProperty(item, 'name') || '').toLowerCase();
        const description = (item.description || getItemProperty(item, 'description') || '').toLowerCase();
        const category = (item.category || getItemProperty(item, 'category') || '').toLowerCase();
        const location = (item.location || getItemProperty(item, 'location') || '').toLowerCase();
        
        return name.includes(term) || 
               description.includes(term) ||
               category.includes(term) ||
               location.includes(term);
      });
    }
    
    const itemsCopy = [...filteredItems];
    
    switch (sortOption) {
      case 'newest':
        return itemsCopy.sort((a, b) => {
          const dateA = new Date(a.date || getItemProperty(a, 'date') || 0);
          const dateB = new Date(b.date || getItemProperty(b, 'date') || 0);
          return dateB.getTime() - dateA.getTime();
        });
      case 'oldest':
        return itemsCopy.sort((a, b) => {
          const dateA = new Date(a.date || getItemProperty(a, 'date') || 0);
          const dateB = new Date(b.date || getItemProperty(b, 'date') || 0);
          return dateA.getTime() - dateB.getTime();
        });
      case 'category':
        return itemsCopy.sort((a, b) => {
          const categoryA = a.category || getItemProperty(a, 'category') || '';
          const categoryB = b.category || getItemProperty(b, 'category') || '';
          return categoryA.localeCompare(categoryB);
        });
      default:
        return itemsCopy;
    }
  };

  const sortedItems = getSortedItems();
  const getSortOptionText = () => {
    switch (sortOption) {
      case 'newest': return 'Newest';
      case 'oldest': return 'Oldest';
      case 'category': return 'Category';
      default: return 'Sort by';
    }
  };

  return (
    <div className="container mt-3">
      <div className="d-flex justify-content-between mb-3">
        {!authLoading &&
          (isAuthenticated ? (
            <button className="btn btn-outline-primary d-flex flex-column align-items-center justify-content-center text-center p-3" style={{ width: "100px", height: "100px" }} onClick={() => navigate("/profile")}>
              <FontAwesomeIcon icon={faUser} size="2x" />
              <span className="mt-2">My Profile</span>
            </button>
          ) : (
            <button className="btn btn-outline-secondary d-flex flex-column align-items-center justify-content-center text-center p-3" style={{ width: "100px", height: "100px" }} onClick={() => navigate("/login")}>
              <FontAwesomeIcon icon={faSignInAlt} size="2x" />
              <span className="mt-2">Login</span>
            </button>
          ))}
        <div className="text-center">
          <h1 className="text-primary text-center flex-grow-1 mb-3">
            Found Items
          </h1>
          <p className="lead text-muted">
            Browse found items or upload your own
          </p>
        </div>
        <button className="btn btn-success d-flex flex-column align-items-center justify-content-center text-center p-3" style={{ width: "100px", height: "100px" }} onClick={() => navigate("/upload-item")}>
          <FontAwesomeIcon icon={faUpload} size="2x" />
          <span className="mt-2">Upload Item</span>
        </button>
      </div>
      <hr className="border border-primary border-2 opacity-75 my-4" />
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-outline-secondary" type="button">
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
        </div>
        <div className="col-md-6">
          <div className="dropdown">
            <button 
              className="btn btn-outline-secondary dropdown-toggle" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Sort by: {getSortOptionText()}
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu show">
                <button 
                  key="sort-newest"
                  className="dropdown-item"
                  onClick={() => handleSortChange('newest')}>
                  Newest
                </button>
                <button 
                  key="sort-oldest"
                  className="dropdown-item"
                  onClick={() => handleSortChange('oldest')}>
                  Oldest
                </button>
                <button 
                  key="sort-category"
                  className="dropdown-item"
                  onClick={() => handleSortChange('category')}>
                  Category
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="alert alert-danger">Error: {error}</p>}
      {isLoading && !error && <p>Loading...</p>}
      {!isLoading && sortedItems.length === 0 && !error && (
        <p className="alert alert-warning">No found items available.</p>
      )}

      {sortedItems.length > 0 && (
        <div className="row">
          {sortedItems.map((item: Item) => {
            // Ensure we have a valid _id for the key
            const itemId = item._id || getItemProperty(item, '_id');
            if (!itemId) {
              console.error("Item without _id found:", item);
              return null; // Skip items without an ID
            }
            
            const imgURL = item.imgURL || getItemProperty(item, 'imgURL');
            
            return (
              <div key={itemId} className="col-md-6 col-lg-4 mb-4">
                <div className="card shadow-sm h-100">
                  {imgURL && (
                    <img 
                      src={getItemImageUrl(imgURL)} 
                      className="card-img-top" 
                      alt={item.name || getItemProperty(item, 'name') || 'Unnamed Item'}
                      style={{ height: "200px", objectFit: "cover" }}
                      onError={(e) => {
                        console.error("FoundItems - Image failed to load:", imgURL);
                        console.log("FoundItems - Image URL attempted:", getItemImageUrl(imgURL));
                        // Try a secondary approach
                        setTimeout(() => {
                          if (imgURL && !imgURL.startsWith('http') && !imgURL.startsWith('/')) {
                            console.log("FoundItems - Trying secondary image URL format...");
                            (e.target as HTMLImageElement).src = `http://localhost:3000/uploads/${imgURL}`;
                          } else {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                          }
                        }, 100);
                      }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{item.name || getItemProperty(item, 'name') || 'Unnamed Item'}</h5>
                    <p className="card-text">{item.description || getItemProperty(item, 'description') || 'No description available'}</p>
                    <div className="mt-auto">
                      <p className="card-text mb-1">
                        <FontAwesomeIcon icon={faTag} className="me-2 text-secondary" />
                        {item.category || getItemProperty(item, 'category') || 'Uncategorized'}
                      </p>
                      <p className="card-text mb-1">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-danger" />
                        {formatLocation(item.location || getItemProperty(item, 'location'))}
                      </p>
                      <p className="card-text">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-info" />
                        {formatDate(item.date || getItemProperty(item, 'date'))}
                      </p>
                    </div>
                  </div>
                  <div className="card-footer bg-transparent d-flex justify-content-between">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/item/${itemId}`)}
                    >
                      View Details
                    </button>
                    {currentUser?._id === (item.owner || getItemProperty(item, 'owner')) && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(itemId)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FoundItems; 