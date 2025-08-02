import { Message } from "@/hooks/use-chat";
import { getStoredUser } from "@/lib/auth";
import { Reply, Check, CheckCheck, Edit3, X, Check as CheckIcon, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmojiPicker } from "@/components/emoji-picker";
import { FileDisplay } from "@/components/enhanced-file-attachment";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => Promise<boolean>;
  onDelete?: (messageId: string) => Promise<boolean>;
  onReaction?: (messageId: string, emoji: string, action: 'add' | 'remove') => Promise<boolean>;
}

export function MessageBubble({ message, onReply, onEdit, onDelete, onReaction }: MessageBubbleProps) {
  const currentUser = getStoredUser();
  const isSent = message.senderId === currentUser?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  const initials = message.senderUsername?.toUpperCase().substring(0, 2) || "";

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

  const handleDelete = async (e: React.MouseEvent) => {
    if (!onDelete) return;

    // If shift key is held, bypass confirmation
    if (e.shiftKey) {
      await onDelete(message.id);
      return;
    }

    // Otherwise show confirmation dialog
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!onDelete) return;
    setShowDeleteDialog(false);
    await onDelete(message.id);
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (!onReaction || !currentUser) return;

    // Check if user already reacted with this emoji
    const userReaction = message.reactions?.find(
      r => r.emoji === emoji && r.userId === currentUser.id
    );

    if (userReaction) {
      // Remove reaction
      await onReaction(message.id, emoji, 'remove');
    } else {
      // Check if user has reached the limit of 2 reactions
      const userReactionCount = message.reactions?.filter(
        r => r.userId === currentUser.id
      ).length || 0;

      if (userReactionCount >= 2) {
        return; // Don't add more reactions if limit is reached
      }

      // Add reaction
      await onReaction(message.id, emoji, 'add');
    }
  };

  const handleReactionClick = async (emoji: string) => {
    if (!onReaction || !currentUser) return;

    // Check if user already reacted with this emoji
    const userReaction = message.reactions?.find(
      r => r.emoji === emoji && r.userId === currentUser.id
    );

    if (userReaction) {
      // Remove reaction
      await onReaction(message.id, emoji, 'remove');
    } else {
      // Add reaction
      await onReaction(message.id, emoji, 'add');
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
                {message.repliedMessage?.senderUsername || 'Unknown'}
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
              <div className="text-gray-900 break-words">
                {(() => {
                  const MAX_LENGTH = 300;
                  const isLongMessage = message.content.length > MAX_LENGTH;
                  const shouldTruncate = isLongMessage && !isExpanded;
                  const displayContent = shouldTruncate 
                    ? message.content.substring(0, MAX_LENGTH) + "..."
                    : message.content;

                  return (
                    <>
                      <p>{displayContent}</p>
                      {isLongMessage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 p-0 h-auto text-blue-600 hover:text-blue-800 hover:bg-transparent"
                          onClick={() => setIsExpanded(!isExpanded)}
                        >
                          <span className="text-sm font-medium">
                            {isExpanded ? "Show less" : "Read more"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      )}
                    </>
                  );
                })()}
                {message.editedAt && (
                  <span className="text-xs text-gray-400 ml-2">(edited)</span>
                )}
              </div>
              
              {/* File attachment display */}
              {message.attachmentUrl && message.attachmentName && message.attachmentType && message.attachmentSize && (
                <FileDisplay
                  attachment={{
                    url: message.attachmentUrl,
                    name: message.attachmentName,
                    type: message.attachmentType,
                    size: message.attachmentSize,
                  }}
                />
              )}

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
                    title="Delete message (hold Shift to skip confirmation)"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                {onReaction && (
                  <EmojiPicker 
                    onEmojiSelect={handleEmojiSelect}
                    disabled={!currentUser || (message.reactions?.filter(r => r.userId === currentUser?.id).length || 0) >= 2}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {/* Group reactions by emoji */}
            {Object.entries(
              message.reactions.reduce((acc, reaction) => {
                if (!acc[reaction.emoji]) {
                  acc[reaction.emoji] = [];
                }
                acc[reaction.emoji].push(reaction);
                return acc;
              }, {} as Record<string, typeof message.reactions>)
            ).map(([emoji, reactions]) => {
              const userReacted = reactions.some(r => r.userId === currentUser?.id);
              return (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 py-1 text-xs border rounded-full ${
                    userReacted 
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  } hover:bg-gray-200 dark:hover:bg-gray-700`}
                  onClick={() => handleReactionClick(emoji)}
                  disabled={!onReaction}
                  title={reactions.map(r => r.username).join(', ')}
                >
                  <span className="mr-1">{emoji}</span>
                  <span>{reactions.length}</span>
                </Button>
              );
            })}
          </div>
        )}

        <div className="flex items-center space-x-2 mt-1">
          {isSent && <span className="text-xs text-gray-400">{timestamp}</span>}
          <span className="text-xs text-gray-500">{message.senderUsername || 'Unknown User'}</span>
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

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}