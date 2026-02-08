import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMiningSessionSchema, insertTransactionSchema, insertUserSettingsSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from 'crypto';


const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const refreshIP = "https://baseball-stickers-arts-tribute.trycloudflare.com"; // Example IP for refresh endpoint

// Function to generate a custom wallet address
function generateWalletAddress(): string {
  const prefix = "WAL";
  const hash = crypto.randomBytes(16).toString('hex');
  return `${prefix}${hash}`;
}


// Persist refresh endpoint in a JSON file in the server folder
import fs from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

// Recreate __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const refreshFilePath = path.join(__dirname, "refresh_endpoints.json");

// Ensure file exists with initial value derived from refreshIP
async function ensureRefreshFile() {
  try {
    await fs.access(refreshFilePath);
  } catch {
    const initial: { ip: string; port: string; url: string } = { ip: "", port: "", url: "" };
    if (/^https?:\/\//i.test(refreshIP)) {
      initial.url = refreshIP;
    } else if (refreshIP) {
      const [ip, port] = refreshIP.split(":");
      initial.ip = ip || "";
      initial.port = port || "";
    }
    await fs.writeFile(refreshFilePath, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readRefreshFile() {
  try {
    const raw = await fs.readFile(refreshFilePath, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return {
      ip: parsed.ip || "",
      port: parsed.port || "",
      url: parsed.url || "",
    };
  } catch (err) {
    // If anything goes wrong, fall back to defaults derived from refreshIP
    if (/^https?:\/\//i.test(refreshIP)) {
      return { ip: "", port: "", url: refreshIP };
    }
    const [ip, port] = refreshIP.split(":");
    return { ip: ip || "", port: port || "", url: "" };
  }
}

async function writeRefreshFile(obj: { ip: string; port: string; url: string }) {
  await fs.writeFile(refreshFilePath, JSON.stringify(obj, null, 2), "utf8");
}

// initialize file
ensureRefreshFile();



// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_DOMAIN ? `https://${process.env.BASE_DOMAIN}` : 'http://localhost:5000'}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error("No email found"));
    }

    // Check if user exists with this Google ID
    let user = await storage.getUserByGoogleId(profile.id);

    if (!user) {
      // Check if user exists with this email
      user = await storage.getUserByEmail(email);

      if (user) {
        // Link Google account to existing user
        await storage.updateUser(user.id, { googleId: profile.id });
      } else {
        // Create new user
        const username = profile.displayName?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];
        let finalUsername = username;

        // Ensure unique username
        let counter = 1;
        while (await storage.getUserByUsername(finalUsername)) {
          finalUsername = `${username}${counter}`;
          counter++;
        }

      const walletAddress = generateWalletAddress();
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      user = await storage.createGoogleUser({
        email,
        username: finalUsername,
        googleId: profile.id,
        walletAddress: walletAddress, // Assign generated wallet address
        balance: "0", // Initialize balance
        referralCode,
      });

        // Create default settings
        await storage.createUserSettings({
          userId: user.id,
          miningIntensity: 50,
          energySaverMode: false,
          notifications: true,
          sound: true,
          theme: "dark",
        });
      }
    }

    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
}));

