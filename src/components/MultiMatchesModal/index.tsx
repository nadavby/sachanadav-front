import { FC } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPercentage, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import './styles.css';

export interface MatchResult {
  matchedItemId: string;
  similarity: number;
  itemName: string;
  itemDescription?: string;
  itemImgURL?: string;
  ownerName?: string;
  ownerEmail?: string;
}

interface MultiMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
  itemName?: string;
  itemImage?: string;
  matches: MatchResult[];
}

const MultiMatchesModal: FC<MultiMatchesModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemName,
  itemImage,
  matches
}) => {
  const navigate = useNavigate();

  const handleViewDetails = (match: MatchResult) => {
    console.log("Navigation details:", {
      itemId,
      matchedItemId: match.matchedItemId,
      fullMatch: match
    });
    
    if (!itemId) {
      console.error("Item ID is undefined - cannot navigate");
      alert("Error: Cannot view details because item ID is missing. Please try again later.");
      return;
    }
    if (!match.matchedItemId) {
      console.error("Match ID is undefined - cannot navigate");
      alert("Error: Cannot view details because match ID is missing. Please try again later.");
      return;
    }

    navigate(`/item/${itemId}/match/${match.matchedItemId}`);
  };

  console.log("MultiMatchesModal rendered with props:", {
    isOpen,
    itemId,
    itemName,
    matches: matches.length
  });

  if (!isOpen) return null;

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      centered 
      size="lg"
      className="multi-matches-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Potential Matches Found</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {matches.length === 0 ? (
          <div className="text-center py-4">
            <p>No matches found for your item.</p>
          </div>
        ) : (
          <>
            <div className="your-item-section">
              <h5>Your Item</h5>
              <div className="your-item-card">
                <div className="your-item-image">
                  {itemImage && (
                    <img 
                      src={itemImage} 
                      alt={itemName} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                      }}
                    />
                  )}
                </div>
                <div className="your-item-info">
                  <h6>{itemName || 'Your Item'}</h6>
                </div>
              </div>
            </div>
            
            <h5 className="matches-title">Potential Matches ({matches.length})</h5>
            
            <div className="matches-container">
              {matches.map((match) => (
                <div 
                  key={match.matchedItemId} 
                  className="match-card"
                >
                  <div className="match-card-content">
                    <div className="match-image">
                      {match.itemImgURL && (
                        <img 
                          src={match.itemImgURL} 
                          alt={match.itemName} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                          }}
                        />
                      )}
                    </div>
                    <div className="match-info">
                      <h6 className="match-title">{match.itemName}</h6>
                      {match.itemDescription && (
                        <p className="match-description">{match.itemDescription.substring(0, 60)}...</p>
                      )}
                      <div className="match-score">
                        <FontAwesomeIcon icon={faPercentage} className="me-1" />
                        <span>{(match.similarity * 100).toFixed()}% Match</span>
                      </div>
                    </div>
                    <div className="match-actions">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(match);
                        }}
                      >
                        <FontAwesomeIcon icon={faArrowRight} className="me-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MultiMatchesModal; 