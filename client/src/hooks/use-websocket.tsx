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

  const connect = () => {
    const token = getStoredToken();
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      // Authenticate WebSocket connection
      ws.current?.send(JSON.stringify({
        type: 'auth',
        token,
      }));
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'new_message' || message.type === 'message_sent') {
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
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    ws.current.onerror = () => {
      setIsConnected(false);
    };
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  };

  const sendMessage = (content: string, receiverId: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'message',
        data: { content, receiverId },
      }));
    }
  };

  const sendTypingStatus = (receiverId: string, isTyping: boolean) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
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
    };
  }, []);

  return {
    isConnected,
    messages,
    setMessages,
    typingStatus,
    connect,
    disconnect,
    sendMessage,
    sendTypingStatus,
  };
}