// Auth middleware
const authMiddleware = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize Passport
  app.use(passport.initialize());

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  

  // Get current refresh endpoint
  app.get("/api/refresh", async (req: any, res: any) => {
    try {
      const current = await readRefreshFile();

      // If it's a full URL, return { url: "..." }
      if (current.url && /^https?:\/\//i.test(current.url)) {
        return res.json({ url: current.url });
      }

      // If both ip and port present, return them
      if (current.ip && current.port) {
        return res.json({ ip: current.ip, port: current.port });
      }

      // Default empty response
      return res.json({ ip: "", port: "", url: "" });
    } catch (error) {
      console.error("Get refresh endpoint error:", error);
      res.status(500).json({ error: "Failed to get refresh endpoint" });
    }
  });

  // Update refresh endpoint - either { ip, port } OR { url }
  app.post("/api/refresh", async (req: any, res: any) => {
    try {
      const { ip, port, url } = req.body || {};

      // IP + port takes precedence when both provided
      if (ip && port) {
        const obj = { ip: String(ip), port: String(port), url: "" };
        await writeRefreshFile(obj);
        return res.json({ ip: obj.ip, port: obj.port });
      }

      if (url) {
        const obj = { ip: "", port: "", url: String(url) };
        await writeRefreshFile(obj);
        return res.json({ url: obj.url });
      }

      return res.status(400).json({ error: "Provide either { ip, port } or { url } in request body" });
    } catch (error) {
      console.error("Update refresh endpoint error:", error);
      res.status(500).json({ error: "Failed to update refresh endpoint" });
    }
  });

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate wallet address
      const walletAddress = generateWalletAddress();

      // Check for referral code
      let referredBy = null;
      if (req.body.referralCode) {
        const inviter = await storage.getUserByReferralCode(req.body.referralCode);
        if (inviter) {
          referredBy = inviter.referralCode;
        }
      }

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        walletAddress: walletAddress, // Assign generated wallet address
        balance: "0", // Initialize balance
        referredBy,
      });

      // Create default settings
      await storage.createUserSettings({
        userId: user.id,
        miningIntensity: 50,
        energySaverMode: false,
        notifications: true,
        sound: true,
        theme: "dark",
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({ token, userId: user.id, username: user.username, walletAddress: user.walletAddress });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if user has a password (Google OAuth users don't have passwords)
      if (!user.password) {
        return res.status(401).json({ error: "Please sign in with Google" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({ token, userId: user.id, username: user.username, walletAddress: user.walletAddress });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ 
        userId: user.id, 
        username: user.username, 
        email: user.email, 
        walletAddress: user.walletAddress,
        referralCode: user.referralCode,
        referredBy: user.referredBy
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/referrals", authMiddleware, async (req: any, res) => {
    try {
      const referrals = await storage.getReferrals(req.userId);
      res.json(referrals);
    } catch (error) {
      console.error("Get referrals error:", error);
      res.status(500).json({ error: "Failed to get referrals" });
    }
  });

  app.get("/api/referral/stats", authMiddleware, async (req: any, res) => {
    try {
      const referrals = await storage.getReferrals(req.userId);
      const stats = {
        count: referrals.length,
        earnings: "0.0000",
      };
      res.json(stats);
    } catch (error) {
      console.error("Get referral stats error:", error);
      res.status(500).json({ error: "Failed to get referral stats" });
    }
  });

  app.post("/api/auth/change-password", authMiddleware, async (req: any, res) => {
    try {
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUser(req.userId, { password: hashedPassword });

      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.delete("/api/auth/account", authMiddleware, async (req: any, res) => {
    try {
      await storage.deleteUser(req.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Wallet PIN routes
  app.post("/api/wallet/set-pin", authMiddleware, async (req: any, res) => {
    try {
      const { pin } = req.body;

      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be exactly 4 digits" });
      }

      // Hash the PIN
      const hashedPin = await bcrypt.hash(pin, 10);
      await storage.updateUser(req.userId, { walletPin: hashedPin });

      res.json({ success: true });
    } catch (error) {
      console.error("Set PIN error:", error);
      res.status(500).json({ error: "Failed to set PIN" });
    }
  });

  app.post("/api/wallet/verify-pin", authMiddleware, async (req: any, res) => {
    try {
      const { pin } = req.body;

      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: "Invalid PIN format" });
      }

      const user = await storage.getUser(req.userId);
      if (!user || !user.walletPin) {
        return res.status(400).json({ error: "PIN not set" });
      }

      const validPin = await bcrypt.compare(pin, user.walletPin);
      if (!validPin) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Verify PIN error:", error);
      res.status(500).json({ error: "Failed to verify PIN" });
    }
  });

  app.get("/api/wallet/has-pin", authMiddleware, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ hasPin: !!user.walletPin });
    } catch (error) {
      console.error("Check PIN error:", error);
      res.status(500).json({ error: "Failed to check PIN" });
    }
  });

  app.post("/api/auth/update-profile", authMiddleware, async (req: any, res) => {
    try {
      const { username, referralCode } = req.body;

      if (username && username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }

      const updateData: any = {};
      if (username) {
        // Check if username is already taken
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== req.userId) {
          return res.status(400).json({ error: "Username already taken" });
        }
        updateData.username = username;
      }

      if (referralCode) {
        const user = await storage.getUser(req.userId);
        if (user?.referredBy) {
          return res.status(400).json({ error: "Referral already applied" });
        }

        const inviter = await storage.getUserByReferralCode(referralCode);
        if (!inviter) {
          return res.status(400).json({ error: "Invalid referral code" });
        }
        if (inviter.id === req.userId) {
          return res.status(400).json({ error: "You cannot refer yourself" });
        }
        updateData.referredBy = referralCode;
      }

      await storage.updateUser(req.userId, updateData);
      res.json({ success: true });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/auth/update-username", authMiddleware, async (req: any, res) => {
    try {
      const { username } = req.body;

      if (!username || username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }

      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(400).json({ error: "Username already taken" });
      }

      await storage.updateUser(req.userId, { username });
      res.json({ success: true });
    } catch (error) {
      console.error("Update username error:", error);
      res.status(500).json({ error: "Failed to update username" });
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      prompt: "select_account"
    })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    async (req: any, res) => {
      try {
        const user = req.user;
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        // Check if username is auto-generated (contains numbers at the end)
        const needsUsername = /\d+$/.test(user.username);

        // Redirect to frontend with token
        res.redirect(`mineos://signup?status=success&token=${token}&userId=${user.id}${needsUsername ? '&needsUsername=true' : ''}`);
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        res.redirect("mineos://login?error=auth_failed");
      }
    }
  );

  // Get user balance
  app.get("/api/balance", authMiddleware, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user.balance || "0.00000000");
    } catch (error) {
      console.error("Get balance error:", error);
      res.status(500).json({ error: "Failed to get balance" });
    }
  });

  // Transfer money to another user
  app.post("/api/transfer", authMiddleware, async (req: any, res) => {
    try {
      const { recipient, amount } = req.body;

      if (!recipient || !amount) {
        return res.status(400).json({ error: "Recipient and amount are required" });
      }

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Get sender
      const sender = await storage.getUser(req.userId);
      if (!sender) {
        return res.status(404).json({ error: "Sender not found" });
      }

      // Get recipient by username, email, or wallet address
      let recipientUser = await storage.getUserByUsername(recipient);
      if (!recipientUser) {
        recipientUser = await storage.getUserByEmail(recipient);
      }
      if (!recipientUser) {
        recipientUser = await storage.getUserByWalletAddress(recipient);
      }

      if (!recipientUser) {
        return res.status(404).json({ error: "Recipient not found. Please enter a valid username, email, or wallet address." });
      }

      if (recipientUser.id === sender.id) {
        return res.status(400).json({ error: "Cannot transfer to yourself" });
      }

      // Check balance
      const senderBalance = parseFloat(sender.balance || "0");
      if (senderBalance < amountValue) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Update balances
      const newSenderBalance = (senderBalance - amountValue).toFixed(8);
      const newRecipientBalance = (parseFloat(recipientUser.balance || "0") + amountValue).toFixed(8);

      await storage.updateUserBalance(sender.id, newSenderBalance);
      await storage.updateUserBalance(recipientUser.id, newRecipientBalance);

      // Create transactions
      await storage.createTransaction({
        userId: sender.id,
        type: "transfer_send",
        amount: `-${amount}`,
        status: "completed",
        description: `Transfer to ${recipientUser.username || recipientUser.walletAddress}`,
      });

      await storage.createTransaction({
        userId: recipientUser.id,
        type: "transfer_receive",
        amount: amount,
        status: "completed",
        description: `Transfer from ${sender.username || sender.walletAddress}`,
      });

      // Create notifications
      await storage.createNotification({
        userId: sender.id,
        type: "alert",
        title: "Transfer Sent",
        message: `Sent ${amount} to ${recipientUser.username || recipientUser.walletAddress}`,
        isRead: false,
      });

      await storage.createNotification({
        userId: recipientUser.id,
        type: "alert",
        title: "Transfer Received",
        message: `Received ${amount} from ${sender.username || sender.walletAddress}`,
        isRead: false,
      });

      res.json({ success: true, newBalance: newSenderBalance });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(500).json({ error: "Failed to transfer funds" });
    }
  });

  // Get user transactions
  app.get("/api/transactions", authMiddleware, async (req: any, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.userId);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Get mining sessions
  app.get("/api/sessions", authMiddleware, async (req: any, res) => {
    try {
      const sessions = await storage.getUserMiningSessions(req.userId);
      res.json(sessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  // Get active session
  app.get("/api/sessions/active", authMiddleware, async (req: any, res) => {
    try {
      const activeSession = await storage.getActiveSession(req.userId);
      res.json(activeSession || null);
    } catch (error) {
      console.error("Get active session error:", error);
      res.status(500).json({ error: "Failed to get active session" });
    }
  });

  // Start mining session
  app.post("/api/sessions/start", authMiddleware, async (req: any, res) => {
    try {
      const activeSession = await storage.getActiveSession(req.userId);
      if (activeSession) {
        return res.status(400).json({ error: "Active session already exists" });
      }

      const settings = await storage.getUserSettings(req.userId);
      const intensity = settings?.miningIntensity || 50;

      const session = await storage.createMiningSession({
        userId: req.userId,
        status: "active",
        startTime: new Date(),
        endTime: null,
        lastActiveAt: new Date(),
        pausedDuration: 0,
        earnings: "0",
        intensity,
      });

      await storage.createNotification({
        userId: req.userId,
        type: "session_start",
        title: "Mining Started",
        message: "Your mining session has begun successfully",
        isRead: false,
      });

      res.json(session);
    } catch (error) {
      console.error("Start session error:", error);
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  // Pause mining session
  app.post("/api/sessions/:id/pause", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getMiningSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Update status and lastActiveAt to track when pause started
      await storage.updateMiningSession(id, {
        status: "paused",
        lastActiveAt: new Date()
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Pause session error:", error);
      res.status(500).json({ error: "Failed to pause session" });
    }
  });

  // Resume mining session
  app.post("/api/sessions/:id/resume", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getMiningSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Calculate time spent paused since last pause
      const pausedTime = Math.floor((new Date().getTime() - new Date(session.lastActiveAt).getTime()) / 1000);
      const newPausedDuration = (session.pausedDuration || 0) + pausedTime;

      await storage.updateMiningSession(id, {
        status: "active",
        lastActiveAt: new Date(),
        pausedDuration: newPausedDuration
      });

      res.json({ success: true, pausedDuration: newPausedDuration });
    } catch (error) {
      console.error("Resume session error:", error);
      res.status(500).json({ error: "Failed to resume session" });
    }
  });

  // Stop mining session
  app.post("/api/sessions/:id/stop", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getMiningSession(id);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Verify session belongs to authenticated user
      if (session.userId !== req.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate earnings entirely on backend for security
      const sessionStartTime = new Date(session.startTime).getTime();
      const sessionEndTime = Date.now();

      // Calculate active duration accounting for paused state and current status
      let activeDuration = 0;
      let finalPausedDuration = session.pausedDuration || 0;

      if (session.status === "paused") {
        // If currently paused, add the current pause duration
        const currentPauseTime = Math.floor((sessionEndTime - new Date(session.lastActiveAt).getTime()) / 1000);
        finalPausedDuration += currentPauseTime;
      }

      // Calculate total active time: total elapsed time minus all paused time
      const totalElapsed = Math.floor((sessionEndTime - sessionStartTime) / 1000);
      activeDuration = Math.max(0, totalElapsed - finalPausedDuration);

      // Calculate earnings based on actual active duration
      const EARNINGS_PER_SECOND = 0.00000001;
      const finalEarnings = (activeDuration * EARNINGS_PER_SECOND).toFixed(8);

      await storage.updateMiningSession(id, {
        status: "stopped",
        endTime: new Date(),
        earnings: finalEarnings,
      });

      // Create transaction for earnings
      if (parseFloat(finalEarnings) > 0) {
        await storage.createTransaction({
          userId: session.userId,
          type: "mining",
          amount: finalEarnings,
          status: "completed",
          description: `Mining session ${id.slice(0, 8)}`,
          sessionId: id,
        });

        // Update user balance - handle null/undefined balance
        const currentBalance = parseFloat(user.balance || "0");
        const earningsValue = parseFloat(finalEarnings);
        const newBalance = (currentBalance + earningsValue).toFixed(8);
        await storage.updateUserBalance(user.id, newBalance);
      }

      await storage.createNotification({
        userId: session.userId,
        type: "session_stop",
        title: "Mining Stopped",
        message: `Session completed. Earned ${finalEarnings} BTC`,
        isRead: false,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Stop session error:", error);
      res.status(500).json({ error: "Failed to stop session" });
    }
  });


  // Get user settings
  app.get("/api/settings", authMiddleware, async (req: any, res) => {
    try {
      let settings = await storage.getUserSettings(req.userId);
      if (!settings) {
        settings = await storage.createUserSettings({
          userId: req.userId,
          miningIntensity: 50,
          energySaverMode: false,
          notifications: true,
          sound: true,
          theme: "dark",
        });
      }

      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  // Update user settings
  app.put("/api/settings", authMiddleware, async (req: any, res) => {
    try {
      await storage.updateUserSettings(req.userId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Get notifications
  app.get("/api/notifications", authMiddleware, async (req: any, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/:id/read", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Clear all notifications
  app.delete("/api/notifications", authMiddleware, async (req: any, res) => {
    try {
      await storage.clearUserNotifications(req.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Clear notifications error:", error);
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  });

  

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'ping') {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
