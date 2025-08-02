import { useEffect, useRef, useState } from "react";
import { getStoredToken, getStoredUser } from "@/lib/auth";

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  senderUsername: string;
}

export interface TypingStatus {
  senderUsername: string;
  isTyping: boolean;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingStatus, setTypingStatus] = useState<TypingStatus | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    const token = getStoredToken();
    if (!token) return;

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      // Authenticate WebSocket connection
      setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'auth',
            token,
          }));
        }
      }, 100);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'auth_success') {
          setIsAuthenticated(true);
          console.log('WebSocket authenticated');
        } else if (message.type === 'new_message' || message.type === 'message_sent') {
          setMessages(prev => [...prev, message.data]);
        } else if (message.type === 'typing') {
          setTypingStatus(message.data);
          
          // Clear typing indicator after 3 seconds
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          if (message.data.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setTypingStatus(null);
            }, 3000);
          } else {
            setTypingStatus(null);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      setIsAuthenticated(false);
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setIsAuthenticated(false);
    };
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
    setIsAuthenticated(false);
  };

  const sendMessage = (content: string, receiverId: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isAuthenticated) {
      ws.current.send(JSON.stringify({
        type: 'message',
        data: { content, receiverId },
      }));
    }
  };

  const sendTypingStatus = (receiverId: string, isTyping: boolean) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isAuthenticated) {
      ws.current.send(JSON.stringify({
        type: 'typing',
        data: { receiverId, isTyping },
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    isAuthenticated,
    messages,
    setMessages,
    typingStatus,
    connect,
    disconnect,
    sendMessage,
    sendTypingStatus,
  };
}
