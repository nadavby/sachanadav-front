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

const getApiUrl = () => {
  const currentUrl = window.location.origin;
  if (currentUrl.includes('localhost')) {
    return 'http://localhost:3000';
  }
  return window.location.origin;
};

class SocketService {
  private socket: Socket | null = null;
  private notificationCallbacks: NotificationCallback[] = [];
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000; 

  getSocket(): Socket {
    if (!this.socket) {
      this.connect();
    }
    return this.socket!;
  }

  connect() {
    if (this.socket?.connected) {
      return;
    }

    try {
      this.socket = io(getApiUrl(), {
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        withCredentials: true, 
        transports: ['websocket', 'polling'],
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
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

  reconnect() {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }
}

export const socketService = new SocketService(); 