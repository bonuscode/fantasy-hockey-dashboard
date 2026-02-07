# Frontend Guidelines - Fantasy Hockey Dashboard

## Overview

This document defines the visual design language, component specifications, and UI patterns for the Fantasy Hockey Dashboard. Use this as a reference when building components to ensure consistency across the application.

---

## Design System

### Color Palette

**Dark Mode (Primary):**
```css
--background: #0f1419        /* Main background */
--surface: #1a1f2e           /* Card/panel backgrounds */
--surface-elevated: #252d3d  /* Hover states, elevated cards */
--border: #2d3748            /* Dividers, borders */
--text-primary: #f7fafc      /* Main text */
--text-secondary: #a0aec0    /* Secondary text, labels */
--text-muted: #718096        /* Tertiary text, placeholders */

--accent-primary: #3b82f6    /* Primary actions, links */
--accent-success: #10b981    /* Positive trends, wins */
--accent-warning: #f59e0b    /* Alerts, warnings */
--accent-danger: #ef4444     /* Negative trends, losses */
--accent-info: #06b6d4       /* Info badges, neutral highlights */
```

**NHL Team Colors (Optional Accents):**
Use sparingly for team-specific elements (logos, team cards). Don't overuse - maintain overall dark aesthetic.

### Typography

**Font Family:**
- Primary: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Monospace (for stats): `'SF Mono', 'Monaco', 'Courier New', monospace`

**Font Sizes:**
```css
--text-xs: 0.75rem     /* 12px - Micro labels */
--text-sm: 0.875rem    /* 14px - Secondary text */
--text-base: 1rem      /* 16px - Body text */
--text-lg: 1.125rem    /* 18px - Subheadings */
--text-xl: 1.25rem     /* 20px - Card headers */
--text-2xl: 1.5rem     /* 24px - Page headers */
--text-3xl: 1.875rem   /* 30px - Large stats */
--text-4xl: 2.25rem    /* 36px - Hero numbers */
```

**Font Weights:**
- Regular: 400 (body text)
- Medium: 500 (labels, subheadings)
- Semibold: 600 (headings, important stats)
- Bold: 700 (large numbers, emphasis)

### Spacing Scale

Follow 4px base unit:
```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-5: 1.25rem   /* 20px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
```

### Border Radius

```css
--radius-sm: 0.25rem   /* 4px - Small elements */
--radius-md: 0.5rem    /* 8px - Cards, buttons */
--radius-lg: 0.75rem   /* 12px - Large cards */
--radius-full: 9999px  /* Pills, avatars */
```

---

## Component Specifications

### 1. Stat Cards

**Purpose:** Display key metrics for teams or players in a scannable card format.

**Visual Reference:**  
*[Placeholder for Mobbin screenshot - ESPN Fantasy player cards or similar]*

**Structure:**
```
┌─────────────────────────────────┐
│ LABEL (secondary text, xs)      │
│ 1,234 (primary stat, 3xl, bold) │
│ ↑ +12.5% (trend, sm, success)   │
│                                  │
│ Secondary Stats Row:             │
│ G: 45  A: 67  PTS: 112          │
└─────────────────────────────────┘
```

**Requirements:**
- Background: `--surface` with subtle border
- Padding: `--space-6` (24px all sides)
- Min height: 140px
- Hover state: Lift effect with subtle shadow
- Primary stat number: Large, bold, monospace font
- Trend indicator: Up/down arrow with color (green/red)
- Label: Uppercase, small, muted color

**Variations:**
- **Team Stat Card:** Shows team totals (PTS, PF, PA)
- **Player Stat Card:** Shows individual player stats (G, A, +/-, etc.)
- **Compact Card:** Smaller version for mobile (reduced padding, smaller primary number)

**Tailwind Example:**
```tsx
<div className="bg-surface border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
  <div className="text-xs uppercase tracking-wide text-text-secondary mb-2">
    Total Points
  </div>
  <div className="text-4xl font-bold font-mono text-text-primary mb-1">
    1,234
  </div>
  <div className="flex items-center gap-1 text-sm text-accent-success">
    <ArrowUp className="w-4 h-4" />
    <span>+12.5% from last week</span>
  </div>
  <div className="mt-4 pt-4 border-t border-border flex gap-4 text-sm">
    <div><span className="text-text-secondary">G:</span> <span className="font-medium">45</span></div>
    <div><span className="text-text-secondary">A:</span> <span className="font-medium">67</span></div>
    <div><span className="text-text-secondary">PTS:</span> <span className="font-medium">112</span></div>
  </div>
</div>
```

