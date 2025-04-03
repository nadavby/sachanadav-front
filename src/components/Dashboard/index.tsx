import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSearch,
  faFilter,
  faExchangeAlt,
  faCheckCircle,
  faSadTear,
  faSmile
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import itemService, { Item } from '../../services/item-service';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loading } = useAuth();
  
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found' | 'matches'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchUserItems();
  }, [isAuthenticated, loading, currentUser]);

  const fetchUserItems = async () => {
    if (!currentUser || !currentUser._id) return;
    
    setIsLoading(true);
    try {
      const { request } = itemService.getItemsByUser(currentUser._id);
      const response = await request;
      setItems(response.data);
      applyFilters(response.data, activeTab, searchQuery);
    } catch (error) {
      console.error('Error fetching user items:', error);
      setError('Failed to load your items');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (itemsList: Item[], tab: string, query: string) => {
    let result = [...itemsList];
    
    // Apply tab filter
    if (tab === 'lost') {
      result = result.filter(item => item.itemType === 'lost');
    } else if (tab === 'found') {
      result = result.filter(item => item.itemType === 'found');
    } else if (tab === 'matches') {
      result = result.filter(item => item.matchResults && item.matchResults.length > 0);
    }
    
    // Apply search query filter
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        item => 
          item.name.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery) ||
          item.category.toLowerCase().includes(lowerQuery) ||
          item.location.toLowerCase().includes(lowerQuery)
      );
    }
    
    setFilteredItems(result);
  };

  const handleTabChange = (tab: 'all' | 'lost' | 'found' | 'matches') => {
    setActiveTab(tab);
    applyFilters(items, tab, searchQuery);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(items, activeTab, query);
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Items Dashboard</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/upload-item')}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Upload New Item
        </button>
      </div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <div className="row mb-4">
        <div className="col-md-6 mb-3 mb-md-0">
          <div className="input-group">
            <span className="input-group-text">
              <FontAwesomeIcon icon={faSearch} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search your items..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="col-md-6">
          <ul className="nav nav-pills">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => handleTabChange('all')}
              >
                All Items
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'lost' ? 'active' : ''}`}
                onClick={() => handleTabChange('lost')}
              >
                <FontAwesomeIcon icon={faSadTear} className="me-1" />
                Lost
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'found' ? 'active' : ''}`}
                onClick={() => handleTabChange('found')}
              >
                <FontAwesomeIcon icon={faSmile} className="me-1" />
                Found
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'matches' ? 'active' : ''}`}
                onClick={() => handleTabChange('matches')}
              >
                <FontAwesomeIcon icon={faExchangeAlt} className="me-1" />
                With Matches
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-5 border rounded bg-light">
          <h3 className="text-muted">No items found</h3>
          <p>
            {activeTab === 'all' 
              ? "You haven't uploaded any items yet."
              : activeTab === 'matches'
                ? "None of your items have potential matches yet."
                : `You don't have any ${activeTab} items.`
            }
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/upload-item')}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Upload New Item
          </button>
        </div>
      ) : (
        <div className="row">
          {filteredItems.map(item => (
            <div key={item._id} className="col-md-6 col-xl-4 mb-4">
              <div className={`card h-100 dashboard-item-card ${item.isResolved ? 'border-success' : ''}`}>
                {item.isResolved && (
                  <div className="resolved-badge">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>Resolved</span>
                  </div>
                )}
                
                {item.matchResults && item.matchResults.length > 0 && !item.isResolved && (
                  <div className="matches-badge">
                    <FontAwesomeIcon icon={faExchangeAlt} />
                    <span>{item.matchResults.length} Matches</span>
                  </div>
                )}
                
                <div className="card-img-container">
                  {item.imgURL ? (
                    <img
                      src={item.imgURL}
                      className="card-img-top"
                      alt={item.name}
                    />
                  ) : (
                    <div className="no-image-placeholder">
                      <span>No Image</span>
                    </div>
                  )}
                  <div className="item-type-badge">
                    {item.itemType === 'lost' ? 'Lost' : 'Found'}
                  </div>
                </div>
                
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text mb-2 text-truncate">{item.description}</p>
                  <div className="item-details mb-3">
                    <div><strong>Category:</strong> {item.category}</div>
                    <div><strong>Location:</strong> {item.location}</div>
                    <div><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="mt-auto d-grid">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => navigate(`/item/${item._id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 