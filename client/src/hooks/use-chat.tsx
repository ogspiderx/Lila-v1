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
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCount = useRef(0);

  // Poll for new messages every 2 seconds (only checks for new messages, not full reload)
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
        const allMessages = await response.json();
        
        // Only update if we have new messages (to avoid unnecessary re-renders)
        if (allMessages.length !== lastMessageCount.current) {
          setMessages(allMessages);
          lastMessageCount.current = allMessages.length;
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  }, []);

  // Load initial messages with pagination
  const loadInitialMessages = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) return;
      
      const response = await fetch('/api/messages/paginated?limit=20&offset=0', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setHasMoreMessages(data.hasMore);
        lastMessageCount.current = data.messages.length;
      }
    } catch (error) {
      console.error('Error loading initial messages:', error);
    }
  }, []);

  // Load more messages (for pagination)
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    try {
      setIsLoadingMore(true);
      const token = getStoredToken();
      if (!token) return;
      
      const response = await fetch(`/api/messages/paginated?limit=20&offset=${messages.length}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Prepend older messages to the beginning of the array
        setMessages(prev => [...data.messages, ...prev]);
        setHasMoreMessages(data.hasMore);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [messages.length, isLoadingMore, hasMoreMessages]);

  const connect = useCallback(() => {
    const token = getStoredToken();
    if (!token) {
      console.log('No token available');
      return;
    }

    setIsConnected(true);
    
    // Load initial messages with pagination
    loadInitialMessages();
    
    // Start polling every 2 seconds for new messages
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    pollingRef.current = setInterval(pollMessages, 2000);
  }, [loadInitialMessages, pollMessages]);

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
    hasMoreMessages,
    isLoadingMore,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    loadMoreMessages,
  };
}