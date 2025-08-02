import { TypingStatus } from "@/hooks/use-websocket";

interface TypingIndicatorProps {
  typingStatus: TypingStatus;
}

export function TypingIndicator({ typingStatus }: TypingIndicatorProps) {
  const initials = typingStatus.senderUsername.toUpperCase().substring(0, 2);

  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
        {initials}
      </div>
      <div className="flex-1">
        <div className="bg-received-message rounded-2xl rounded-tl-md px-4 py-3 max-w-xs">
          <div className="flex space-x-1 items-center">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            <span className="text-sm text-gray-500 ml-2">typing...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
