import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStoredUser, getStoredToken, logout } from "@/lib/auth";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "@/components/message-bubble";
import { TypingIndicator } from "@/components/typing-indicator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Users, LogOut, Wifi, Send, Smile } from "lucide-react";

interface ChatPageProps {
  onLogout: () => void;
}

export default function ChatPage({ onLogout }: ChatPageProps) {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const currentUser = getStoredUser();
  const token = getStoredToken();
  
  const {
    isConnected,
    isAuthenticated,
    messages,
    typingStatus,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
  } = useChat();

  // Fetch other user info
  const { data: otherUser } = useQuery({
    queryKey: ["/api/users/other"],
    queryFn: async () => {
      const response = await fetch("/api/users/other", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch other user");
      return response.json();
    },
    enabled: !!token,
  });

  // Fetch initial messages
  const { data: initialMessages } = useQuery({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const response = await fetch("/api/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!token,
  });

  // Get other user info
  const otherUsername = otherUser?.username || (currentUser?.username === "user1" ? "user2" : "user1");
  const otherUserId = otherUser?.id;

  // Remove this effect as messages are now handled by the polling hook

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingStatus]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    if (!content || content.length > 500 || !otherUserId || !isAuthenticated) return;

    sendMessage(content, otherUserId);
    setMessageText("");
    handleStopTyping();
  };

  const handleTyping = (value: string) => {
    setMessageText(value);
    
    if (!isTyping && value.length > 0 && otherUserId && isAuthenticated) {
      setIsTyping(true);
      sendTyping();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (messageText.trim() && messageText.length <= 500) {
        handleSendMessage(e);
      }
    }
  };

  const handleLogout = () => {
    disconnect();
    logout();
    onLogout();
  };

  const charCount = messageText.length;
  const isDisabled = !messageText.trim() || charCount > 500 || !isConnected || !isAuthenticated || !otherUserId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-chat-primary rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {currentUser?.username.toUpperCase().substring(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{currentUser?.username}</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected && isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected && isAuthenticated ? 'Ready' : isConnected ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 flex items-center">
              <Users className="mr-1" size={16} />
              <span>2 users online</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600"
              title="Logout"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 max-w-4xl mx-auto">
        <div 
          ref={messagesContainerRef}
          className="h-[calc(100vh-140px)] overflow-y-auto p-4 space-y-4"
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {typingStatus && typingStatus.isTyping && (
            <TypingIndicator typingStatus={typingStatus} />
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Textarea
                  value={messageText}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleStopTyping}
                  className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-chat-primary focus:border-transparent transition-all max-h-32"
                  placeholder="Type your message..."
                  rows={1}
                  disabled={!isConnected}
                />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Add emoji"
                >
                  <Smile size={16} />
                </Button>
              </div>
              
              <div className="flex justify-between items-center mt-2 px-2">
                <div className="text-xs text-gray-400">
                  <span className={charCount > 500 ? 'text-red-500' : ''}>{charCount}</span>/500
                </div>
                <div className="text-xs text-gray-400">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isDisabled}
              className="bg-chat-primary text-white p-3 rounded-2xl hover:bg-emerald-600 focus:ring-2 focus:ring-chat-primary focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      </main>

      {/* Connection Alert */}
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <Wifi className="text-red-200" size={16} />
            <span>Connection lost. Attempting to reconnect...</span>
          </div>
        </div>
      )}
      {isConnected && !isAuthenticated && (
        <div className="fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <Wifi className="text-yellow-200" size={16} />
            <span>Authenticating...</span>
          </div>
        </div>
      )}
    </div>
  );
}
