import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { loginSchema, insertMessageSchema, editMessageSchema, reactionSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// WebSocket connection tracking
const connections = new Map<string, WebSocket>();

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads';
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow a wide variety of file types
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml', 'image/tiff', 'image/x-icon',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/rtf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet', 'application/vnd.oasis.opendocument.presentation',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip',
      'application/x-compressed', 'application/x-zip-compressed',
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/x-m4a',
      // Video
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/x-matroska', 'video/webm', 'video/x-msvideo',
      // Code/Text files
      'application/javascript', 'text/javascript', 'application/json', 'application/xml', 'text/xml', 'text/yaml', 'text/markdown',
      'text/x-python', 'text/x-java-source', 'text/x-c', 'text/x-php', 'text/x-ruby', 'text/html', 'text/css',
      // Other common formats
      'application/octet-stream', 'application/x-executable', 'application/x-binary'
    ];
    
    // Check file extension as backup for octet-stream files
    const allowedExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico|pdf|doc|docx|txt|rtf|csv|xls|xlsx|ppt|pptx|odt|ods|odp|zip|rar|7z|tar|gz|mp3|wav|flac|aac|ogg|m4a|mp4|avi|mov|wmv|flv|mkv|webm|js|ts|tsx|jsx|html|css|json|xml|yaml|yml|md|py|java|cpp|c|h|php|rb|go|rs|swift|kt|scala|sql|sh|bat|ps1|log|ini|cfg|conf|env|exe|dmg|app)$/i;
    
    const mimetypeAllowed = allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/');
    const extensionAllowed = allowedExtensions.test(file.originalname);
    
    if (mimetypeAllowed || extensionAllowed) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported. Please contact support if you need this file type enabled.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default users
  await storage.initializeUsers();

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({ 
        token, 
        user: { id: user.id, username: user.username } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Get messages endpoint
  // Get other user info endpoint
  app.get("/api/users/other", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      const currentUser = await storage.getUser(decoded.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const otherUsername = currentUser.username === "user1" ? "user2" : "user1";
      const otherUser = await storage.getUserByUsername(otherUsername);
      if (!otherUser) {
        return res.status(404).json({ message: "Other user not found" });
      }

      res.json({ id: otherUser.id, username: otherUser.username });
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      // Get the other user
      const currentUser = await storage.getUser(decoded.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const otherUsername = currentUser.username === "user1" ? "user2" : "user1";
      const otherUser = await storage.getUserByUsername(otherUsername);
      if (!otherUser) {
        return res.status(404).json({ message: "Other user not found" });
      }

      const messages = await storage.getMessagesBetweenUsers(currentUser.id, otherUser.id);
      
      // Include sender username and replied message info in response
      const messagesWithUsernames = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          let repliedMessage = null;
          
          if (message.replyToId) {
            const replied = await storage.getMessageById(message.replyToId);
            if (replied) {
              const repliedSender = await storage.getUser(replied.senderId);
              repliedMessage = {
                ...replied,
                senderUsername: repliedSender?.username || "Unknown",
              };
            }
          }
          
          return {
            ...message,
            senderUsername: sender?.username || "Unknown",
            repliedMessage,
          };
        })
      );

      res.json(messagesWithUsernames);
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // GET route for paginated messages
  app.get("/api/messages/paginated", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      // Parse pagination parameters
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // Max 50 messages per request
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get the other user
      const currentUser = await storage.getUser(decoded.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const otherUsername = currentUser.username === "user1" ? "user2" : "user1";
      const otherUser = await storage.getUserByUsername(otherUsername);
      if (!otherUser) {
        return res.status(404).json({ message: "Other user not found" });
      }

      const { messages, hasMore } = await storage.getMessagesBetweenUsersPaginated(currentUser.id, otherUser.id, limit, offset);
      
      // Include sender username and replied message info in response
      const messagesWithUsernames = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          let repliedMessage = null;
          
          if (message.replyToId) {
            const replied = await storage.getMessageById(message.replyToId);
            if (replied) {
              const repliedSender = await storage.getUser(replied.senderId);
              repliedMessage = {
                ...replied,
                senderUsername: repliedSender?.username || "Unknown",
              };
            }
          }
          
          return {
            ...message,
            senderUsername: sender?.username || "Unknown",
            repliedMessage,
          };
        })
      );

      res.json({ 
        messages: messagesWithUsernames,
        hasMore,
        limit,
        offset
      });
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // POST route for sending messages via HTTP
  app.post("/api/messages", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      const { content, receiverId, replyToId, attachmentUrl, attachmentName, attachmentType, attachmentSize } = insertMessageSchema.parse(req.body);
      
      // Sanitize content
      const sanitizedContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      const newMessage = await storage.createMessage({
        content: sanitizedContent,
        senderId: decoded.userId,
        receiverId,
        replyToId,
        attachmentUrl,
        attachmentName,
        attachmentType,
        attachmentSize,
      });

      const sender = await storage.getUser(decoded.userId);
      let repliedMessage = null;
      
      if (newMessage.replyToId) {
        const replied = await storage.getMessageById(newMessage.replyToId);
        if (replied) {
          const repliedSender = await storage.getUser(replied.senderId);
          repliedMessage = {
            ...replied,
            senderUsername: repliedSender?.username || "Unknown",
          };
        }
      }
      
      const messageWithUsername = {
        ...newMessage,
        senderUsername: sender?.username || "Unknown",
        repliedMessage,
      };

      res.json(messageWithUsername);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // POST route for marking messages as seen
  app.post("/api/messages/mark-seen", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      const { messageIds } = z.object({
        messageIds: z.array(z.string()).min(1)
      }).parse(req.body);
      
      await storage.markMessagesAsSeen(messageIds, decoded.userId);

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking messages as seen:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to mark messages as seen" });
    }
  });

  // PUT route for editing messages
  app.put("/api/messages/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      const messageId = req.params.id;
      const { content } = editMessageSchema.parse(req.body);
      
      // Sanitize content
      const sanitizedContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      const editedMessage = await storage.editMessage(messageId, sanitizedContent, decoded.userId);
      
      if (!editedMessage) {
        return res.status(404).json({ message: "Message not found or not authorized" });
      }

      const sender = await storage.getUser(decoded.userId);
      let repliedMessage = null;
      
      if (editedMessage.replyToId) {
        const replied = await storage.getMessageById(editedMessage.replyToId);
        if (replied) {
          const repliedSender = await storage.getUser(replied.senderId);
          repliedMessage = {
            ...replied,
            senderUsername: repliedSender?.username || "Unknown",
          };
        }
      }
      
      const messageWithUsername = {
        ...editedMessage,
        senderUsername: sender?.username || "Unknown",
        repliedMessage,
      };

      res.json(messageWithUsername);
    } catch (error) {
      console.error('Error editing message:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to edit message" });
    }
  });

  // DELETE route for deleting messages
  app.delete("/api/messages/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      const messageId = req.params.id;
      
      const deleted = await storage.deleteMessage(messageId, decoded.userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Message not found or not authorized" });
      }

      res.json({ success: true, messageId });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // POST route for adding reactions
  app.post("/api/messages/:id/reactions", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      const messageId = req.params.id;
      const { emoji } = z.object({ emoji: z.string().min(1).max(10) }).parse(req.body);
      
      const updatedMessage = await storage.addReaction(messageId, emoji, decoded.userId);
      
      if (!updatedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json({ success: true, message: updatedMessage });
    } catch (error) {
      console.error('Error adding reaction:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  // DELETE route for removing reactions
  app.delete("/api/messages/:id/reactions", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      const messageId = req.params.id;
      const { emoji } = z.object({ emoji: z.string().min(1).max(10) }).parse(req.body);
      
      const updatedMessage = await storage.removeReaction(messageId, emoji, decoded.userId);
      
      if (!updatedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json({ success: true, message: updatedMessage });
    } catch (error) {
      console.error('Error removing reaction:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  // File upload route
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      jwt.verify(token, JWT_SECRET) as { userId: string };

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/api/files/${req.file.filename}`;
      const fileSize = (req.file.size / 1024).toFixed(2) + ' KB';

      res.json({
        url: fileUrl,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: fileSize
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // File serving route
  app.get("/api/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving file:', err);
        res.status(404).json({ message: "File not found" });
      }
    });
  });

  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/api/ws',
    clientTracking: true
  });

  console.log('WebSocket server created on path /api/ws');

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established from:', req.socket.remoteAddress);
    let userId: string | null = null;

    // Don't ping immediately as it might cause issues
    // Send a welcome message instead
    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('WebSocket message received:', message.type, 'from user:', userId);

        if (message.type === 'ping') {
          // Simple ping-pong test
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (message.type === 'auth') {
          // Authenticate WebSocket connection
          try {
            const decoded = jwt.verify(message.token, JWT_SECRET) as { userId: string };
            userId = decoded.userId;
            connections.set(userId, ws);
            
            console.log('WebSocket authenticated for user:', userId);
            ws.send(JSON.stringify({ type: 'auth_success' }));
          } catch (error) {
            console.error('WebSocket auth error:', error);
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
            return;
          }
        } else if (message.type === 'message' && userId) {
          // Handle new message
          const { content, receiverId, replyToId } = insertMessageSchema.parse(message.data);
          
          // Sanitize content
          const sanitizedContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          
          const newMessage = await storage.createMessage({
            content: sanitizedContent,
            senderId: userId,
            receiverId,
            replyToId,
          });

          const sender = await storage.getUser(userId);
          let repliedMessage = null;
          
          if (newMessage.replyToId) {
            const replied = await storage.getMessageById(newMessage.replyToId);
            if (replied) {
              const repliedSender = await storage.getUser(replied.senderId);
              repliedMessage = {
                ...replied,
                senderUsername: repliedSender?.username || "Unknown",
              };
            }
          }
          
          const messageWithUsername = {
            ...newMessage,
            senderUsername: sender?.username || "Unknown",
            repliedMessage,
          };

          // Send to receiver if connected
          const receiverWs = connections.get(receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: 'new_message',
              data: messageWithUsername,
            }));
          }

          // Send back to sender as confirmation
          ws.send(JSON.stringify({
            type: 'message_sent',
            data: messageWithUsername,
          }));
        } else if (message.type === 'edit_message' && userId) {
          // Handle message editing
          const { messageId, content } = message.data;
          
          // Sanitize content
          const sanitizedContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          
          const editedMessage = await storage.editMessage(messageId, sanitizedContent, userId);
          
          if (editedMessage) {
            const sender = await storage.getUser(userId);
            let repliedMessage = null;
            
            if (editedMessage.replyToId) {
              const replied = await storage.getMessageById(editedMessage.replyToId);
              if (replied) {
                const repliedSender = await storage.getUser(replied.senderId);
                repliedMessage = {
                  ...replied,
                  senderUsername: repliedSender?.username || "Unknown",
                };
              }
            }
            
            const messageWithUsername = {
              ...editedMessage,
              senderUsername: sender?.username || "Unknown",
              repliedMessage,
            };

            // Send to receiver if connected
            const receiverWs = connections.get(editedMessage.receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(JSON.stringify({
                type: 'message_edited',
                data: messageWithUsername,
              }));
            }

            // Send back to sender as confirmation
            ws.send(JSON.stringify({
              type: 'message_edited',
              data: messageWithUsername,
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'edit_error',
              message: 'Failed to edit message or not authorized',
            }));
          }
        } else if (message.type === 'delete_message' && userId) {
          // Handle message deletion
          const { messageId } = message.data;
          
          // Get the message before deleting to know the receiver
          const messageToDelete = await storage.getMessageById(messageId);
          
          const deleted = await storage.deleteMessage(messageId, userId);
          
          if (deleted && messageToDelete) {
            // Send to receiver if connected
            const receiverWs = connections.get(messageToDelete.receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(JSON.stringify({
                type: 'message_deleted',
                data: { messageId },
              }));
            }

            // Send back to sender as confirmation
            ws.send(JSON.stringify({
              type: 'message_deleted',
              data: { messageId },
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'delete_error',
              message: 'Failed to delete message or not authorized',
            }));
          }
        } else if (message.type === 'add_reaction' && userId) {
          // Handle adding reaction
          const { messageId, emoji } = message.data;
          
          const updatedMessage = await storage.addReaction(messageId, emoji, userId);
          
          if (updatedMessage) {
            const sender = await storage.getUser(userId);
            const messageWithUsername = {
              ...updatedMessage,
              senderUsername: sender?.username || "Unknown",
            };

            // Send to receiver if connected
            const receiverWs = connections.get(updatedMessage.receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(JSON.stringify({
                type: 'reaction_added',
                data: messageWithUsername,
              }));
            }

            // Send back to sender as confirmation
            ws.send(JSON.stringify({
              type: 'reaction_added',
              data: messageWithUsername,
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'reaction_error',
              message: 'Failed to add reaction',
            }));
          }
        } else if (message.type === 'remove_reaction' && userId) {
          // Handle removing reaction
          const { messageId, emoji } = message.data;
          
          const updatedMessage = await storage.removeReaction(messageId, emoji, userId);
          
          if (updatedMessage) {
            const sender = await storage.getUser(userId);
            const messageWithUsername = {
              ...updatedMessage,
              senderUsername: sender?.username || "Unknown",
            };

            // Send to receiver if connected
            const receiverWs = connections.get(updatedMessage.receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(JSON.stringify({
                type: 'reaction_removed',
                data: messageWithUsername,
              }));
            }

            // Send back to sender as confirmation
            ws.send(JSON.stringify({
              type: 'reaction_removed',
              data: messageWithUsername,
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'reaction_error',
              message: 'Failed to remove reaction',
            }));
          }
        } else if (message.type === 'typing' && userId) {
          // Handle typing indicator
          const { receiverId, isTyping } = message.data;
          const receiverWs = connections.get(receiverId);
          
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            const sender = await storage.getUser(userId);
            receiverWs.send(JSON.stringify({
              type: 'typing',
              data: {
                senderUsername: sender?.username,
                isTyping,
              },
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`WebSocket closed for user ${userId}: code ${code}, reason: ${reason.toString()}`);
      if (userId) {
        connections.delete(userId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error for user', userId, ':', error);
    });

    ws.on('pong', () => {
      // Connection is alive
    });
  });

  return httpServer;
}
