import { Message } from "@/hooks/use-websocket";
import { getStoredUser } from "@/lib/auth";
import { Reply } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  onReply?: (message: Message) => void;
}

export function MessageBubble({ message, onReply }: MessageBubbleProps) {
  const currentUser = getStoredUser();
  const isSent = message.senderId === currentUser?.id;
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  const initials = message.senderUsername.toUpperCase().substring(0, 2);

  return (
    <div className={`group flex items-start space-x-3 ${isSent ? 'justify-end' : ''}`}>
      {!isSent && (
        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {initials}
        </div>
      )}
      
      <div className={`flex-1 ${isSent ? 'flex flex-col items-end' : ''}`}>
        <div className={`${isSent ? 'bg-sent-message' : 'bg-received-message'} rounded-2xl ${isSent ? 'rounded-tr-md' : 'rounded-tl-md'} px-4 py-3 max-w-xs relative`}>
          {/* Replied message preview */}
          {message.repliedMessage && (
            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-2 border-gray-300 dark:border-gray-500 text-sm">
              <p className="text-gray-600 dark:text-gray-300 font-medium text-xs mb-1">
                {message.repliedMessage.senderUsername}
              </p>
              <p className="text-gray-700 dark:text-gray-200 line-clamp-2">
                {message.repliedMessage.content}
              </p>
            </div>
          )}
          
          <p className="text-gray-900 break-words">{message.content}</p>
          
          {/* Reply button */}
          {onReply && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => onReply(message)}
            >
              <Reply className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mt-1">
          {isSent && <span className="text-xs text-gray-400">{timestamp}</span>}
          <span className="text-xs text-gray-500">{message.senderUsername}</span>
          {!isSent && <span className="text-xs text-gray-400">{timestamp}</span>}
          {isSent && (
            <i className="fas fa-check-double text-chat-primary text-xs" title="Delivered"></i>
          )}
        </div>
      </div>
      
      {isSent && (
        <div className="w-8 h-8 bg-chat-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
          {initials}
        </div>
      )}
    </div>
  );
}
