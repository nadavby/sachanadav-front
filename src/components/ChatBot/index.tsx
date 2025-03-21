// ChatbotPage.tsx
import { useState } from "react";
import { getAIResponse } from "../../services/chatbot-service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import React from "react";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string | object;
  timestamp: Date;
}

const MessageContent: React.FC<{ content: string | object }> = ({ content }) => {
  if (typeof content === "string") {
    const textWithLineBreaks = content.split("\n").map((text, i) => (
      <React.Fragment key={i}>
        {text}
        {i !== content.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
    
    return <div>{textWithLineBreaks}</div>;
  } else if (typeof content === "object" && content !== null) {
    try {
      if (Array.isArray(content)) {
        return (
          <div className="message-content-array">
            {content.map((item, index) => (
              <div key={index} className="message-content-array-item mb-2">
                <MessageContent content={item} />
              </div>
            ))}
          </div>
        );
      }
      if ('text' in content && typeof content.text === 'string') {
        return <MessageContent content={content.text} />;
      }
      if ('content' in content && typeof content.content === 'string') {
        return <MessageContent content={content.content} />;
      }
      
      return (
        <div className="structured-message">
          {Object.entries(content).map(([key, value]) => (
            <div key={key} className="structured-message-part mb-2">
              <div className="structured-message-key fw-bold">{key}:</div>
              <div className="structured-message-value ps-3">
                {typeof value === 'string' ? (
                  <MessageContent content={value} />
                ) : (
                  <div className="structured-message-nested">
                    <MessageContent content={value} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    } catch (error) {
      console.error("Error rendering structured content:", error);
      return <div>Could not render content: {String(error)}</div>;
    }
  } else {
    return <div>No content</div>;
  }
};

const ChatbotPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: input,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const responseData = await getAIResponse(input);
      
      const aiMessage: ChatMessage = {
        id: generateMessageId(),
        role: "ai",
        content: responseData,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
            const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: "ai",
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-2">
  <button className="btn btn-outline-primary" onClick={() => navigate(-1)}>
    <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back
  </button>
  <h1 className="text-center flex-grow-1 mb-3">TripBuddy🧠</h1>
</div>
      <div className="container d-flex flex-column vh-100 bg-light">
        <div 
          className="flex-grow-1 overflow-auto bg-white p-2 rounded border" 
          style={{ maxHeight: "70vh", minHeight: "40vh" }}
        >  {messages.length === 0 && (
          <div className="d-flex justify-content-start mb-3">
            <div className="p-3 rounded bg-light border" style={{ maxWidth: "75%" }}>
              <strong>Hey! I'm your TripBuddy.</strong> I'm here to recommend places to visit, restaurants, and attractions around the world. Ask me anything! 😊
            </div>
          </div>
        )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`d-flex mb-3 ${
                msg.role === "user" ? "justify-content-end" : "justify-content-start"
              }`}
            >
              <div
                className={`p-3 rounded ${
                  msg.role === "user" ? "bg-primary text-white" : "bg-light border"
                }`}
                style={{ 
                  maxWidth: "75%", 
                  position: "relative",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}
              >
                <div className="mb-1">
                  <MessageContent content={msg.content} />
                </div>
                <div 
                  className={`text-end ${msg.role === "user" ? "text-white-50" : "text-muted"}`}
                  style={{ fontSize: "0.7rem" }}
                >
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="d-flex justify-content-start mb-3">
              <div className="p-3 rounded bg-light border" style={{ maxWidth: "75%" }}>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="input-group p-3 bg-white border-top">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="form-control"
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
      <style>
        {`
          .typing-indicator {
            display: flex;
            align-items: center;
          }
          
          .typing-indicator span {
            height: 8px;
            width: 8px;
            margin: 0 2px;
            background-color: #6c757d;
            border-radius: 80%;
            display: inline-block;
            animation: typing 1.4s infinite ease-in-out both;
          }
          
          .typing-indicator span:nth-child(1) {
            animation-delay: 0s;
          }
          
          .typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          .typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
          }
          
          @keyframes typing {
            0% { transform: scale(1); }
            50% { transform: scale(1.5); }
            100% { transform: scale(1); }
          }

          .structured-message {
            width: 100%;
          }

          .structured-message-key {
            color: #555;
          }

          .structured-message-nested {
            margin-left: 8px;
            padding-left: 8px;
            border-left: 2px solid #eee;
          }

          .message-content-array-item {
            padding: 4px 0;
          }
        `}
      </style>
    </div>
  );
};

export default ChatbotPage;