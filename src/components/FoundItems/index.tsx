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
import itemService from "../../services/item-service";

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
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  };

  const getSortedItems = () => {
    if (!items) return [];
    
    let filteredItems = items;
    
    // Apply search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term)
      );
    }
    
    const itemsCopy = [...filteredItems];
    
    switch (sortOption) {
      case 'newest':
        return itemsCopy.sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date || 0);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date || 0);
          return dateB.getTime() - dateA.getTime();
        });
      case 'oldest':
        return itemsCopy.sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date || 0);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date || 0);
          return dateA.getTime() - dateB.getTime();
        });
      case 'category':
        return itemsCopy.sort((a, b) => a.category.localeCompare(b.category));
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
                  className="dropdown-item"
                  onClick={() => handleSortChange('newest')}>
                  Newest
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleSortChange('oldest')}>
                  Oldest
                </button>
                <button 
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
          {sortedItems.map((item: Item) => (
            <div key={item._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-sm h-100">
                {item.imgURL && (
                  <img 
                    src={item.imgURL} 
                    className="card-img-top" 
                    alt={item.name}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                )}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text">{item.description}</p>
                  <div className="mt-auto">
                    <p className="card-text mb-1">
                      <FontAwesomeIcon icon={faTag} className="me-2 text-secondary" />
                      {item.category}
                    </p>
                    <p className="card-text mb-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-danger" />
                      {item.location}
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
                  {currentUser?._id === item.owner && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(item._id!)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoundItems; 