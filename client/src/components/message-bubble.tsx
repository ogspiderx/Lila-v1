import { Message } from "@/hooks/use-websocket";
import { getStoredUser } from "@/lib/auth";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const currentUser = getStoredUser();
  const isSent = message.senderId === currentUser?.id;
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  const initials = message.senderUsername.toUpperCase().substring(0, 2);

  return (
    <div className={`flex items-start space-x-3 ${isSent ? 'justify-end' : ''}`}>
      {!isSent && (
        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {initials}
        </div>
      )}
      
      <div className={`flex-1 ${isSent ? 'flex flex-col items-end' : ''}`}>
        <div className={`${isSent ? 'bg-sent-message' : 'bg-received-message'} rounded-2xl ${isSent ? 'rounded-tr-md' : 'rounded-tl-md'} px-4 py-3 max-w-xs`}>
          <p className="text-gray-900 break-words">{message.content}</p>
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
