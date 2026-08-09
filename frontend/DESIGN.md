---
name: Dharamshala Hall Booking
description: Community hall booking platform with admin approval workflow and multilingual support
colors:
  primary: "#FF6B35"
  primary-deep: "#e05a28"
  secondary: "#F7C948"
  maroon: "#8B1A1A"
  background: "#FDF8F0"
  text: "#2D2D2D"
  glass-surface: "rgba(255,255,255,0.92)"
  input-border: "#ede8e0"
typography:
  body:
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "28px"
  full: "99px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, #FF6B35 0%, #8B1A1A 100%)"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "linear-gradient(135deg, #e05a28 0%, #6d1414 100%)"
    textColor: "#ffffff"
  card:
    backgroundColor: "rgba(255,255,255,0.92)"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  input:
    backgroundColor: "rgba(255,255,255,0.7)"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: Dharamshala Hall Booking

> **ANTI-REFERENCE** — This file documents the **incumbent visual system as it exists before the redesign**. It is the "before" snapshot. The redesign replaces this world; do not extend or repeat these patterns in new work.

## Overview

**Creative North Star: "The Temple Fair at Dusk" (incumbent — being replaced)**

The current interface is built on a saturated orange-to-maroon gradient-everywhere aesthetic: every button is a gradient, every page background carries floating glassmorphic blobs, every card blurs its background. The visual language borrows heavily from 2020-era glassmorphism trends — translucent cards against gradient backgrounds, warm drop shadows, and a heavy hand with motion. The result reads as energetic but generic; the Indian community context is present in the emoji set (🛕 🙏 🪔) and color warmth but not in the design DNA itself. There is no typographic hierarchy beyond bold weight shifts; ad hoc pixel sizes (9.5px, 11.5px, 13.5px) with no scale system make the interface feel assembled rather than designed.

**Key Characteristics of the incumbent (anti-reference):**
- Every interactive element uses the orange→maroon gradient
- Glassmorphism applied globally: `backdrop-filter: blur(24px)`, `background: rgba(255,255,255,0.92)` everywhere
- Floating animated orbs in page backgrounds (infinite rotate/scale loops)
- ~50+ emoji as functional icons (📒 ➕ 📥 ✏️ 🗑️ ✅ ⏳ ❌ etc.)
- No spacing, radius, or shadow token scale — values hand-authored per instance
- Hover states faked via onMouseEnter/onMouseLeave JS + inline `<style>` tag injections
- 5 flat CSS custom properties total; all other values hardcoded in 23 files

## Colors

The palette is warm and festive, leaning into orange and gold with a deep maroon complement. In practice every accent is applied everywhere simultaneously — no restraint, no hierarchy.

