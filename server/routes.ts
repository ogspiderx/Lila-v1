import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { loginSchema, insertMessageSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// WebSocket connection tracking
const connections = new Map<string, WebSocket>();

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
      
      // Include sender username in response
      const messagesWithUsernames = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            senderUsername: sender?.username || "Unknown",
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
      
      // Include sender username in response
      const messagesWithUsernames = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            senderUsername: sender?.username || "Unknown",
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
      
      const { content, receiverId } = insertMessageSchema.parse(req.body);
      
      // Sanitize content
      const sanitizedContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      const newMessage = await storage.createMessage({
        content: sanitizedContent,
        senderId: decoded.userId,
        receiverId,
      });

      const sender = await storage.getUser(decoded.userId);
      const messageWithUsername = {
        ...newMessage,
        senderUsername: sender?.username || "Unknown",
      };

      res.json(messageWithUsername);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(400).json({ message: "Invalid request" });
    }
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
          const { content, receiverId } = insertMessageSchema.parse(message.data);
          
          // Sanitize content
          const sanitizedContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          
          const newMessage = await storage.createMessage({
            content: sanitizedContent,
            senderId: userId,
            receiverId,
          });

          const sender = await storage.getUser(userId);
          const messageWithUsername = {
            ...newMessage,
            senderUsername: sender?.username || "Unknown",
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
