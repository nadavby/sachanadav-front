import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Item } from '../services/item-service';
import imageComparisonService from '../services/imageComparisonService';

export interface Notification {
  id: string;
  type: 'match' | 'system';
  read: boolean;
  createdAt: Date;
  title: string;
  message: string;
  data?: {
    itemId?: string;
    matchId?: string;
    itemName?: string;
    matchName?: string;
    itemImage?: string;
    matchImage?: string;
    score?: number;
    ownerName?: string;
    ownerEmail?: string;
  };
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  fetchMatchNotifications: (userItems: Item[]) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on component mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications);
        
        // Convert string dates back to Date objects
        const notificationsWithDates = parsedNotifications.map((notification: any) => ({
          ...notification,
          createdAt: new Date(notification.createdAt)
        }));
        
        setNotifications(notificationsWithDates);
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(notification => !notification.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const fetchMatchNotifications = async (userItems: Item[]) => {
    try {
      // Avoid processing if there are no items
      if (!userItems || userItems.length === 0) return;

      // Process each of the user's items to check for matches
      for (const item of userItems) {
        if (!item._id) continue;
        
        // Only check for matches if the item is not already resolved
        if (item.isResolved) continue;
        
        try {
          console.log(`Checking matches for item: ${item.name} (${item._id})`);
          const matchesData = await imageComparisonService.findMatches(item._id);
          
          // Skip if no matches or empty matches array
          if (!matchesData || !matchesData.matches || matchesData.matches.length === 0) {
            console.log(`No matches found for item: ${item.name}`);
            continue;
          }
          
          console.log(`Found ${matchesData.matches.length} matches for ${item.name}`);
          
          // Process each match
          for (const match of matchesData.matches) {
            // Skip low confidence matches (less than 60%)
            if (match.score < 0.6) continue;
            
            // Skip if we already have a notification for this match
            const existingNotification = notifications.find(
              notification => 
                notification.data?.itemId === item._id && 
                notification.data?.matchId === match.item._id
            );
            
            if (existingNotification) continue;
            
            // Create a new notification for this match
            addNotification({
              type: 'match',
              read: false,
              title: 'Potential Match Found',
              message: `We found a potential match for your ${item.itemType} item "${item.name}"`,
              data: {
                itemId: item._id,
                matchId: match.item._id,
                itemName: item.name,
                matchName: match.item.name,
                itemImage: item.imgURL,
                matchImage: match.item.imgURL,
                score: match.score,
                ownerName: match.item.ownerName,
                ownerEmail: match.item.ownerEmail
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching matches for item ${item._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error fetching match notifications:', error);
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        fetchMatchNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}; 