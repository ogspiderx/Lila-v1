
import { useState, useEffect, useRef, useMemo } from "react";
import { Message } from "@/hooks/use-chat";
import { MessageBubble } from "@/components/message-bubble";

interface VirtualMessageListProps {
  messages: Message[];
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => Promise<boolean>;
  onDelete?: (messageId: string) => Promise<boolean>;
  onReaction?: (messageId: string, emoji: string, action: 'add' | 'remove') => Promise<boolean>;
  containerHeight: number;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

const ITEM_HEIGHT = 100; // Estimated message height
const BUFFER_SIZE = 5; // Number of items to render outside viewport

export function VirtualMessageList({
  messages,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  containerHeight,
  isLoadingMore,
  onLoadMore
}: VirtualMessageListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / ITEM_HEIGHT);
    const end = Math.min(
      start + Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE,
      messages.length
    );
    
    return {
      start: Math.max(0, start - BUFFER_SIZE),
      end
    };
  }, [scrollTop, containerHeight, messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setScrollTop(scrollTop);

    // Load more messages when near the top
    if (scrollTop < 200 && !isLoadingMore) {
      onLoadMore();
    }
  };

  const totalHeight = messages.length * ITEM_HEIGHT;
  const offsetY = visibleRange.start * ITEM_HEIGHT;

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto"
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-chat-primary"></div>
              <span className="text-sm">Loading older messages...</span>
            </div>
          </div>
        )}
        
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'relative'
          }}
        >
          {messages.slice(visibleRange.start, visibleRange.end).map((message, index) => (
            <div
              key={message.id}
              style={{
                height: ITEM_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px'
              }}
            >
              <MessageBubble
                message={message}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReaction={onReaction}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
