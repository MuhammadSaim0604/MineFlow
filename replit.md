# MineOS - Smart Mining Dashboard

## Overview

MineOS is a mobile-first cryptocurrency mining web application designed to replicate a native Android app experience. The application provides real-time mining session management, earnings tracking, wallet functionality, and comprehensive analytics. Built with React, Express, and PostgreSQL, it features smooth physics-based animations, glassmorphic UI elements, and persistent session state management.

The app enables users to simulate mining sessions with configurable intensity, track earnings and transactions, manage an in-app wallet with PIN security, and monitor real-time analytics including CPU/GPU utilization, hash rates, temperature, and power consumption.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing:**
- React 18 with TypeScript for type safety
- Wouter for lightweight client-side routing
- Vite as the build tool and development server

**State Management:**
- TanStack Query (React Query) for server state management and caching
- Local React state with hooks for UI state
- BroadcastChannel API for cross-tab session synchronization
- LocalStorage for persistent authentication tokens and session state

**UI Framework:**
- Shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Material Design 3 principles adapted for Android-like aesthetics
- Custom animations using CSS transitions and keyframes
- Glassmorphic overlays and card-based layouts

**Design System:**
- Dark mode primary theme (HSL color system)
- Inter font for UI, JetBrains Mono for numerical data
- Mobile-first responsive design optimized for one-handed use
- Custom spacing primitives (4, 6, 8, 12, 16px units)

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- RESTful API design pattern
- JWT-based authentication with bcrypt password hashing
- Session-based state management

**Authentication & Authorization:**
- Dual authentication: email/password and Google OAuth 2.0
- Passport.js with Google Strategy for OAuth integration
- JWT tokens stored client-side with Bearer token authorization
- Protected routes with token verification middleware

**API Structure:**
- `/api/auth/*` - Authentication endpoints (login, signup, OAuth callbacks)
- `/api/sessions/*` - Mining session management
- `/api/transactions/*` - Transaction history and operations
- `/api/settings/*` - User preferences and settings
- `/api/wallet/*` - Wallet operations and PIN management
- `/api/balance` - Current user balance
- `/api/transfer` - Peer-to-peer transfers

**Real-time Features:**
- WebSocket server for live mining analytics updates
- Client-side polling for session state synchronization
- BroadcastChannel for cross-tab communication

### Data Storage

**Database:**
- PostgreSQL with Neon serverless driver
- Drizzle ORM for type-safe database operations
- Schema-first design with Zod validation

**Database Schema:**

*Users Table:*
- Authentication fields (username, email, password, googleId)
- Wallet fields (walletAddress, walletPin, balance, totalEarnings)
- Timestamps for account creation

*Mining Sessions Table:*
- Session state (status: idle/active/paused/stopped/cooldown)
- Timing data (startTime, endTime, lastActiveAt, pausedDuration)
- Mining metrics (earnings, intensity)
- Foreign key to users table

*Transactions Table:*
- Transaction types (mining, deposit, withdrawal)
- Amount and status tracking
- Optional session reference for mining-related transactions
- Timestamps for audit trail

*User Settings Table:*
- Mining preferences (intensity, energy saver mode)
- Notification preferences (notifications, sound)
- User-specific configuration

*Notifications Table:*
- Notification types (session_start, session_stop, alerts)
- Read/unread status tracking
- Message content and timestamps

**Data Flow:**
- Client requests → Express routes → Storage layer → Drizzle ORM → PostgreSQL
- Mutations invalidate React Query cache for immediate UI updates
- Optimistic updates for responsive UX

### External Dependencies

**Third-Party Services:**
- Google OAuth 2.0 for social authentication (requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
- Neon Database for serverless PostgreSQL hosting

**Key NPM Packages:**
- `@neondatabase/serverless` - PostgreSQL client
- `drizzle-orm` & `drizzle-kit` - ORM and migrations
- `passport-google-oauth20` - OAuth strategy
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token management
- `ws` - WebSocket server
- `@tanstack/react-query` - Data fetching and caching
- `@radix-ui/*` - Headless UI components
- `date-fns` - Date formatting utilities
- `zod` - Schema validation

**Development Tools:**
- TypeScript for type safety across stack
- Vite plugins for Replit integration (dev banner, cartographer, error overlay)
- ESBuild for production builds

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `REPLIT_DEV_DOMAIN` - Replit deployment domain for OAuth redirects

**Security Considerations:**
- Passwords hashed with bcrypt before storage
- Wallet PINs hashed separately for additional security
- JWT tokens with expiration for session management
- CORS and credential handling for cross-origin requests
- Input validation using Zod schemas
- Protected routes require valid JWT tokens