// services/socket.service.ts
import { io, Socket } from 'socket.io-client';
import { INotification } from './notification-service';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(userId: string) {
    if (this.socket?.connected) {
      console.log('[SOCKET] Already connected');
      return;
    }

    this.socket = io('http://localhost:3000', {
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('[SOCKET] Connected');
      this.socket?.emit('authenticate', { userId });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SOCKET] Connection error:', error);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  onMatchNotification(callback: (notification: INotification) => void) {
    console.log('[SOCKET] Registering match_notification listener');
    this.socket?.on('match_notification', (data: INotification) => {
      console.log('[SOCKET] Received match notification:', data);
      callback(data);
    });
  }

  offMatchNotification(callback: (notification: INotification) => void) {
    this.socket?.off('match_notification', callback);
  }
}

export default SocketService.getInstance();