---

### 2. Player Tables

**Purpose:** Display roster information or leaderboards in a sortable, scannable table format.

**Visual Reference:**  
*[Placeholder for Mobbin screenshot - Sleeper or ESPN roster tables]*

**Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ PLAYER    │ POS │  G  │  A  │ PTS │ +/- │ SOG │ Last 5         │
├────────────────────────────────────────────────────────────────┤
│ 🏒 C.McDavid│ C  │ 42 │ 68 │ 110 │ +24 │ 285 │ ▁▃▅▇█ (trend) │
│ 🏒 L.Draisaitl│ C│ 38 │ 52 │  90 │ +18 │ 240 │ ▁▃▅▆▇        │
│ ...                                                             │
└────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Header row: Sticky, dark background, semibold text, uppercase small
- Rows: Alternating backgrounds (`--surface` and `--surface-elevated`)
- Hover state: Highlight row with subtle background change
- Sortable columns: Clickable headers with sort indicator (↑↓)
- Player cell: Include small team logo/avatar, player name, team abbreviation
- Number cells: Right-aligned, monospace font
- Mobile: Collapse to card layout under 768px breakpoint
- Loading state: Skeleton rows with shimmer effect

**Column Types:**
- **Player Column:** Avatar/logo + name (left-aligned)
- **Text Column:** Position, team (left-aligned)
- **Number Column:** Stats (right-aligned, monospace)
- **Trend Column:** Small sparkline or trend indicators (center-aligned)

**Features:**
- Click column header to sort ascending/descending
- Visual indicator for current sort (arrow icon)
- Sticky header on scroll
- Optional: Highlight user's team/players

**Tailwind Example (simplified):**
```tsx
<table className="w-full">
  <thead className="sticky top-0 bg-background border-b border-border">
    <tr>
      <th className="text-left text-xs uppercase font-semibold text-text-secondary p-3">
        Player
      </th>
      <th className="text-center text-xs uppercase font-semibold text-text-secondary p-3">
        Pos
      </th>
      <th className="text-right text-xs uppercase font-semibold text-text-secondary p-3">
        PTS
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-border hover:bg-surface-elevated transition-colors">
      <td className="p-3 flex items-center gap-2">
        <img src="/team-logo.png" className="w-6 h-6 rounded-full" />
        <div>
          <div className="font-medium text-text-primary">Connor McDavid</div>
          <div className="text-xs text-text-secondary">EDM</div>
        </div>
      </td>
      <td className="p-3 text-center text-text-secondary">C</td>
      <td className="p-3 text-right font-mono text-text-primary font-semibold">110</td>
    </tr>
  </tbody>
</table>
```

**Mobile Card Alternative (< 768px):**
```tsx
<div className="bg-surface border border-border rounded-lg p-4 mb-3">
  <div className="flex items-center gap-3 mb-3">
    <img src="/logo.png" className="w-10 h-10 rounded-full" />
    <div>
      <div className="font-semibold text-text-primary">Connor McDavid</div>
      <div className="text-sm text-text-secondary">C • EDM</div>
    </div>
  </div>
  <div className="grid grid-cols-3 gap-2 text-sm">
    <div>
      <div className="text-text-secondary">G</div>
      <div className="font-semibold font-mono">42</div>
    </div>
    <div>
      <div className="text-text-secondary">A</div>
      <div className="font-semibold font-mono">68</div>
    </div>
    <div>
      <div className="text-text-secondary">PTS</div>
      <div className="font-semibold font-mono">110</div>
    </div>
  </div>
</div>
```

---

### 3. Standings Table

**Purpose:** Display league rankings with team performance metrics.

**Visual Reference:**  
*[Placeholder for Mobbin screenshot - NFL.com or ESPN standings]*

