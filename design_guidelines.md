# Mining Web App - Comprehensive Design Guidelines

## Design Approach: Modern Mobile Dashboard System
**Selected Framework:** Material Design 3 principles adapted for native Android app aesthetics with gaming/crypto dashboard influences (inspired by Robinhood's data visualization + Android 14's dynamic theming + gaming dashboard UIs)

**Core Philosophy:** Instant-response interface with glassmorphic elements, smooth physics-based animations, and information hierarchy optimized for one-handed mobile use.

---

## Color Palette

### Dark Mode (Primary)
- **Background Base:** 220 15% 8% (deep charcoal)
- **Surface Elevated:** 220 12% 12% (card surfaces)
- **Surface Overlay:** 220 10% 16% (panels, sheets)
- **Primary Brand:** 160 85% 45% (vibrant teal/cyan - mining/tech aesthetic)
- **Primary Variant:** 160 70% 35% (deeper teal for pressed states)
- **Success/Active:** 145 80% 42% (mining active green)
- **Warning:** 35 95% 55% (temperature/power alerts)
- **Error:** 0 80% 55% (critical alerts)
- **Text Primary:** 0 0% 95% (high contrast white)
- **Text Secondary:** 220 5% 65% (muted for metrics)
- **Ring/Border:** 220 15% 25% (subtle separators)

### Glassmorphic Overlays
- Backdrop blur with 220 10% 10% at 70% opacity for panels/sheets
- Frosted glass effect for floating controls

---

## Typography

**Font Stack:** 
- Primary: 'Inter' (Google Fonts) - clean, highly legible for data
- Monospace: 'JetBrains Mono' (Google Fonts) - for metrics, hash rates, numerical data

**Type Scale:**
- Display/Hero: 2.5rem (40px), font-weight: 700 - splash screen brand
- H1/Section: 1.75rem (28px), font-weight: 600 - dashboard headers
- H2/Card Title: 1.25rem (20px), font-weight: 600 - metric categories
- Body/Default: 1rem (16px), font-weight: 400 - general content
- Metrics/Data: 1.125rem (18px), font-weight: 500, monospace - live values
- Caption/Labels: 0.875rem (14px), font-weight: 500 - micro-labels
- Micro/Timestamp: 0.75rem (12px), font-weight: 400 - timestamps, footnotes

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **4, 6, 8, 12, 16** (e.g., p-4, gap-6, h-16)

**Mobile-First Grid:**
- Container: max-w-md (28rem) with px-4 horizontal padding
- Cards: Full-width with rounded-2xl (16px radius)
- Grid System: Single column base, can split to 2-column for compact metric tiles
- Safe Areas: pb-safe for iPhone notch, account for Android navigation gestures

**Component Spacing:**
- Section gaps: space-y-6 (24px between major sections)
- Card padding: p-6 (24px internal spacing)
- Tile grid gaps: gap-4 (16px between analytics tiles)
- Touch targets: Minimum 44x44px (h-12 w-12 or larger)

---

## Core Components

### 1. Splash Screen (Full-screen)
- Animated brand logo (pulse + glow effect)
- Circular progress ring with easing
- Subtle particle/grid background animation
- 2-3 second total duration with smooth fade-out

### 2. Central Mining Control
- **Circular Button:** 200px diameter (w-50 h-50) with gradient background
- **Animated Ring:** 8px stroke weight, dashed-to-solid animation during mining
- **States:** Idle (muted), Active (pulsing green glow), Paused (amber), Cooldown (blue countdown)
- **Typography:** "START" in 1.5rem bold, micro-state labels at 0.75rem
- Haptic simulation: Scale transform (95% on press) + ripple effect

### 3. Analytics Tile Grid
- **Layout:** 2-column grid (grid-cols-2) with gap-4
- **Tile Design:** Rounded-xl cards with glass effect, p-4 internal
- **Metric Display:** Icon (24px) + Label (0.875rem) + Large Value (1.5rem monospace) + Trend indicator
- **Animation:** CountUp effect for values, color shift on threshold changes
- **Tiles Include:** CPU %, GPU %, Hash Rate, Temp (°C), Power (W), Network ms

