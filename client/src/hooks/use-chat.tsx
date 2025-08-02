import { useState, useCallback, useRef, useEffect } from 'react';
import { getStoredToken } from '@/lib/auth';

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

export function useChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingStatus, setTypingStatus] = useState<TypingStatus | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for new messages every 2 seconds
  const pollMessages = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) return;
      
      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const newMessages = await response.json();
        setMessages(newMessages);
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  }, []);

  const connect = useCallback(() => {
    const token = getStoredToken();
    if (!token) {
      console.log('No token available');
      return;
    }

    setIsConnected(true);
    
    // Initial message fetch
    pollMessages();
    
    // Start polling every 2 seconds
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    pollingRef.current = setInterval(pollMessages, 2000);
  }, [pollMessages]);

  const disconnect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback(async (content: string, receiverId: string) => {
    try {
      const token = getStoredToken();
      if (!token) return;
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          receiverId,
        }),
      });

      if (response.ok) {
        // Message sent successfully, polling will pick it up
        console.log('Message sent successfully');
        // Immediately poll for updates
        pollMessages();
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [pollMessages]);

  const sendTyping = useCallback(() => {
    // For now, just a stub - typing indicators would need server-side state
    console.log('Typing indicator sent');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    isAuthenticated: isConnected, // Simplified - if connected, we're authenticated
    messages,
    typingStatus,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
  };
}