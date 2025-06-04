/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCheckCircle,
  faExclamationTriangle,
  faComment
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import itemService, { Item } from '../../services/item-service';
import matchService, { IMatch } from '../../services/match-service';
import './MatchConfirmation.css';
import ChatRoom from '../ChatRoom';

interface MatchConfirmationProps {
  matchId?: string;
}

const MatchConfirmation: React.FC<MatchConfirmationProps> = (props) => {
  const { matchId: urlMatchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const matchId = props.matchId || urlMatchId;
  
  const [match, setMatch] = useState<IMatch | null>(null);
  const [userItem, setUserItem] = useState<Item | null>(null);
  const [otherItem, setOtherItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(1);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!matchId) {
      setError('Missing match ID');
      setLoading(false);
      return;
    }

    fetchMatchAndItems();
  }, [matchId]);

  const fetchMatchAndItems = async () => {
    try {
      setLoading(true);
      
      // First fetch the match
      const matchResponse = await matchService.getById(matchId).request;
      const matchData = matchResponse.data;
      setMatch(matchData);
      
      // Then fetch both items in parallel
      const [item1Response, item2Response] = await Promise.all([
        itemService.getItemById(matchData.item1Id).request,
        itemService.getItemById(matchData.item2Id).request
      ]);
      
      const item1 = item1Response.data;
      const item2 = item2Response.data;

      // Determine which item belongs to the current user by checking owner
      if (item1.userId === currentUser?._id) {
        setUserItem(item1);
        setOtherItem(item2);
      } else {
        setUserItem(item2);
        setOtherItem(item1);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    setConfirmStep(2);
    setShowChat(true);
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

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading match details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
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

  if (!userItem || !otherItem) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">Items not found.</div>
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

  if (userItem.isResolved || otherItem.isResolved) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info">
          <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
          One or both of these items have already been marked as resolved.
        </div>
        <div className="d-flex gap-3">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate(`/item/${userItem._id}`)}
          >
            View Your Item
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
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
        <h1 className="mb-0">Confirm Match</h1>
      </div>
      
      <div className="match-confirmation-progress mb-4">
        <div className={`progress-step ${confirmStep >= 1 ? 'active' : ''} ${confirmStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Review Items</div>
        </div>
        <div className={`progress-connector ${confirmStep > 1 ? 'active' : ''}`}></div>
        <div className={`progress-step ${confirmStep >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Chat</div>
        </div>
      </div>
      
      {confirmStep === 1 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h3 className="card-title mb-4">Review Items</h3>
            
            <div className="alert alert-info mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Please review both items carefully to confirm they are a match.
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-4 mb-md-0">
                <div className="card h-100">
                  <div className="card-header bg-primary text-white">
                    Your Item
                  </div>
                  <div className="card-body">
                    <div className="image-container text-center">
                      <img 
                        src={userItem?.imageUrl} 
                        alt={userItem?.name}
                        className="img-fluid rounded mb-3"
                        style={{ maxHeight: '300px', objectFit: 'contain' }}
                      />
                    </div>
                    <h5 className="card-text">{userItem?.description}</h5>
                    <ul className="list-group list-group-flush mb-3">
                      <li className="list-group-item"><strong>Category:</strong> {userItem?.category}</li>
                      <li className="list-group-item"><strong>Location:</strong> {formatLocation(userItem?.location)}</li>
                      <li className="list-group-item"><strong>Date:</strong> {userItem?.date ? new Date(userItem.date).toLocaleDateString() : ''}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-success text-white">
                    Matched Item
                  </div>
                  <div className="card-body">
                      <img 
                        src={otherItem?.imageUrl} 
                        alt={otherItem?.name}
                        className="img-fluid rounded mb-3"
                        style={{ maxHeight: '300px', objectFit: 'contain' }}
                      />
                    <h5 className="card-text">{otherItem?.description}</h5>
                    <ul className="list-group list-group-flush mb-3">
                      <li className="list-group-item"><strong>Category:</strong> {otherItem?.category}</li>
                      <li className="list-group-item"><strong>Location:</strong> {formatLocation(otherItem?.location)}</li>
                      <li className="list-group-item"><strong>Date:</strong> {otherItem?.date ? new Date(otherItem.date).toLocaleDateString() : ''}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-end mt-4">
              <button 
                className="btn btn-primary"
                onClick={handleNextStep}
              >
                <FontAwesomeIcon icon={faComment} className="me-2" />
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
      
      {confirmStep === 2 && showChat && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <ChatRoom 
              matchId={matchId!} 
              onClose={() => setShowChat(false)}
              userItem={userItem}
              otherItem={otherItem}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchConfirmation; 