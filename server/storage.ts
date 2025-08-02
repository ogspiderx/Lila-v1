import { type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message>;
  getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]>;
  initializeUsers(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
  }

  async initializeUsers(): Promise<void> {
    // Create default users with hashed passwords (in real app, these would be pre-hashed)
    const bcrypt = await import('bcrypt');
    
    const user1: User = {
      id: randomUUID(),
      username: "user1",
      password: await bcrypt.hash("password123", 10)
    };
    
    const user2: User = {
      id: randomUUID(),
      username: "user2", 
      password: await bcrypt.hash("password456", 10)
    };

    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createMessage(message: InsertMessage & { senderId: string }): Promise<Message> {
    const id = randomUUID();
    const newMessage: Message = {
      id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      timestamp: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
