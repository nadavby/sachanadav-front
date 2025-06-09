/* eslint-disable @typescript-eslint/no-explicit-any */
/** @format */

import { FC, useState, useEffect } from "react";
import { useLostItems } from "../../hooks/useItems";
import { useAuth } from "../../hooks/useAuth";
import { Item } from "../../services/item-service";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faMapMarkerAlt,
  faCalendarAlt,
  faTag,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import itemService from "../../services/item-service";

type SortOption = 'newest' | 'oldest' | 'category';

const LostItems: FC = () => {
  const { items, isLoading, error, setItems, refreshItems } = useLostItems();
  const { isAuthenticated, loading: authLoading, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('newItem') === 'true') {
      refreshItems();
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, refreshItems]);

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
      if (isNaN(dateObj.getTime())) {
        return "N/A";
      }
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", date, error);
      return "N/A";
    }
  };

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

  const getSortedItems = () => {
    if (!items) return [];
    
    let filteredItems = items;
    
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(item => {
        const name = (item.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        const location = (item.location || '').toString().toLowerCase();
        
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
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      case 'oldest':
        return itemsCopy.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateA.getTime() - dateB.getTime();
        });
      case 'category':
        return itemsCopy.sort((a, b) => {
          const categoryA = a.category || '';
          const categoryB = b.category || '';
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
        <p className="alert alert-warning">No lost items available.</p>
      )}

      {sortedItems.length > 0 && (
        <div className="row">
          {sortedItems.map((item: Item) => {
            const itemId = item._id;
            if (!itemId) {
              console.error("Item without _id found:", item);
              return null; 
            }
            
            const imgURL = item.imageUrl;
            
            return (
              <div key={itemId} className="col-md-6 col-lg-4 mb-4">
                <div className="card shadow-sm h-100">
                  {imgURL && (
                    <img 
                      src={imgURL} 
                      className="card-img-top" 
                      alt={item.name || 'Unnamed Item'}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-text">{item.description || 'No description available'}</h5>
                    <div className="mt-auto">
                      <p className="card-text mb-1">
                        <FontAwesomeIcon icon={faTag} className="me-2 text-secondary" />
                        {item.category || 'Uncategorized'}
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
                      onClick={() => navigate(`/item/${itemId}`)}
                    >
                      View Details
                    </button>
                    {currentUser?._id === (item.userId) && (
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
      <button
        className="btn btn-success position-fixed bottom-0 end-0 m-3"
        onClick={() => navigate("/upload-item")}>
        <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Item
      </button>
    </div>
  );
};

export default LostItems; 
