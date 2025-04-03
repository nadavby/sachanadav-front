import { FC, useEffect, useRef } from 'react';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationItem from '../NotificationItem';
import './styles.css';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: FC<NotificationDropdownProps> = ({ onClose }) => {
  const { notifications, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-header">
        <h3>Notifications</h3>
        {notifications.some(notification => !notification.read) && (
          <button className="mark-all-read" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onClose={onClose}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown; 