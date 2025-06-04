/* eslint-disable @typescript-eslint/no-explicit-any */
/** @format */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faTag,
  faMapMarkerAlt,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import itemService, { Item } from '../../services/item-service';
import { useMatch } from '../../hooks/useMatch';
import { IMatch } from '../../services/match-service';
import './ItemDetail.css';

const ItemDetail: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { matches, isLoading: matchesLoading, error: matchError } = useMatch();
  
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<IMatch | null>(null);

  useEffect(() => {
    if (!itemId) return;

    const fetchItem = async () => {
      try {
        setLoading(true);
        const { request } = itemService.getItemById(itemId);
        const response = await request;
        setItem(response.data);
      } catch (error) {
        console.error('Error fetching item:', error);
        setError('Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  const handleResolveItem = async (matchId?: string) => {
    if (!itemId || !item) return;
    
    try {
      const resolveData = {
        ...item,
        isResolved: true,
        resolvedWithItemId: matchId
      };

      await itemService.updateItem(itemId, resolveData);
      setItem({ ...item, isResolved: true });
      setResolveDialogOpen(false);
      
      navigate(`/items/${item.itemType === 'lost' ? 'lost' : 'found'}`);
    } catch (error) {
      console.error('Error resolving item:', error);
      setError('Failed to mark item as resolved');
    }
  };

  const openResolveDialog = (match: IMatch | null = null) => {
    setSelectedMatch(match);
    setResolveDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading item details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          {error || 'Item not found'}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Go Back
        </button>
      </div>
    );
  }

  const isOwner = currentUser && currentUser._id === item.userId;


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

  return (
    <div className="container mt-4 pb-5">
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
        <div className="col-lg-8">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <h2 className="card-title mb-3">{item.name}</h2>
                {item.isResolved ? (
                  <span className="badge bg-success">Resolved</span>
                ) : (
                  <span className="badge bg-warning">Active</span>
                )}
              </div>
              
              <div className="row">
                <div className="col-md-6">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="img-fluid rounded mb-3"
                      style={{ maxHeight: '300px', objectFit: 'contain' }}
                      
                    />
                </div>
                
                <div className="col-md-6">
                  <h5 className="mt-md-0 mt-3">Description</h5>
                  <p>{item.description}</p>
                  
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex align-items-center px-0">
                      <FontAwesomeIcon icon={faTag} className="me-2 text-secondary" />
                      <strong className="me-2">Category:</strong> {item.category}
                    </li>
                    <li className="list-group-item d-flex align-items-center px-0">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-danger" />
                      <strong className="me-2">Location:</strong> {formatLocation(item.location)}
                    </li>
                    <li className="list-group-item d-flex align-items-center px-0">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-info" />
                      <strong className="me-2">Date:</strong> {new Date(item.date).toLocaleDateString()}
                    </li>
                  </ul>
                  
                  {isOwner && !item.isResolved && (
                    <div className="mt-3">
                      <button 
                        className="btn btn-success"
                        onClick={() => openResolveDialog()}
                      >
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        Mark as Resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {resolveDialogOpen && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedMatch ? 'Confirm Match' : 'Mark as Resolved'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setResolveDialogOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                {selectedMatch ? (
                  <p>
                    Are you sure this is your item? This will mark your item as resolved.
                  </p>
                ) : (
                  <p>
                    Are you sure you want to mark this item as resolved?
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setResolveDialogOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={() => {
                    const matchedId = selectedMatch ? 
                      (selectedMatch.item1Id === itemId ? selectedMatch.item2Id : selectedMatch.item1Id) 
                      : undefined;
                    handleResolveItem(matchedId);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail; 