**Structure:**
```
┌──────────────────────────────────────────────────────────────┐
│ RK │ TEAM           │ W-L-T │  PTS │  PF   │  PA   │ STREAK │
├──────────────────────────────────────────────────────────────┤
│ 1  │ 👤 Team Alpha  │ 12-3-1│ 1450 │ 1520  │ 1380  │  W3   │ ← Playoff line
│ 2  │ 👤 Team Beta   │ 11-4-1│ 1420 │ 1480  │ 1400  │  W1   │
│ 3  │ 👤 Team Gamma  │ 10-5-1│ 1390 │ 1460  │ 1420  │  L1   │
│... │                │       │      │       │       │        │
└──────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Rank column: Bold, fixed width, different color for top 3
- Team column: Owner avatar + team name
- Record: Formatted as W-L-T
- Highlight: Visual indicator for playoff cutoff line (border/background)
- Sortable: All columns clickable
- User's team: Highlighted row (subtle accent background)
- Responsive: Stack columns on mobile

**Visual Indicators:**
- Ranks 1-3: Gold/Silver/Bronze accent colors
- Playoff positions (1-6): Subtle success border on left
- Bubble teams (7-8): Info color indicator
- Out of playoffs: No special styling
- Current user team: Accent-primary left border

---

### 4. Charts & Visualizations

**Purpose:** Show trends and comparisons visually.

**Chart Types:**

**A) Sparklines (Inline Mini Charts)**
- Used in tables to show last 5-7 games trend
- Height: 20-30px
- No axes or labels
- Simple line or bar
- Color: accent-primary (neutral) or success/danger (directional)

**B) Line Charts (Performance Over Time)**
- Used for points per week, win progression
- Grid: Subtle, `--border` color
- Line: 2px width, `--accent-primary`
- Points: Show on hover
- Axes: Small labels, `--text-secondary`
- Tooltip: Dark background with white text

**C) Bar Charts (Comparisons)**
- Used for head-to-head matchups, position breakdowns
- Bar color: `--accent-primary` for user, `--text-secondary` for others
- Spacing: 8px between bars
- Labels: Inside bars if space allows, otherwise outside

**Recharts Configuration:**
```tsx
// Example line chart style
<LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
  <XAxis 
    dataKey="week" 
    stroke="var(--text-secondary)" 
    fontSize={12}
  />
  <YAxis stroke="var(--text-secondary)" fontSize={12} />
  <Tooltip 
    contentStyle={{ 
      backgroundColor: 'var(--surface-elevated)', 
      border: '1px solid var(--border)',
      borderRadius: '8px'
    }}
  />
  <Line 
    type="monotone" 
    dataKey="points" 
    stroke="var(--accent-primary)" 
    strokeWidth={2}
    dot={{ r: 4 }}
  />
</LineChart>
```

---

### 5. Badges & Pills

**Purpose:** Display compact status information (positions, streaks, injury status).

**Types:**

**Position Badge:** `C`, `LW`, `RW`, `D`, `G`
- Small, pill-shaped
- Background: `--surface-elevated`
- Text: `--text-secondary`, uppercase
- Padding: 4px 8px
- Font size: xs

**Streak Badge:** `W3`, `L2`
- Background: success (wins) or danger (losses)
- Text: white, bold
- Padding: 4px 10px
- Font size: sm

**Injury Badge:** `IR`, `DTD`, `O`
- Background: danger (injured) or warning (questionable)
- Text: white
- Padding: 4px 8px
- Font size: xs

**Tailwind Example:**
```tsx
// Position badge
<span className="inline-block px-2 py-1 text-xs uppercase bg-surface-elevated text-text-secondary rounded-full">
  C
</span>

// Win streak badge
<span className="inline-block px-2.5 py-1 text-sm font-semibold bg-accent-success text-white rounded-full">
  W3
</span>

// Injury badge
<span className="inline-block px-2 py-1 text-xs font-semibold bg-accent-danger text-white rounded-full">
  IR
</span>
```

---

### 6. Loading States

**Purpose:** Provide feedback while data is fetching.

**Skeleton Screens:**
Use for initial page loads. Match the shape of the content being loaded.

```tsx
// Skeleton card
<div className="bg-surface border border-border rounded-lg p-6 animate-pulse">
  <div className="h-4 bg-surface-elevated rounded w-1/4 mb-4"></div>
  <div className="h-10 bg-surface-elevated rounded w-1/2 mb-2"></div>
  <div className="h-4 bg-surface-elevated rounded w-1/3"></div>
</div>