### Primary
- **Festival Orange** (#FF6B35): The brand's only true accent. Currently used on every button, every CTA, every decorative element, every scrollbar thumb. Overused to the point of losing emphasis.

### Secondary
- **Temple Gold** (#F7C948): Intended as a warm highlight, used mainly in gradient step stops and the "How it Works" section icons. Rarely appears cleanly.

### Tertiary
- **Deep Maroon** (#8B1A1A): The gradient partner to orange. Appears in virtually every button and background gradient. Also the second nav color and admin sidebar accent.

### Neutral
- **Warm Cream** (#FDF8F0): Page background. Warm and appropriate for the context; a keeper.
- **Near-Black** (#2D2D2D): Body text. Readable, appropriate.
- **Glass Surface** (rgba(255,255,255,0.92)): Card backgrounds. Applied to every container.
- **Input Border Gray** (#ede8e0): Border color for all form inputs. Not tokenized — hardcoded in 12 files.

### Named Rules
**The Gradient Everywhere Rule (anti-pattern).** The incumbent applies the orange→maroon gradient to every button, header band, and page decoration simultaneously. The redesign must break this: the primary accent appears on ≤2 interactive elements per screen; gradients are retired in favor of solid tokens.

## Typography

**Body Font:** 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif (system stack — correct choice, keep)

**Character:** No display font. All text is the same system sans at varying weights and ad hoc pixel sizes. There is no typographic hierarchy system — headline vs. body vs. label is communicated only via bold vs. normal weight and approximate size.

### Hierarchy (incumbent — unscaled)
- **Largest headings:** 24–32px, weight 700, ad hoc per page
- **Section titles:** 18–22px, weight 600–700
- **Body text:** 14–16px, weight 400–500
- **Small labels:** 9.5px–13.5px — too small; mid-sizes (11.5px, 13.5px) are not on any standard scale
- **Line height:** 1.4–1.6 (reasonable; preserve)

### Named Rules
**The No-Scale Rule (anti-pattern).** The incumbent has no rem-based type scale — sizes are hand-authored px values with half-pixel steps (13.5px, 11.5px). The redesign must introduce a fixed rem scale (~7–8 steps).

## Layout

Full-width single-page layouts with centered content columns. Cards are padded generously (24–40px). The AdminSidebar is fixed at 260px width with `height: 100vh` and no responsive handling — the single most impactful layout bug in the codebase (affects all 7 admin routes via shared import). No CSS Grid at the page level except CalendarView and Home hero; most pages are flex-column stacks. No container max-width token — values set per-page (600px, 800px, 1100px, etc.).

Responsive: a single `@media (max-width: 1023px)` block in index.css with `!important` flags handles all mobile adaptation for Navbar and Home hero. No per-component responsive logic elsewhere.

## Elevation & Depth

Depth is conveyed via both glassmorphism (backdrop-filter: blur) and hand-authored warm shadows. The shadow tint borrows the brand orange/maroon hue — a good instinct that the redesign should keep.

### Shadow Vocabulary
- **Card glow** (`0 20px 60px rgba(255,107,53,0.15)`): The dominant shadow, applied to most cards and modals.
- **Maroon card** (`0 8px 32px rgba(139,26,26,0.12)`): Used on auth panels and admin cards.
- **Subtle lift** (`0 2px 8px rgba(0,0,0,0.08)`): Input focus and small interactive elements.
- **Deep modal** (`0 30px 80px rgba(0,0,0,0.3)`): Full-screen modals.

### Named Rules
**The Warm Tint Rule (keep this instinct).** Shadows carry a warm tint from the brand palette rather than neutral gray — `rgba(255,107,53,0.15)` instead of `rgba(0,0,0,0.15)`. This grounds the elevated surfaces in the color world. The redesign should preserve this character.

## Shapes

Corner radii range from 8px to 28px and 99px (pill) with no system. Buttons are pill-shaped (99px). Cards are 20–28px radius. Inputs are 8–12px radius. The shape language is rounded and soft — appropriate for the community context. There is no visual sharpness anywhere.

## Components

### Buttons
- **Shape:** Pill — `border-radius: 99px`
- **Primary:** Orange→maroon gradient, white text, 14px 32px padding, `font-weight: 600`
- **Hover / Focus:** Scale 1.05 via Framer Motion `whileHover`; gradient darkens via JS state
- **Ghost:** Transparent fill with orange border + text; used for secondary CTAs
- **Current gap:** No keyboard focus ring; hover handled via onMouseEnter (breaks with keyboard-only nav)

### Cards / Containers
- **Corner Style:** 20–28px radius (large, soft)
- **Background:** `rgba(255,255,255,0.92)` with `backdrop-filter: blur(24px)`
- **Shadow Strategy:** Warm orange-tinted drop shadow (see Elevation)
- **Border:** None (glass effect only)
- **Internal Padding:** 24–40px

### Inputs / Fields
- **Style:** White/semi-transparent fill, `border: 1.5px solid #ede8e0`, 8–12px radius
- **Focus:** Orange border (`var(--primary)`) + faint box-shadow — handled via JS `onFocus`/`onBlur`
- **Error:** Red border; error text below field
- **Gap:** The `inputStyle` function is defined independently in 6 files with near-identical implementations

### Navigation
- **Style:** Glassmorphic navbar, `backdrop-filter: blur(12px)`, white background when scrolled
- **Desktop:** Horizontal nav links, language switcher dropdown, user menu dropdown
- **Mobile:** Hamburger → full-screen overlay menu (functional but via inline `<style>` tag injection for hover states)
- **Active state:** Orange left border + subtle background highlight

### Status Badges
- **Pattern:** `STATUS_COLORS` object mapping status strings to hex color pairs (background + text), copy-pasted verbatim across 4 files (AdminDashboard, CalendarView, BookingRequests, Dashboard)
- **Redesign target:** Consolidate into a `<StatusBadge>` component using semantic CSS vars

### Signature: Glassmorphic Page Shell
Every page uses the same pattern: `background: var(--background)`, centered content column, glassmorphic card as the main container. The page shell is not a component — it is copy-pasted. This is the single largest structural duplication in the codebase.

## Do's and Don'ts

### Don't (incumbent anti-patterns to eliminate in the redesign):
- **Don't** apply the orange→maroon gradient to every button — reserve it for one primary CTA per screen maximum
- **Don't** use `backdrop-filter: blur(24px)` on every card — use it only where depth hierarchy requires it
- **Don't** inject hover styles via inline `<style>` tags or onMouseEnter/onMouseLeave — use Tailwind `hover:` classes or CSS custom properties
- **Don't** define `inputStyle` locally in each file — use the shared `styles/theme.js` module
- **Don't** use emoji as functional icons (except 🛕 🙏 🪔) — use @phosphor-icons/react
- **Don't** use ad hoc px font sizes (9.5px, 11.5px, 13.5px) — use the rem type scale
- **Don't** hardcode `#FF6B35`, `#8B1A1A`, `#ede8e0` — use CSS custom property tokens
- **Don't** leave `AdminSidebar` without responsive handling — convert to off-canvas drawer at `< lg`

### Do (what the incumbent gets right — preserve in the redesign):
- **Do** keep the warm cream background (`#FDF8F0`) — it grounds the interface in a warm, community context
- **Do** keep warm-tinted shadows — the orange/maroon tint in box-shadows is distinctive and appropriate
- **Do** keep `framer-motion` for animations — it's well-integrated and the motion quality is a genuine strength
- **Do** keep the pill-button shape (`border-radius: 99px`) for primary CTAs — it fits the soft visual character
- **Do** keep the three culturally load-bearing emoji: 🛕, 🙏, 🪔
- **Do** keep system fonts (`'Segoe UI'` stack) — no webfont loading
- **Do** keep `scale(0.97)` or `scale(0.95)` on button tap/click via `whileTap`
