import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import chatSocketService, { IChatMessage } from '../../services/chat.socket.service';
import itemService, { Item } from '../../services/item-service';
import matchService from '../../services/match-service';
import './ChatRoom.css';

interface ChatRoomProps {
  matchId: string;
  onClose?: () => void;
  userItem?: Item;
  otherItem?: Item;
  otherUserId?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ matchId, onClose, userItem, otherItem, otherUserId }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser?._id) return;

    // Connect to chat socket and join room
    chatSocketService.connect();
    chatSocketService.registerUser(currentUser._id);
    chatSocketService.joinChat(matchId);

    // Set up event listeners
    const handleChatHistory = (history: IChatMessage[]) => {
      setMessages(history);
      setIsLoading(false);
      // Mark all received messages as read
      history.forEach(msg => {
        if (msg.senderId !== currentUser._id && msg.status !== 'read') {
          chatSocketService.updateMessageStatus(msg._id, 'read');
        }
      });
    };

    const handleNewMessage = (message: IChatMessage) => {
      setMessages(prev => [...prev, message]);
      // Mark received message as read
      if (message.senderId !== currentUser._id) {
        chatSocketService.updateMessageStatus(message._id, 'read');
      }
    };

    const handleError = (error: { message: string }) => {
      console.error('Chat error:', error);
      // You might want to show this error to the user
    };

    chatSocketService.onChatHistory(handleChatHistory);
    chatSocketService.onNewMessage(handleNewMessage);
    chatSocketService.onError(handleError);

    // Cleanup
    return () => {
      chatSocketService.leaveChat(matchId);
      chatSocketService.offChatHistory(handleChatHistory);
      chatSocketService.offNewMessage(handleNewMessage);
      chatSocketService.offError(handleError);
    };
  }, [matchId, currentUser?._id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?._id || !otherUserId) return;

    chatSocketService.sendMessage(matchId, currentUser._id, otherUserId, newMessage.trim());
    setNewMessage('');
  };

  const handleConfirmMatch = async () => {
    if (!userItem || !otherItem) return;
    
    try {
      setIsConfirming(true);
      
      // Mark both items as resolved
      await Promise.all([
        itemService.updateItem(userItem._id!, { isResolved: true }),
        itemService.updateItem(otherItem._id!, { isResolved: true })
      ]);

      // Delete the match
      await matchService.deleteById(matchId).request;

      // Navigate to dashboard
      navigate('/dashboard', { 
        state: { 
          success: true, 
          message: 'Match confirmed and items marked as resolved!' 
        } 
      });
    } catch (error) {
      console.error('Error confirming match:', error);
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="chat-room loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h3>Chat</h3>
        <div className="chat-actions">
          {userItem && otherItem && (
            <button 
              className="btn btn-success me-2" 
              onClick={handleConfirmMatch}
              disabled={isConfirming}
            >
              <FontAwesomeIcon icon={faCheck} className="me-2" />
              Confirm Match
            </button>
          )}
          {onClose && (
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`message ${message.senderId === currentUser?._id ? 'sent' : 'received'}`}
            >
              <div className="message-content">{message.content}</div>
              <div className="message-meta">
                {new Date(message.timestamp).toLocaleTimeString()}
                {message.senderId === currentUser?._id && (
                  <span className="message-status">{message.status}</span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={1000}
        />
        <button type="submit" disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatRoom; 