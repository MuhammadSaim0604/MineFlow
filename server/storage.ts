import {
  users,
  miningSessions,
  transactions,
  userSettings,
  notifications,
  type User,
  type InsertUser,
  type MiningSession,
  type InsertMiningSession,
  type Transaction,
  type InsertTransaction,
  type UserSettings,
  type InsertUserSettings,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, isNull } from "drizzle-orm";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Generate unique wallet address in format: WAL + 32 char hash
function generateWalletAddress(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId + Date.now().toString()).digest('hex');
  return `WAL${hash.substring(0, 32).toUpperCase()}`;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createGoogleUser(data: { email: string; username: string; googleId: string }): Promise<User>;
  updateUserBalance(id: string, balance: string): Promise<void>;
  updateUser(userId: string, data: Partial<typeof users.$inferInsert>): Promise<void>;

  // Mining Sessions
  getMiningSession(id: string): Promise<MiningSession | undefined>;
  getUserMiningSessions(userId: string): Promise<MiningSession[]>;
  getActiveSession(userId: string): Promise<MiningSession | undefined>;
  createMiningSession(session: InsertMiningSession): Promise<MiningSession>;
  updateMiningSession(id: string, updates: Partial<MiningSession>): Promise<void>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<void>;

  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  clearUserNotifications(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate a temporary ID to create wallet address
    const tempId = crypto.randomUUID();
    const walletAddress = generateWalletAddress(tempId);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        walletAddress,
      })
      .returning();
    return user;
  }

  async createGoogleUser(data: { email: string; username: string; googleId: string }): Promise<User> {
    const tempId = crypto.randomUUID();
    const walletAddress = generateWalletAddress(tempId);
    
    const [user] = await db.insert(users).values({
      email: data.email,
      username: data.username,
      googleId: data.googleId,
      password: null,
      balance: "0",
      totalEarnings: "0",
      walletAddress,
    }).returning();
    return user;
  }

  async updateUserBalance(id: string, balance: string): Promise<void> {
    await db.update(users).set({ balance }).where(eq(users.id, id));
  }

  async updateUser(userId: string, data: Partial<typeof users.$inferInsert>) {
    await db.update(users).set(data).where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // Mining Sessions
  async getMiningSession(id: string): Promise<MiningSession | undefined> {
    const [session] = await db.select().from(miningSessions).where(eq(miningSessions.id, id));
    return session || undefined;
  }

  async getUserMiningSessions(userId: string): Promise<MiningSession[]> {
    return await db
      .select()
      .from(miningSessions)
      .where(eq(miningSessions.userId, userId))
      .orderBy(desc(miningSessions.startTime));
  }

  async getActiveSession(userId: string): Promise<MiningSession | undefined> {
    const [session] = await db
      .select()
      .from(miningSessions)
      .where(eq(miningSessions.userId, userId))
      .orderBy(desc(miningSessions.startTime))
      .limit(1);

    if (session && (session.status === "active" || session.status === "paused")) {
      return session;
    }
    return undefined;
  }

  async createMiningSession(insertSession: InsertMiningSession): Promise<MiningSession> {
    const [session] = await db
      .insert(miningSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateMiningSession(id: string, updates: Partial<MiningSession>): Promise<void> {
    await db.update(miningSessions).set(updates).where(eq(miningSessions.id, id));
  }

  // Transactions
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<void> {
    await db.update(userSettings).set(updates).where(eq(userSettings.userId, userId));
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async clearUserNotifications(userId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();