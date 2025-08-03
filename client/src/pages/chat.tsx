import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStoredUser, getStoredToken, logout } from "@/lib/auth";
import { useChat, type Message } from "@/hooks/use-chat";
import { MessageBubble } from "@/components/message-bubble";
import { TypingIndicator } from "@/components/typing-indicator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/emoji-picker";
import { EnhancedFileAttachment, uploadFile } from "@/components/enhanced-file-attachment";
import { VoiceRecorder } from "@/components/voice-recorder";
import { GifPicker } from "@/components/gif-picker";
import { StickerPicker } from "@/components/sticker-picker";
import { Users, LogOut, Wifi, Send, X, Mic, Image, Smile } from "lucide-react";

interface ChatPageProps {
  onLogout: () => void;
}

export default function ChatPage({ onLogout }: ChatPageProps) {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileData, setUploadedFileData] = useState<{ url: string; name: string; type: string; size: string } | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentUser = getStoredUser();
  const token = getStoredToken();

  const {
    isConnected,
    isAuthenticated,
    messages,
    typingStatus,
    hasMoreMessages,
    isLoadingMore,
    forceUpdate,
    connect,
    disconnect,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    sendTyping,
    markMessagesAsSeen,
    loadMoreMessages,
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
    return () => {
      disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [connect, disconnect]);

  // Mark messages as seen when tab gets focus or new messages arrive
  useEffect(() => {
    const handleTabFocus = () => {
      if (messages.length > 0 && currentUser) {
        const unseenReceivedMessages = messages.filter(msg => 
          msg.receiverId === currentUser.id && 
          msg.senderId !== currentUser.id && 
          !msg.seenAt
        );
        
        if (unseenReceivedMessages.length > 0) {
          const messageIds = unseenReceivedMessages.map(msg => msg.id);
          markMessagesAsSeen(messageIds);
        }
      }
    };

    // Mark messages as seen immediately when new messages arrive or page loads
    if (!document.hidden) {
      handleTabFocus();
    }

    window.addEventListener('focus', handleTabFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleTabFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleTabFocus);
      document.removeEventListener('visibilitychange', handleTabFocus);
    };
  }, [messages, currentUser, markMessagesAsSeen]);

  useEffect(() => {
    // Only auto-scroll when typing status changes (someone starts/stops typing)
    // Don't auto-scroll on regular message updates to preserve user's scroll position
    if (typingStatus && typingStatus.isTyping) {
      scrollToBottom(); // Auto-scroll only if near bottom when someone is typing
    }
    console.log('CHAT PAGE: Messages or typing changed, current messages:', messages.length);
  }, [typingStatus]); // Removed messages and forceUpdate from dependencies

  // Auto-scroll only when new messages arrive and user is near bottom
  useEffect(() => {
    if (messages.length > 0) {
      // Check if user is near bottom before auto-scrolling
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
        
        // Only auto-scroll if user is near bottom
        if (isNearBottom) {
          scrollToBottom(true);
        }
      }
    }
  }, [messages.length]); // Only trigger when message count changes, not on every update

  // Debug effect to log message seen status changes
  useEffect(() => {
    const seenMessages = messages.filter(msg => msg.seenAt);
    console.log('CHAT PAGE: Seen messages count:', seenMessages.length);
  }, [messages, forceUpdate]);

  // Global keyboard listener for "/" key to focus chat input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if "/" is pressed and we're not already in an input/textarea
      if (e.key === "/" && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  

  const scrollToBottom = (force = false) => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // Within 100px of bottom
      
      // Only auto-scroll if user is near bottom or if forced (like when sending a message)
      if (force || isNearBottom) {
        messagesContainerRef.current.scrollTop = scrollHeight;
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    if ((!content && !selectedFile) || (content && content.length > 5000) || !otherUserId || !isAuthenticated) return;

    const messageContent = content || (selectedFile ? "📎 File attachment" : "");
    let fileAttachment = uploadedFileData;
    
    // If there's a selected file but no uploaded data, upload it first
    if (selectedFile && !uploadedFileData) {
      try {
        setIsUploading(true);
        setUploadProgress(0);
        
        fileAttachment = await uploadFile(selectedFile, (progress) => {
          setUploadProgress(progress);
        });
        
        setUploadedFileData(fileAttachment);
      } catch (error) {
        console.error('Upload error:', error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    
    sendMessage({
      content: messageContent,
      receiverId: otherUserId,
      replyToId: replyingTo?.id,
      attachmentUrl: fileAttachment?.url,
      attachmentName: fileAttachment?.name,
      attachmentType: fileAttachment?.type,
      attachmentSize: fileAttachment?.size,
    });
    setMessageText("");
    setReplyingTo(null);
    setSelectedFile(null);
    setUploadedFileData(null);
    setUploadProgress(0);
    handleStopTyping();
    // Force scroll to bottom when user sends a message
    setTimeout(() => scrollToBottom(true), 100);
  };

  const handleTyping = (value: string) => {
    setMessageText(value);

    if (value.length > 0 && otherUserId && isAuthenticated) {
      if (!isTyping) {
        setIsTyping(true);
        sendTyping(otherUserId, true);
        
        // Start sending periodic typing updates every 2 seconds
        typingIntervalRef.current = setInterval(() => {
          if (otherUserId) {
            sendTyping(otherUserId, true);
          }
        }, 2000);
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 3 seconds of inactivity  
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 3000);
    } else if (value.length === 0) {
      // If input is cleared, immediately stop typing
      handleStopTyping();
    }
  };

  const handleStopTyping = () => {
    if (isTyping && otherUserId) {
      setIsTyping(false);
      sendTyping(otherUserId, false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((messageText.trim() || selectedFile) && messageText.length <= 5000) {
        handleSendMessage(e as any);
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
  };

  const handleGifSelect = async (gifUrl: string) => {
    if (!otherUserId || !currentUser) return;

    try {
      // Send message with GIF as attachment
      const messageData = {
        content: '🎬 GIF', // Simple content to indicate it's a GIF
        receiverId: otherUserId,
        replyToId: replyingTo?.id,
        attachmentUrl: gifUrl,
        attachmentName: 'animated.gif',
        attachmentType: 'image/gif',
        attachmentSize: 'Unknown',
      };

      const success = await sendMessage(messageData);
      if (success) {
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error sending GIF:', error);
    }
  };

  const handleStickerSelect = async (stickerUrl: string) => {
    if (!otherUserId || !currentUser) return;

    try {
      // Send message with sticker as attachment
      const messageData = {
        content: '🏷️ Sticker', // Simple content to indicate it's a sticker
        receiverId: otherUserId,
        replyToId: replyingTo?.id,
        attachmentUrl: stickerUrl,
        attachmentName: 'sticker.png',
        attachmentType: 'image/png',
        attachmentSize: 'Small',
      };

      const success = await sendMessage(messageData);
      if (success) {
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error sending sticker:', error);
    }
  };

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number) => {
    if (!otherUserId || !currentUser) {
      console.error('Missing user info for voice message');
      return;
    }

    try {
      // Upload voice file
      const formData = new FormData();
      formData.append('voice', audioBlob, `voice-${Date.now()}.webm`);
      formData.append('duration', duration.toString());

      const token = getStoredToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('Uploading voice message...', { duration, blobSize: audioBlob.size });

      const uploadResponse = await fetch('/api/upload/voice', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload voice message: ${uploadResponse.status} ${errorText}`);
      }

      const { url } = await uploadResponse.json();
      console.log('Voice message uploaded successfully:', url);

      // Send message with voice attachment
      const messageData = {
        content: '', // Voice messages can have empty content
        receiverId: otherUserId,
        replyToId: replyingTo?.id,
        voiceMessageUrl: url,
        voiceMessageDuration: duration.toString(),
      };

      console.log('Sending voice message data:', messageData);
      const success = await sendMessage(messageData);
      if (success) {
        setShowVoiceRecorder(false);
        setReplyingTo(null);
        console.log('Voice message sent successfully');
      } else {
        console.error('Failed to send voice message');
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  // Handle scroll to detect when user scrolls to top to load more messages
  const lastScrollCall = useRef<number>(0);
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Throttle scroll events for better performance
    if (Date.now() - lastScrollCall.current < 100) {
      return;
    }
    lastScrollCall.current = Date.now();

    // If user scrolls to within 200px of the top and there are more messages to load
    if (scrollTop < 200 && hasMoreMessages && !isLoadingMore) {
      // Store current scroll height to restore position after loading
      const currentScrollHeight = scrollHeight;

      loadMoreMessages().then(() => {
        // Restore scroll position after new messages are loaded
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight;
        }
      });
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  const handleLogout = () => {
    disconnect();
    logout();
    onLogout();
  };

  const charCount = messageText.length;
  const isDisabled = (!messageText.trim() && !selectedFile) || charCount > 5000 || !isConnected || !isAuthenticated || !otherUserId || isUploading;

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
          onScroll={handleScroll}
          className="h-[calc(100vh-140px)] overflow-y-auto p-4 space-y-4"
        >
          {/* Loading indicator for older messages */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-chat-primary"></div>
                <span className="text-sm">Loading older messages...</span>
              </div>
            </div>
          )}

          {/* No more messages indicator */}
          {!hasMoreMessages && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <span className="text-xs text-gray-400">Beginning of conversation</span>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              onReply={setReplyingTo}
              onEdit={editMessage}
              onDelete={deleteMessage}
              onReaction={reactToMessage}
            />
          ))}

          {typingStatus && typingStatus.isTyping && (
            <TypingIndicator typingStatus={typingStatus} />
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          {/* Reply Preview */}
          {replyingTo && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-chat-primary">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Replying to {replyingTo.senderUsername}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {replyingTo.content}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 p-1 h-6 w-6 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex flex-col space-y-4">
            {/* File attachment preview */}
            {selectedFile && (
              <EnhancedFileAttachment
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onRemove={() => {
                  setSelectedFile(null);
                  setUploadedFileData(null);
                  setUploadProgress(0);
                }}
                disabled={!isConnected}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
              />
            )}

            {/* Voice recorder */}
            {showVoiceRecorder && (
              <VoiceRecorder
                onVoiceRecorded={handleVoiceRecorded}
                onCancel={() => setShowVoiceRecorder(false)}
                className="mb-4"
              />
            )}

            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleStopTyping}
                    className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-chat-primary focus:border-transparent transition-all max-h-32"
                    placeholder={selectedFile ? "Add a message (optional)..." : "Type your message..."}
                    rows={1}
                    disabled={!isConnected}
                  />

                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                </div>

                <div className="flex justify-between items-center mt-2 px-2">
                  <div className="text-xs text-gray-400">
                    <span className={charCount > 5000 ? 'text-red-500' : ''}>{charCount}</span>/5000
                  </div>
                  <div className="text-xs text-gray-400">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* File attachment button */}
                {!selectedFile && !showVoiceRecorder && (
                  <EnhancedFileAttachment
                    selectedFile={null}
                    onFileSelect={setSelectedFile}
                    onRemove={() => setSelectedFile(null)}
                    disabled={!isConnected}
                  />
                )}

                {/* GIF picker button */}
                {!selectedFile && !showVoiceRecorder && (
                  <GifPicker 
                    onGifSelect={handleGifSelect}
                    trigger={
                      <Button
                        type="button"
                        disabled={!isConnected || !isAuthenticated}
                        className="bg-purple-500 text-white p-3 rounded-2xl hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send GIF"
                      >
                        <Image size={16} />
                      </Button>
                    }
                  />
                )}

                {/* Sticker picker button */}
                {!selectedFile && !showVoiceRecorder && (
                  <StickerPicker 
                    onStickerSelect={handleStickerSelect}
                    trigger={
                      <Button
                        type="button"
                        disabled={!isConnected || !isAuthenticated}
                        className="bg-yellow-500 text-white p-3 rounded-2xl hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send Sticker"
                      >
                        <Smile size={16} />
                      </Button>
                    }
                  />
                )}

                {/* Voice message button */}
                {!selectedFile && !showVoiceRecorder && (
                  <Button
                    type="button"
                    onClick={() => setShowVoiceRecorder(true)}
                    disabled={!isConnected || !isAuthenticated}
                    className="bg-gray-500 text-white p-3 rounded-2xl hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send voice message"
                  >
                    <Mic size={16} />
                  </Button>
                )}

                {!showVoiceRecorder && (
                  <Button
                    type="submit"
                    disabled={isDisabled}
                    className="bg-chat-primary text-white p-3 rounded-2xl hover:bg-emerald-600 focus:ring-2 focus:ring-chat-primary focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </Button>
                )}
              </div>
            </div>
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