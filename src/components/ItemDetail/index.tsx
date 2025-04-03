/** @format */

import { FC, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import itemService, { Item, MatchResult } from "../../services/item-service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faMapMarkerAlt,
  faCalendarAlt,
  faTag,
  faExclamationTriangle,
  faUser
} from "@fortawesome/free-solid-svg-icons";

const ItemDetail: FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, currentUser } = useAuth();
  
  const [item, setItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;
    
    const fetchItem = async () => {
      setIsLoading(true);
      try {
        const { request } = itemService.getItemById(itemId);
        const response = await request;
        setItem(response.data);
        
        // Fetch matches for this item
        const matchesResponse = await itemService.getMatchResults(itemId).request;
        setMatches(matchesResponse.data);
      } catch (err) {
        console.error("Error fetching item:", err);
        setError("Failed to load item details");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchItem();
  }, [itemId]);

  if (!authLoading && !isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading item details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          <div>{error}</div>
        </div>
        <button
          className="btn btn-outline-primary mt-3"
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Go Back
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Item not found.
        </div>
        <button
          className="btn btn-outline-primary mt-3"
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Go Back
        </button>
      </div>
    );
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
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
        <h1 className="mb-0">
          {item.itemType === 'lost' ? 'Lost' : 'Found'} Item Details
        </h1>
      </div>

      <div className="row">
        <div className="col-md-7">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="card-title mb-3">{item.name}</h2>
              
              <div className="mb-4">
                <span className={`badge ${item.itemType === 'lost' ? 'bg-danger' : 'bg-success'} me-2`}>
                  {item.itemType === 'lost' ? 'Lost' : 'Found'}
                </span>
                <span className="text-muted">
                  <FontAwesomeIcon icon={faUser} className="ms-3 me-1" />
                  Posted by: {item.owner ? item.owner : 'Anonymous'}
                </span>
              </div>
              
              <p className="card-text lead mb-4">{item.description}</p>
              
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="d-flex align-items-center mb-2">
                    <FontAwesomeIcon icon={faTag} className="me-2 text-secondary" />
                    <strong>Category:</strong>
                  </div>
                  <p>{item.category}</p>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-center mb-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-danger" />
                    <strong>Location:</strong>
                  </div>
                  <p>{item.location}</p>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-center mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-info" />
                    <strong>Date:</strong>
                  </div>
                  <p>{formatDate(item.date)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-5">
          {item.imgURL ? (
            <img
              src={item.imgURL}
              alt={item.name}
              className="img-fluid rounded shadow-sm mb-4"
              style={{ maxHeight: "400px", width: "100%", objectFit: "cover" }}
            />
          ) : (
            <div className="border rounded p-5 text-center bg-light mb-4">
              <p className="text-muted">No image available</p>
            </div>
          )}
        </div>
      </div>

      {/* Matches Section */}
      {matches.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h3 className="card-title mb-4">Potential Matches</h3>
            
            <div className="row">
              {matches.map((match) => (
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
                        View Item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentUser?._id === item.owner && (
        <div className="d-flex justify-content-end mb-4">
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this item?")) {
                itemService.deleteItem(item._id!).request.then(() => {
                  navigate(item.itemType === 'lost' ? '/lost-items' : '/found-items');
                });
              }
            }}
          >
            Delete Item
          </button>
        </div>
      )}
    </div>
  );
};

export default ItemDetail; 