// Skeleton table row
<tr className="animate-pulse">
  <td className="p-3">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-surface-elevated rounded-full"></div>
      <div className="h-4 bg-surface-elevated rounded w-24"></div>
    </div>
  </td>
  <td className="p-3">
    <div className="h-4 bg-surface-elevated rounded w-12 ml-auto"></div>
  </td>
</tr>
```

**Spinners:**
Use for inline actions or small components.

```tsx
<svg className="animate-spin h-5 w-5 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
```

---

### 7. Empty States

**Purpose:** Guide users when no data is available.

**Requirements:**
- Icon or illustration (simple, monochrome)
- Clear heading explaining why it's empty
- Helpful action or next step if applicable
- Centered layout

**Example:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
    <InboxIcon className="w-8 h-8 text-text-secondary" />
  </div>
  <h3 className="text-lg font-semibold text-text-primary mb-2">
    No matchups this week
  </h3>
  <p className="text-text-secondary max-w-sm">
    Check back next week to see your upcoming opponents.
  </p>
</div>
```

---

## Layout Patterns

### Page Layout

```
┌─────────────────────────────────────────┐
│ Header (logo, nav)                      │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Page Title ──────────────────────┐ │
│  │                                    │ │
│  │  Main Content Area                 │ │
│  │  (Grid of cards, tables, charts)   │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Container:**
- Max width: 1280px (xl breakpoint)
- Padding: 16px mobile, 24px tablet+
- Centered on page

**Grid Layouts:**
- 1 column on mobile (< 768px)
- 2 columns on tablet (768px - 1024px)
- 3-4 columns on desktop (> 1024px)
- Gap: 16px (--space-4) or 24px (--space-6)

### Navigation

**Desktop:**
- Horizontal nav bar
- Logo left, nav links center/right
- Active link: Underline or background highlight

**Mobile:**
- Hamburger menu or bottom tab bar
- Icon + label
- Active state: Colored icon/text

---

## Accessibility Guidelines

- All interactive elements must have `:focus` styles (ring, outline)
- Use semantic HTML (`<table>`, `<nav>`, `<main>`, etc.)
- Images/icons need `alt` text or `aria-label`
- Color contrast ratio ≥ 4.5:1 for text
- Keyboard navigable (tab order, enter to activate)
- ARIA labels for icon-only buttons
- Loading states announced to screen readers

---

## Responsive Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Small tablet */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

**Mobile-first approach:**
- Design for 375px width first
- Progressively enhance for larger screens
- Tables → Cards on mobile
- Hide less critical columns on small screens
- Stack stat cards vertically

---

## Animation & Transitions

**Principles:**
- Use sparingly - only when it adds value
- Fast and snappy (150-250ms duration)
- Ease-out for entering elements
- Ease-in for exiting elements

**Common Transitions:**
```css
/* Hover states */
transition: all 150ms ease-out;

/* Page transitions (if using) */
transition: opacity 200ms ease-in-out;

/* Loading shimmer */
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

**Do:**
- Hover effects on interactive elements
- Smooth color transitions
- Fade in/out for modals and toasts
- Skeleton loading animations

**Don't:**
- Overuse motion (causes distraction)
- Animate on initial page load (slows perceived performance)
- Use animations longer than 500ms

---

## Design References

### Inspiration Sources

*Using this section to link screenshots that inspired me*

**Stat Cards:**
- [ ] ESPN Fantasy player cards
- [ ] Sleeper app team cards
- [ ] Add screenshot links here

**Tables:**
- [ ] Yahoo Sports standings
- [ ] NFL.com roster tables
- [ ] Add screenshot links here

**Charts:**
- [ ] Recharts examples gallery
- [ ] Fantasy Pros trend charts
- [ ] Add screenshot links here

**Overall Aesthetic:**
- [ ] Dark mode sports dashboards
- [ ] Modern SaaS analytics UIs
- [ ] Add screenshot links here

---

## Implementation Checklist

When building a new component, ensure:

- [ ] Uses design system colors (CSS variables)
- [ ] Follows spacing scale (4px increments)
- [ ] Responsive at all breakpoints
- [ ] Loading state implemented
- [ ] Empty state handled (if applicable)
- [ ] Hover/focus states styled
- [ ] Accessible (keyboard nav, ARIA labels)
- [ ] Matches spec in this document
- [ ] Tested on mobile device or DevTools

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Author:** Josh Bonus  
**Status:** in progress
