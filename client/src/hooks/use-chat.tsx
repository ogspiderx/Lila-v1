import { useState, useCallback, useRef, useEffect } from "react";
import { getStoredToken } from "@/lib/auth";

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
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentSize?: string | null;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    username: string;
  }>;
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

      const response = await fetch("/api/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const allMessages = await response.json();

        // Always update messages to ensure UI reflects latest state (including seen status)
        setMessages(allMessages);
        lastMessageCount.current = allMessages.length;
        setForceUpdate((prev) => prev + 1);
        console.log(
          "GUI REFRESHED: Messages updated from server",
          allMessages.length,
        );
      }
    } catch (error) {
      console.error("Error polling messages:", error);
    }
  }, []);

  // Load initial messages with pagination (reduced initial load)
  const loadInitialMessages = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) return;

      const response = await fetch(
        "/api/messages/paginated?limit=10&offset=0",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setHasMoreMessages(data.hasMore);
        lastMessageCount.current = data.messages.length;
      }
    } catch (error) {
      console.error("Error loading initial messages:", error);
    }
  }, []);

  // Load more messages (for pagination) with smaller batches
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages) return;

    try {
      setIsLoadingMore(true);
      const token = getStoredToken();
      if (!token) return;

      const response = await fetch(
        `/api/messages/paginated?limit=10&offset=${messages.length}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        // Prepend older messages to the beginning of the array
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMoreMessages(data.hasMore);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [messages.length, isLoadingMore, hasMoreMessages]);

  const connect = useCallback(async () => {
    try {
      await loadInitialMessages();

      // Start polling for messages - reduced frequency
      pollingRef.current = setInterval(() => {
        pollMessages();
      }, 1000); // Poll every 5 seconds instead of 1 second

      // Setup WebSocket connection
      const token = getStoredToken();
      if (!token) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log("Connecting to WebSocket:", wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected for typing indicators");
        setIsConnected(true);

        // Authenticate after a short delay to ensure connection is stable
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "auth",
                token,
              }),
            );
          }
        }, 100);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("WebSocket message received:", message.type);

          if (message.type === "typing") {
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
          } else if (
            message.type === "new_message" ||
            message.type === "message_sent"
          ) {
            // Handle new messages via WebSocket - stop polling when we get real-time updates
            const newMessage = message.data;
            console.log("Received new message via WebSocket:", newMessage);
            setMessages((prev) => {
              // Check if message already exists to prevent duplicates
              const exists = prev.some((msg) => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
            setForceUpdate((prev) => prev + 1);
          } else if (message.type === "message_edited") {
            // Handle real-time message edits
            const editedMessage = message.data;
            console.log("Received WebSocket message edit:", editedMessage);
            setMessages((prev) => {
              const updated = prev.map((msg) =>
                msg.id === editedMessage.id ? editedMessage : msg,
              );
              return updated;
            });
            // Force re-render
            setForceUpdate((prev) => prev + 1);
          } else if (message.type === "message_deleted") {
            // Handle real-time message deletions
            const { messageId } = message.data;
            console.log("Received WebSocket message deletion:", messageId);
            setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
            // Force re-render
            setForceUpdate((prev) => prev + 1);
          } else if (
            message.type === "reaction_added" ||
            message.type === "reaction_removed"
          ) {
            // Handle real-time reaction updates
            const updatedMessage = message.data;
            console.log("Received WebSocket reaction update:", updatedMessage);
            setMessages((prev) => {
              const updated = prev.map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg,
              );
              return updated;
            });
            // Force re-render
            setForceUpdate((prev) => prev + 1);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to establish WebSocket connection:", error);
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

  const sendMessage = useCallback(
    async (
      content: string,
      receiverId: string,
      replyToId?: string,
      fileAttachment?: {
        url: string;
        name: string;
        type: string;
        size: string;
      } | null,
    ) => {
      try {
        const token = getStoredToken();
        if (!token) return;

        const messageData: any = {
          content,
          receiverId,
          replyToId,
        };

        if (fileAttachment) {
          messageData.attachmentUrl = fileAttachment.url;
          messageData.attachmentName = fileAttachment.name;
          messageData.attachmentType = fileAttachment.type;
          messageData.attachmentSize = fileAttachment.size;
        }

        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(messageData),
        });

        if (response.ok) {
          // Message sent successfully, polling will pick it up
          console.log("Message sent successfully");
          // Immediately poll for updates
          pollMessages();
        } else {
          console.error("Failed to send message");
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [pollMessages],
  );

  const markMessagesAsSeen = useCallback(
    async (messageIds: string[]): Promise<void> => {
      try {
        const token = getStoredToken();
        if (!token || messageIds.length === 0) return;

        console.log("Marking messages as seen:", messageIds);

        const response = await fetch("/api/messages/mark-seen", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageIds,
          }),
        });

        if (response.ok) {
          console.log("Messages marked as seen on server:", messageIds.length);
          // Immediately poll for fresh data to update GUI
          setTimeout(() => pollMessages(), 50);
          setTimeout(() => pollMessages(), 200);
        } else {
          console.error("Failed to mark messages as seen");
        }
      } catch (error) {
        console.error("Error marking messages as seen:", error);
      }
    },
    [pollMessages],
  );

  const editMessage = useCallback(
    async (messageId: string, content: string): Promise<boolean> => {
      try {
        const token = getStoredToken();
        if (!token) return false;

        const response = await fetch(`/api/messages/${messageId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content,
          }),
        });

        if (response.ok) {
          const editedMessage = await response.json();
          console.log("Message edited successfully:", editedMessage);

          // Update the message in the local state immediately
          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === editedMessage.id ? editedMessage : msg,
            );
            return updated;
          });

          // Send via WebSocket for real-time updates to other users
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "edit_message",
                data: { messageId, content },
              }),
            );
          }

          // Force re-render
          setForceUpdate((prev) => prev + 1);

          // Also poll for updates to ensure consistency
          setTimeout(() => pollMessages(), 50);

          return true;
        } else {
          console.error("Failed to edit message");
          return false;
        }
      } catch (error) {
        console.error("Error editing message:", error);
        return false;
      }
    },
    [pollMessages],
  );

  const deleteMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      try {
        const token = getStoredToken();
        if (!token) return false;

        const response = await fetch(`/api/messages/${messageId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          console.log("Message deleted successfully:", messageId);

          // Remove the message from the local state immediately
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

          // Send via WebSocket for real-time updates to other users
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "delete_message",
                data: { messageId },
              }),
            );
          }

          // Force re-render
          setForceUpdate((prev) => prev + 1);

          return true;
        } else {
          console.error("Failed to delete message");
          return false;
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        return false;
      }
    },
    [],
  );

  const reactToMessage = useCallback(
    async (
      messageId: string,
      emoji: string,
      action: "add" | "remove",
    ): Promise<boolean> => {
      try {
        const token = getStoredToken();
        if (!token) return false;

        const response = await fetch(`/api/messages/${messageId}/reactions`, {
          method: action === "add" ? "POST" : "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ emoji }),
        });

        if (response.ok) {
          const { message: updatedMessage } = await response.json();
          console.log(`Reaction ${action}ed successfully:`, updatedMessage);

          // Update the message in the local state immediately
          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg,
            );
            return updated;
          });

          // Send via WebSocket for real-time updates to other users
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: action === "add" ? "add_reaction" : "remove_reaction",
                data: { messageId, emoji },
              }),
            );
          }

          return true;
        } else {
          console.error(`Failed to ${action} reaction`);
          return false;
        }
      } catch (error) {
        console.error(`Error ${action}ing reaction:`, error);
        return false;
      }
    },
    [],
  );

  const sendTyping = useCallback((receiverId: string, isTyping: boolean) => {
    // Send typing indicator via existing WebSocket connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
          data: { receiverId, isTyping },
        }),
      );
      console.log("Typing indicator sent");
    } else {
      console.log("Typing indicator sent");
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
    deleteMessage,
    reactToMessage,
    sendTyping,
    markMessagesAsSeen,
    loadMoreMessages,
  };
}