### 4. Income Dashboard Card
- Prominent card above fold, glass surface
- **Primary Display:** Large balance (2rem monospace) with currency symbol
- **Session Earnings:** Medium size (1.25rem) with up-arrow and percentage
- **Projected:** Small text (0.875rem) with "Est. 24h" label
- Mini-chart visualization (sparkline) for earnings trend

### 5. Transaction History Feed
- Scrollable list with virtualization for performance
- **List Item:** Icon + Type + Amount + Timestamp in horizontal flex
- **Filters:** Pill-style chips (All, Deposits, Withdrawals, Mining)
- Pull-to-refresh gesture on mobile
- Infinite scroll pagination

### 6. Bottom Sheet / Side Panel
- **Trigger:** Hamburger menu icon (top-left) or swipe from edge
- **Panel Design:** Full-height with backdrop blur
- **Sections:** Account (avatar + name + balance), Settings (toggle switches + sliders), History
- **Close:** Swipe down gesture + X button
- Settings use Material switches and sliders with clear labels

### 7. Toast Notifications
- **Position:** Top center with slide-down animation
- **Design:** Compact pill shape (max-w-sm) with icon + message + dismiss
- **Types:** Success (green), Warning (amber), Error (red), Info (blue)
- **Duration:** 3-5s auto-dismiss with progress bar

### 8. Notification Center
- **Badge:** Small red dot on bell icon (top-right)
- **Panel:** Dropdown list with time-grouped notifications
- **Actions:** Mark as read, clear all, per-item actions

---

## Animations & Micro-interactions

**Animation Principles:**
- Duration: 150-300ms for micro-interactions, 400-600ms for transitions
- Easing: cubic-bezier(0.4, 0.0, 0.2, 1) for material motion
- Physics: Spring animations for gesture-driven interactions (bottom sheet)

**Key Animations:**
- Mining ring: 360° dash-offset animation loop (2s duration)
- Metric values: CountUp with easing over 800ms
- Card entries: Stagger fade-up (100ms delay between items)
- Button press: Scale(0.95) + opacity(0.8) in 150ms
- State changes: Cross-fade with 300ms overlap

**Haptic Visual Feedback:**
- Ripple effect on tap (expanding circle with fade)
- Glow pulse on active mining state
- Shake animation for errors (3x oscillation)

---

## Accessibility & States

**Accessibility:**
- Color contrast: Minimum WCAG AA (4.5:1 for text)
- Touch targets: 44x44px minimum, 56x56px preferred for primary actions
- Focus indicators: 2px solid ring with 160 85% 45% color
- Screen reader labels on all interactive elements
- Alternative text for icons and images

**UI States:**
- **Offline:** Gray overlay with cloud-off icon and "Reconnecting..." message
- **Error:** Red accent card with error icon, message, and retry button
- **Loading:** Skeleton screens for data sections, shimmer effect
- **Empty State:** Centered icon + heading + supportive text + CTA

**Privacy/Consent:**
- Initial modal on first launch with clear checkboxes
- Persistent consent manager in Settings
- Cookie/tracking notice as bottom banner (dismiss or manage)

---

## Images & Visual Assets

**Icon Library:** Heroicons (outline for secondary, solid for primary actions) via CDN

**Illustrations:**
- Abstract tech/circuit patterns for empty states (use subtle CSS patterns or placeholder comments)
- Mining-themed iconography (chip, hash symbol, network nodes)

**No Hero Images:** This is a dashboard app - all visuals are functional UI elements, metrics, and data visualization

---

## Additional Design Notes

- **Energy Saver Mode:** Reduce animations to 50% speed, disable particles, dim brightness
- **Session Persistence:** Auto-save every 5s, visual "saved" indicator as micro-checkmark
- **CSV Export:** Material-style file download button with progress indicator
- **Recovery Flow:** Clean stepper UI with 1-2-3 progress dots, clear back/next navigation

This design creates a premium, native-feeling Android experience optimized for constant monitoring, quick interactions, and data clarity.