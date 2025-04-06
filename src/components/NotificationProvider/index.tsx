import { FC, ReactNode, useEffect, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { socketService, MatchNotification } from '../../services/socket.service';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './styles.css';

interface NotificationProviderProps {
  children: ReactNode;
}

interface NotificationState extends MatchNotification {
  id: string;
  show: boolean;
}

export const NotificationProvider: FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Connect socket when component mounts
    socketService.connect();

    // Clean up on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (currentUser?._id) {
      // Authenticate socket with user ID
      socketService.authenticate(currentUser._id);
    }
  }, [currentUser?._id]);

  useEffect(() => {
    // Set up notification listener
    const unsubscribe = socketService.onNotification((notification) => {
      const newNotification: NotificationState = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        show: true,
      };

      setNotifications(prev => [...prev, newNotification]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setNotifications(prev =>
          prev.map(n =>
            n.id === newNotification.id ? { ...n, show: false } : n
          )
        );
      }, 5000);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleClose = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, show: false } : n
      )
    );
  };

  const handleClick = (notification: NotificationState) => {
    if (notification.data.matchedItemId) {
      navigate(`/item/${notification.data.matchedItemId}`);
    }
    handleClose(notification.id);
  };

  return (
    <>
      {children}
      <ToastContainer
        className="notification-container"
        position="top-end"
        style={{ padding: '1rem' }}
      >
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            show={notification.show}
            onClose={() => handleClose(notification.id)}
            onClick={() => handleClick(notification)}
            className="notification-toast"
            style={{ cursor: 'pointer' }}
          >
            <Toast.Header>
              <strong className="me-auto">{notification.title}</strong>
            </Toast.Header>
            <Toast.Body>
              <p>{notification.message}</p>
              {notification.data.matchedItem && (
                <div className="notification-details">
                  <p className="mb-1">
                    <strong>Match Score:</strong> {Math.round(notification.data.score * 100)}%
                  </p>
                  <p className="mb-1">
                    <strong>Item Type:</strong> {notification.data.matchedItem.itemType}
                  </p>
                  <p className="mb-0">
                    <em>Click to view details</em>
                  </p>
                </div>
              )}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </>
  );
}; 