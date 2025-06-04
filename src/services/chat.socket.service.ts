import { io, Socket } from 'socket.io-client';

export interface IChatMessage {
  _id: string;
  matchId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

class ChatSocketService {
  private socket: Socket | null = null;
  private static instance: ChatSocketService;

  private constructor() {}

  static getInstance(): ChatSocketService {
    if (!ChatSocketService.instance) {
      ChatSocketService.instance = new ChatSocketService();
    }
    return ChatSocketService.instance;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('[CHAT SOCKET] Already connected');
      return;
    }

    this.socket = io('http://localhost:3000/chat', {
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('[CHAT SOCKET] Connected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[CHAT SOCKET] Connection error:', error);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinChat(matchId: string) {
    console.log('[CHAT SOCKET] Joining chat:', matchId);
    this.socket?.emit('join_chat', matchId);
  }

  leaveChat(matchId: string) {
    console.log('[CHAT SOCKET] Leaving chat:', matchId);
    this.socket?.emit('leave_chat', matchId);
  }

  sendMessage(matchId: string, senderId: string, content: string) {
    console.log('[CHAT SOCKET] Sending message:', { matchId, content });
    this.socket?.emit('send_message', { matchId, senderId, content });
  }

  updateMessageStatus(messageId: string, status: 'delivered' | 'read') {
    console.log('[CHAT SOCKET] Updating message status:', { messageId, status });
    this.socket?.emit('update_message_status', { messageId, status });
  }

  onChatHistory(callback: (messages: IChatMessage[]) => void) {
    this.socket?.on('chat_history', callback);
  }

  onNewMessage(callback: (message: IChatMessage) => void) {
    this.socket?.on('new_message', callback);
  }

  onMessageStatusUpdated(callback: (data: { messageId: string; status: string }) => void) {
    this.socket?.on('message_status_updated', callback);
  }

  onError(callback: (error: { message: string }) => void) {
    this.socket?.on('error', callback);
  }

  offChatHistory(callback: (messages: IChatMessage[]) => void) {
    this.socket?.off('chat_history', callback);
  }

  offNewMessage(callback: (message: IChatMessage) => void) {
    this.socket?.off('new_message', callback);
  }

  offMessageStatusUpdated(callback: (data: { messageId: string; status: string }) => void) {
    this.socket?.off('message_status_updated', callback);
  }

  offError(callback: (error: { message: string }) => void) {
    this.socket?.off('error', callback);
  }
}

export default ChatSocketService.getInstance(); 