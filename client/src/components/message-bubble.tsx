import { Message } from "@/hooks/use-chat";
import { getStoredUser } from "@/lib/auth";
import { Reply, Check, CheckCheck, Edit3, X, Check as CheckIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => Promise<boolean>;
  onDelete?: (messageId: string) => Promise<boolean>;
}

export function MessageBubble({ message, onReply, onEdit, onDelete }: MessageBubbleProps) {
  const currentUser = getStoredUser();
  const isSent = message.senderId === currentUser?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  const initials = message.senderUsername.toUpperCase().substring(0, 2);

  const handleEditSubmit = async () => {
    if (!onEdit || editContent.trim() === message.content.trim()) {
      setIsEditing(false);
      return;
    }
    
    setIsSubmitting(true);
    const success = await onEdit(message.id, editContent.trim());
    setIsSubmitting(false);
    
    if (success) {
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this message?');
    if (confirmed) {
      await onDelete(message.id);
    }
  };

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
          
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyPress}
                className="text-sm border-gray-300 focus:border-blue-500"
                disabled={isSubmitting}
                autoFocus
              />
              <div className="flex gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditCancel}
                  disabled={isSubmitting}
                  className="p-1 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditSubmit}
                  disabled={isSubmitting || editContent.trim() === ''}
                  className="p-1 h-6 w-6"
                >
                  <CheckIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-900 break-words">
                {message.content}
                {message.editedAt && (
                  <span className="text-xs text-gray-400 ml-2">(edited)</span>
                )}
              </p>
              
              {/* Action buttons */}
              <div className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {onReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => onReply(message)}
                  >
                    <Reply className="h-3 w-3" />
                  </Button>
                )}
                {isSent && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
                {isSent && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mt-1">
          {isSent && <span className="text-xs text-gray-400">{timestamp}</span>}
          <span className="text-xs text-gray-500">{message.senderUsername}</span>
          {!isSent && <span className="text-xs text-gray-400">{timestamp}</span>}
          {isSent && (
            <div className="flex items-center" title={message.seenAt ? "Seen" : "Delivered"}>
              {message.seenAt ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : (
                <Check className="h-3 w-3 text-gray-400" />
              )}
            </div>
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
