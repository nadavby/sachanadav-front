import { io, Socket } from 'socket.io-client';

export interface MatchNotification {
  type: 'MATCH_FOUND';
  title: string;
  message: string;
  data: {
    matchedItemId: string;
    score: number;
    matchedItem: {
      description: string;
      imageUrl: string;
      itemType: string;
      ownerName: string;
      ownerEmail: string;
    }
  }
}

export type NotificationCallback = (notification: MatchNotification) => void;

// Get API URL based on current environment
const getApiUrl = () => {
  // Get the current frontend URL
  const currentUrl = window.location.origin;
  // If we're on localhost, use explicit port 3000 for backend
  if (currentUrl.includes('localhost')) {
    return 'http://localhost:3000';
  }
  // In production, assume backend is at the same domain (potentially different path)
  return window.location.origin;
};

class SocketService {
  private socket: Socket | null = null;
  private notificationCallbacks: NotificationCallback[] = [];
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000; // 3 seconds

  // Get access to the socket instance
  getSocket(): Socket {
    if (!this.socket) {
      this.connect();
    }
    return this.socket!;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      console.log(`Attempting to connect to socket server at ${getApiUrl()}`);
      
      this.socket = io(getApiUrl(), {
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        withCredentials: true, // Important for CORS with credentials
        transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('notification', (notification: MatchNotification) => {
      console.log('Received notification:', notification);
      this.notificationCallbacks.forEach(callback => callback(notification));
    });
  }

  authenticate(userId: string) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!userId) {
      console.error('User ID is required for authentication');
      return;
    }

    console.log('Authenticating socket with user ID:', userId);
    this.socket.emit('authenticate', { userId });
  }

  onNotification(callback: NotificationCallback) {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.notificationCallbacks = [];
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Method to manually reconnect if needed
  reconnect() {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }
}

export const socketService = new SocketService(); 