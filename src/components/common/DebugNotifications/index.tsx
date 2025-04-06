import React from 'react';
import { useNotifications } from '../../../hooks/useNotifications';
import { Button } from 'react-bootstrap';

const DebugNotifications: React.FC = () => {
  const { addNotification, notifications, markAllAsRead, removeNotification } = useNotifications();

  const createTestNotification = () => {
    addNotification({
      type: 'match',
      read: false,
      title: 'Test Match Notification',
      message: 'This is a test match notification',
      data: {
        itemId: '123',
        matchId: '456',
        itemName: 'Test Item',
        matchName: 'Matched Item',
        score: 0.85
      }
    });
  };

  const createTestSystemNotification = () => {
    addNotification({
      type: 'system',
      read: false,
      title: 'Test System Notification',
      message: 'This is a test system notification'
    });
  };

  const clearAllNotifications = () => {
    notifications.forEach(notification => {
      removeNotification(notification.id);
    });
  };

  return (
    <div className="container mt-4">
      <h2>Notification Debugger</h2>
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Create Test Notifications</h5>
            </div>
            <div className="card-body">
              <Button 
                variant="primary" 
                onClick={createTestNotification}
                className="me-2 mb-2"
              >
                Create Match Notification
              </Button>
              <Button 
                variant="info" 
                onClick={createTestSystemNotification}
                className="me-2 mb-2"
              >
                Create System Notification
              </Button>
              <Button 
                variant="warning" 
                onClick={markAllAsRead}
                className="me-2 mb-2"
              >
                Mark All As Read
              </Button>
              <Button 
                variant="danger" 
                onClick={clearAllNotifications}
                className="mb-2"
              >
                Clear All Notifications
              </Button>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Current Notifications ({notifications.length})</h5>
            </div>
            <div className="card-body">
              {notifications.length === 0 ? (
                <p className="text-muted">No notifications</p>
              ) : (
                <ul className="list-group">
                  {notifications.map(notification => (
                    <li key={notification.id} className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h6 className="mb-1">{notification.title}</h6>
                          <p className="mb-1">{notification.message}</p>
                          <small className="text-muted">
                            {notification.read ? 'Read' : 'Unread'} • 
                            {notification.type === 'match' ? ' Match' : ' System'}
                          </small>
                        </div>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => removeNotification(notification.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugNotifications; 