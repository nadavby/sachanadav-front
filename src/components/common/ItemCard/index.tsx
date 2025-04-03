import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faCalendarAlt,
  faTag,
  faCheckCircle,
  faExchangeAlt
} from '@fortawesome/free-solid-svg-icons';
import { Item } from '../../../services/item-service';
import './ItemCard.css';

interface ItemCardProps {
  item: Item;
  showMatchCount?: boolean;
  compact?: boolean;
  className?: string;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  showMatchCount = true,
  compact = false,
  className = ''
}) => {
  const hasMatches = item.matchResults && item.matchResults.length > 0;
  
  const getProperImageUrl = (url: string): string => {
    if (!url) return '';
    
    if (url.startsWith('http')) {
      return url;
    } else if (url.startsWith('/')) {
      return `http://localhost:3000${url}`;
    } else {
      return `http://localhost:3000/uploads/${url}`;
    }
  };
  
  const getItemProperty = (item: any, property: string): string | undefined => {
    if (item && item.hasOwnProperty(property)) {
      return item[property];
    }
    return undefined;
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
      return "N/A";
    }
  };

  return (
    <div className={`item-card ${compact ? 'item-card-compact' : ''} ${className}`}>
      {item.isResolved && (
        <div className="item-card-badge resolved-badge">
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>Resolved</span>
        </div>
      )}
      
      {showMatchCount && hasMatches && !item.isResolved && (
        <div className="item-card-badge matches-badge">
          <FontAwesomeIcon icon={faExchangeAlt} />
          <span>{item.matchResults!.length} Matches</span>
        </div>
      )}
      
      <div className="item-card-image-container">
        {item.imgURL ? (
          <img
            src={getProperImageUrl(item.imgURL)}
            alt={item.name || getItemProperty(item, 'name') || 'Unnamed Item'}
            className="item-card-image"
            onError={(e) => {
              console.error("Image failed to load:", item.imgURL);
              console.log("Image URL attempted:", getProperImageUrl(item.imgURL));
              // Try a secondary approach if the first fails
              setTimeout(() => {
                if (item.imgURL && !item.imgURL.startsWith('http') && !item.imgURL.startsWith('/')) {
                  console.log("Trying secondary image URL format...");
                  (e.target as HTMLImageElement).src = `http://localhost:3000/uploads/${item.imgURL}`;
                } else {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                }
              }, 100);
            }}
          />
        ) : (
          <div className="item-card-no-image">
            <span>No Image</span>
          </div>
        )}
        <div className="item-type-label">
          {item.itemType === 'lost' ? 'Lost' : 'Found'}
        </div>
      </div>
      
      <div className="item-card-content">
        <h5 className="item-card-title">{item.name || getItemProperty(item, 'name') || 'Unnamed Item'}</h5>
        
        {!compact && (
          <p className="item-card-description">{item.description || getItemProperty(item, 'description') || 'No description available'}</p>
        )}
        
        <div className="item-card-details">
          <div className="item-card-detail">
            <FontAwesomeIcon icon={faTag} className="item-card-icon" />
            <span>{item.category || getItemProperty(item, 'category') || 'Uncategorized'}</span>
          </div>
          <div className="item-card-detail">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="item-card-icon" />
            <span>{item.location || getItemProperty(item, 'location') || 'Unknown location'}</span>
          </div>
          <div className="item-card-detail">
            <FontAwesomeIcon icon={faCalendarAlt} className="item-card-icon" />
            <span>{formatDate(item.date)}</span>
          </div>
        </div>
        
        <div className="item-card-actions">
          <Link to={`/item/${item._id}`} className="item-card-view-btn">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ItemCard; 