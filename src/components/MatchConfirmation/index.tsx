import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCheckCircle,
  faExclamationTriangle,
  faEnvelope,
  faPhone,
  faComment
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import itemService, { Item, MatchResult } from '../../services/item-service';
import './MatchConfirmation.css';

interface MatchConfirmationProps {
  itemId?: string;
  matchId?: string;
}

const MatchConfirmation: React.FC<MatchConfirmationProps> = (props) => {
  const { itemId: urlItemId, matchId: urlMatchId } = useParams<{ itemId: string, matchId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Use either props or URL parameters
  const itemId = props.itemId || urlItemId;
  const matchId = props.matchId || urlMatchId;
  
  const [item, setItem] = useState<Item | null>(null);
  const [matchedItem, setMatchedItem] = useState<Item | null>(null);
  const [matchInfo, setMatchInfo] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(1);
  const [contactMethod, setContactMethod] = useState<'email' | 'phone' | 'other'>('email');
  const [contactDetails, setContactDetails] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);

  useEffect(() => {
    if (!itemId || !matchId) {
      setError('Missing required information');
      setLoading(false);
      return;
    }

    fetchItems();
  }, [itemId, matchId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // Fetch the original item
      const { request: itemRequest } = itemService.getItemById(itemId!);
      const itemResponse = await itemRequest;
      setItem(itemResponse.data);
      
      // Fetch the matched item
      const { request: matchRequest } = itemService.getItemById(matchId!);
      const matchResponse = await matchRequest;
      setMatchedItem(matchResponse.data);
      
      // Find match details from the item's matchResults
      if (itemResponse.data.matchResults) {
        const match = itemResponse.data.matchResults.find(
          (m: MatchResult) => m.matchedItemId === matchId
        );
        if (match) {
          setMatchInfo(match);
        }
      }
      
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMatch = async () => {
    if (!item || !matchedItem || !currentUser) return;
    
    setIsSubmitting(true);
    
    try {
      // Mark both items as resolved
      await itemService.updateItem(item._id!, {
        isResolved: true,
        resolvedWithItemId: matchedItem._id
      });
      
      // Also mark the matched item as resolved
      await itemService.updateItem(matchedItem._id!, {
        isResolved: true,
        resolvedWithItemId: item._id
      });
      
      // TODO: In a real application, send notification to the other user
      // with the contact details and message
      
      setConfirmationSuccess(true);
      
    } catch (error) {
      console.error('Error confirming match:', error);
      setError('Failed to confirm match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    setConfirmStep(step => step + 1);
  };

  const handlePrevStep = () => {
    setConfirmStep(step => step - 1);
  };

  // Add a function to format location objects as strings
  const formatLocation = (location: any): string => {
    if (!location) return "Unknown location";
    
    // If location is already a string, return it
    if (typeof location === 'string') return location;
    
    // If location is an object with lat and lng properties
    if (location && typeof location === 'object') {
      // Direct object access
      if (location.lat !== undefined && location.lng !== undefined) {
        return `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`;
      }
    }
    
    // If we can't parse it properly, convert to string
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

  if (!item || !matchedItem) {
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

  // Handle already resolved items
  if (item.isResolved || matchedItem.isResolved) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info">
          <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
          One or both of these items have already been marked as resolved.
        </div>
        <div className="d-flex gap-3">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate(`/item/${item._id}`)}
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

  if (confirmationSuccess) {
    return (
      <div className="container mt-5">
        <div className="success-confirmation text-center py-5">
          <div className="success-icon mb-4">
            <FontAwesomeIcon icon={faCheckCircle} size="3x" />
          </div>
          <h2>Match Confirmed!</h2>
          <p className="lead mb-4">
            Great! You've confirmed that this is a match. The other user will be notified with your contact details.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
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
        <div className={`progress-step ${confirmStep >= 2 ? 'active' : ''} ${confirmStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Contact Info</div>
        </div>
        <div className={`progress-connector ${confirmStep > 2 ? 'active' : ''}`}></div>
        <div className={`progress-step ${confirmStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Confirm</div>
        </div>
      </div>
      
      {/* Step 1: Review items */}
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
                    Your {item.itemType === 'lost' ? 'Lost' : 'Found'} Item
                  </div>
                  {item.imgURL && (
                    <img 
                      src={item.imgURL} 
                      alt={item.name}
                      className="card-img-top match-item-image"
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{item.name}</h5>
                    <p className="card-text">{item.description}</p>
                    <ul className="list-group list-group-flush mb-3">
                      <li className="list-group-item"><strong>Category:</strong> {item.category}</li>
                      <li className="list-group-item"><strong>Location:</strong> {formatLocation(item.location)}</li>
                      <li className="list-group-item"><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-success text-white">
                    Matched {matchedItem.itemType === 'lost' ? 'Lost' : 'Found'} Item
                  </div>
                  {matchedItem.imgURL && (
                    <img 
                      src={matchedItem.imgURL} 
                      alt={matchedItem.name}
                      className="card-img-top match-item-image"
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{matchedItem.name}</h5>
                    <p className="card-text">{matchedItem.description}</p>
                    <ul className="list-group list-group-flush mb-3">
                      <li className="list-group-item"><strong>Category:</strong> {matchedItem.category}</li>
                      <li className="list-group-item"><strong>Location:</strong> {formatLocation(matchedItem.location)}</li>
                      <li className="list-group-item"><strong>Date:</strong> {new Date(matchedItem.date).toLocaleDateString()}</li>
                    </ul>
                    
                    {matchInfo && (
                      <div className="match-score-badge mt-3">
                        <span>Match Score: {(matchInfo.similarity * 100).toFixed()}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-end mt-4">
              <button 
                className="btn btn-primary"
                onClick={handleNextStep}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 2: Contact Information */}
      {confirmStep === 2 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h3 className="card-title mb-4">Contact Information</h3>
            
            <div className="alert alert-info mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Please provide your contact information so the other user can get in touch with you.
            </div>
            
            <div className="mb-4">
              <label className="form-label">How would you like to be contacted?</label>
              <div className="contact-method-buttons">
                <button
                  type="button"
                  className={`btn ${contactMethod === 'email' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setContactMethod('email')}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  Email
                </button>
                <button
                  type="button"
                  className={`btn ${contactMethod === 'phone' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setContactMethod('phone')}
                >
                  <FontAwesomeIcon icon={faPhone} className="me-2" />
                  Phone
                </button>
                <button
                  type="button"
                  className={`btn ${contactMethod === 'other' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setContactMethod('other')}
                >
                  <FontAwesomeIcon icon={faComment} className="me-2" />
                  Other
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="contactDetails" className="form-label">
                {contactMethod === 'email' 
                  ? 'Your Email Address' 
                  : contactMethod === 'phone' 
                    ? 'Your Phone Number' 
                    : 'Contact Details'}
              </label>
              <input
                type={contactMethod === 'email' ? 'email' : 'text'}
                className="form-control"
                id="contactDetails"
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
                placeholder={
                  contactMethod === 'email' 
                    ? 'example@email.com' 
                    : contactMethod === 'phone' 
                      ? '+1 123-456-7890' 
                      : 'How to contact you'
                }
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="message" className="form-label">Message (optional)</label>
              <textarea
                className="form-control"
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message for the other user..."
              />
            </div>
            
            <div className="d-flex justify-content-between mt-4">
              <button 
                className="btn btn-outline-secondary"
                onClick={handlePrevStep}
              >
                Back
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleNextStep}
                disabled={!contactDetails}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 3: Final Confirmation */}
      {confirmStep === 3 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h3 className="card-title mb-4">Confirm Match</h3>
            
            <div className="alert alert-warning mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              By confirming this match, both items will be marked as resolved, and your contact information will be shared with the other user.
            </div>
            
            <div className="confirmation-summary mb-4">
              <h5>Summary</h5>
              <ul className="list-group mb-3">
                <li className="list-group-item">
                  <strong>Your Item:</strong> {item.name}
                </li>
                <li className="list-group-item">
                  <strong>Matched Item:</strong> {matchedItem.name}
                </li>
                <li className="list-group-item">
                  <strong>Contact Method:</strong> {contactMethod}
                </li>
                <li className="list-group-item">
                  <strong>Contact Details:</strong> {contactDetails}
                </li>
                {message && (
                  <li className="list-group-item">
                    <strong>Message:</strong> {message}
                  </li>
                )}
              </ul>
            </div>
            
            <div className="d-flex justify-content-between mt-4">
              <button 
                className="btn btn-outline-secondary"
                onClick={handlePrevStep}
              >
                Back
              </button>
              <button 
                className="btn btn-success"
                onClick={handleConfirmMatch}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    Confirm Match
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchConfirmation; 