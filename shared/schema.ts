import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Helper function to generate a UUID, assuming it's defined elsewhere or you'll define it.
// For demonstration, let's assume a simple placeholder. In a real app, you'd use a proper UUID generator.
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"), // Password can be null if using Google Auth
  googleId: text("google_id").unique(), // Added for Google OAuth
  walletAddress: text("wallet_address").unique(), // In-app wallet address
  walletPin: text("wallet_pin"), // 4-digit PIN (hashed)
  balance: decimal("balance", { precision: 18, scale: 8 }).notNull().default("0"),
  totalEarnings: decimal("total_earnings", { precision: 18, scale: 8 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const miningSessions = pgTable("mining_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("idle"), // idle, active, paused, stopped, cooldown
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
  pausedDuration: integer("paused_duration").notNull().default(0), // accumulated paused time in seconds
  earnings: decimal("earnings", { precision: 18, scale: 8 }).notNull().default("0"),
  intensity: integer("intensity").notNull().default(50), // 1-100
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // mining, deposit, withdrawal
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  status: text("status").notNull().default("completed"), // pending, completed, failed
  description: text("description"),
  sessionId: varchar("session_id").references(() => miningSessions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  miningIntensity: integer("mining_intensity").notNull().default(50),
  energySaverMode: boolean("energy_saver_mode").notNull().default(false),
  notifications: boolean("notifications").notNull().default(true),
  sound: boolean("sound").notNull().default(true),
  theme: text("theme").notNull().default("dark"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // session_start, session_stop, low_balance, alert
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  miningSessions: many(miningSessions),
  transactions: many(transactions),
  settings: one(userSettings),
  notifications: many(notifications),
}));

export const miningSessionsRelations = relations(miningSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [miningSessions.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  session: one(miningSessions, {
    fields: [transactions.sessionId],
    references: [miningSessions.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  balance: true,
  totalEarnings: true,
  createdAt: true,
});

export const insertMiningSessionSchema = createInsertSchema(miningSessions).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMiningSession = z.infer<typeof insertMiningSessionSchema>;
export type MiningSession = typeof miningSessions.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;