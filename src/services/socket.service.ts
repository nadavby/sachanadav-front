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

class SocketService {
  private socket: Socket | null = null;
  private notificationCallbacks: NotificationCallback[] = [];
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000; // 3 seconds

  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io('http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
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
    this.connect();
  }
}

export const socketService = new SocketService(); 