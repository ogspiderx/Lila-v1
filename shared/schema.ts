import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  replyToId: varchar("reply_to_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  seenAt: timestamp("seen_at"),
  editedAt: timestamp("edited_at"),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentType: text("attachment_type"),
  attachmentSize: varchar("attachment_size"),
  voiceMessageUrl: text("voice_message_url"),
  voiceMessageDuration: varchar("voice_message_duration"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  receiverId: true,
  replyToId: true,
  attachmentUrl: true,
  attachmentName: true,
  attachmentType: true,
  attachmentSize: true,
  voiceMessageUrl: true,
  voiceMessageDuration: true,
}).extend({
  content: z.string().optional().default(''), // Allow empty content for GIFs and voice messages
  replyToId: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentType: z.string().optional(),
  attachmentSize: z.string().optional(),
  voiceMessageUrl: z.string().optional(),
  voiceMessageDuration: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(10),
  messageId: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect & {
  reactions?: Array<{ emoji: string; userId: string; username: string }>;
};
export type LoginRequest = z.infer<typeof loginSchema>;
export type EditMessageRequest = z.infer<typeof editMessageSchema>;
export type ReactionRequest = z.infer<typeof reactionSchema>;
