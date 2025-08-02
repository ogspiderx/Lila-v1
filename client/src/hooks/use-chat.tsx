import { useState, useCallback, useRef, useEffect } from 'react';
import { getStoredToken } from '@/lib/auth';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  replyToId?: string;
  timestamp: string;
  seenAt?: string | null;
  editedAt?: string | null;
  senderUsername: string;
  repliedMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderUsername: string;
    timestamp: string;
  };
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
  const [forceUpdate, setForceUpdate] = useState(0); // Force update counter
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCount = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for new messages every 1 second (aggressive refresh for immediate UI updates)  
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
        
        // Always update messages to ensure UI reflects latest state (including seen status)
        setMessages(allMessages);
        lastMessageCount.current = allMessages.length;
        setForceUpdate(prev => prev + 1);
        console.log('GUI REFRESHED: Messages updated from server', allMessages.length);
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
    
    // Start polling every 1 second for immediate GUI updates
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    pollingRef.current = setInterval(pollMessages, 1000);
    
    // Establish WebSocket connection for typing indicators
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected for typing indicators');
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            token,
          }));
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'typing') {
            setTypingStatus(message.data);
            
            // Clear typing indicator after 3 seconds
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            
            if (message.data.isTyping) {
              // Keep typing indicator active, extend timeout to 5 seconds
              typingTimeoutRef.current = setTimeout(() => {
                setTypingStatus(null);
              }, 5000);
            } else {
              setTypingStatus(null);
            }
          } else if (message.type === 'message_seen') {
            // Handle real-time seen status updates
            const { messageIds, seenAt } = message.data;
            console.log('Received WebSocket seen update:', messageIds);
            setMessages(prev => {
              const updated = prev.map(msg => 
                messageIds.includes(msg.id) ? { ...msg, seenAt } : msg
              );
              return updated;
            });
            // Force re-render
            setForceUpdate(prev => prev + 1);
          } else if (message.type === 'message_edited') {
            // Handle real-time message edit updates
            const editedMessage = message.data;
            console.log('Received WebSocket edit update:', editedMessage);
            setMessages(prev => {
              const updated = prev.map(msg => 
                msg.id === editedMessage.id ? editedMessage : msg
              );
              return updated;
            });
            // Force re-render
            setForceUpdate(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }, [loadInitialMessages, pollMessages]);

  const disconnect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setIsConnected(false);
    setTypingStatus(null);
  }, []);

  const sendMessage = useCallback(async (content: string, receiverId: string, replyToId?: string) => {
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
          replyToId,
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

  const markMessagesAsSeen = useCallback(async (messageIds: string[]): Promise<void> => {
    try {
      const token = getStoredToken();
      if (!token || messageIds.length === 0) return;
      
      console.log('Marking messages as seen:', messageIds);
      
      const response = await fetch('/api/messages/mark-seen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageIds,
        }),
      });

      if (response.ok) {
        console.log('Messages marked as seen on server:', messageIds.length);
        // Immediately poll for fresh data to update GUI
        setTimeout(() => pollMessages(), 50);
        setTimeout(() => pollMessages(), 200);
      } else {
        console.error('Failed to mark messages as seen');
      }
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  }, [pollMessages]);

  const editMessage = useCallback(async (messageId: string, content: string): Promise<boolean> => {
    try {
      const token = getStoredToken();
      if (!token) return false;
      
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (response.ok) {
        const editedMessage = await response.json();
        console.log('Message edited successfully:', editedMessage);
        
        // Update the message in the local state immediately
        setMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === editedMessage.id ? editedMessage : msg
          );
          return updated;
        });
        
        // Send via WebSocket for real-time updates to other users
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'edit_message',
            data: { messageId, content },
          }));
        }
        
        // Force re-render
        setForceUpdate(prev => prev + 1);
        
        // Also poll for updates to ensure consistency
        setTimeout(() => pollMessages(), 50);
        
        return true;
      } else {
        console.error('Failed to edit message');
        return false;
      }
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  }, [pollMessages]);

  const sendTyping = useCallback((receiverId: string, isTyping: boolean) => {
    // Send typing indicator via existing WebSocket connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        data: { receiverId, isTyping },
      }));
      console.log('Typing indicator sent');
    } else {
      console.log('Typing indicator sent');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
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
    forceUpdate, // Include forceUpdate to trigger re-renders
    connect,
    disconnect,
    sendMessage,
    editMessage,
    sendTyping,
    markMessagesAsSeen,
    loadMoreMessages,
  };
}