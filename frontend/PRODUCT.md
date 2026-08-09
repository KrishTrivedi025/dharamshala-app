# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — Community members:** Residents of the local dharamshala community who want to book the hall for events (weddings, pujas, celebrations, meetings). They approach the booking on mobile or desktop, often in a shared-device or low-bandwidth environment. Goal: reserve a date, get confirmation, pay.

**Secondary — Admin steward:** A trusted community administrator who reviews booking requests, sets prices, approves or rejects applications, manages locked dates, tracks payments, and runs financial records (cashbook). Works primarily on desktop.

## Product Purpose

Dharamshala Hall Booking Application — a community-run web platform that lets members request hall bookings, tracks admin approval and payment status, and gives the admin a full back-office for managing the hall's schedule, finances, and user accounts.

Success means: a member submits a request in under two minutes, the admin processes it without phone calls, and the hall's schedule and cashbook are always accurate.

## Positioning

A purpose-built, bilingual booking system for a specific community hall — not a generic booking widget. It understands the local vocabulary (dharamshala, daan peti, annual shulk, ritual payment), supports the community's three languages, and is operated by the community for the community with no third-party platform dependency.

## Operating Context

- Members access from mobile phones (Android, via Capacitor APK and mobile browser) and desktop browsers
- Admin works primarily from a desktop browser managing an admin panel with sidebar navigation
- Three languages: English, Hindi, Marathi — currently partially translated (Navbar, Login, Signup only)
- Backend deployed to Vercel; frontend deployed to Vercel; mobile app via Capacitor
- Annual ritual payment (shulk) is a recurring obligation for registered members, tracked separately from booking payments

## Capabilities and Constraints

- Hall booking with admin approval workflow: submit → admin review + price set → member pays → confirmed
- Booking status tracking, waiting list management, locked/unavailable date management
- User management (admin), refund management (admin), cashbook financial records (admin)
- Daan Peti (donation box) — public donation page
- Ritual/Annual payment tracking with payment modal
- No real venue photography exists in the repo; placeholder assets only
- No dark mode; not planned for this redesign
- WaitingList and WaitingListManager pages/routes do not exist in the codebase (confirmed absent)
- i18n partial coverage: only Navbar, Login, Signup use useLanguage(); all other pages are hardcoded English

## Brand Commitments

- Name: Dharamshala (the hall/place itself, not a brand name per se)
- Cultural context: temple / devotional / community; three emoji are culturally load-bearing and must be preserved: 🛕 (temple mark), 🙏 (namaste), 🪔 (diya — central to ritual payment feature)
- Primary color family rooted in orange (#FF6B35); the brand does not have a logo asset in the repo
- Voice: respectful, community-focused, functional; not corporate

## Evidence on Hand

- Full source codebase (React 19 + Vite + Tailwind CSS v4 + Framer Motion + React Router v7)
- Working auth system (JWT, localStorage-backed)
- Working API contracts (booking, auth, cashbook, ritual)
- No real photos of the hall; no testimonials; no press; no pricing content
- Translation files: src/i18n/en.js, hi.js, mr.js (partial coverage only)

## Product Principles

1. **Community first, not platform first.** The app is an administrative convenience for a human community; it should feel like trusted local software, not a SaaS product.
2. **Admin clarity over user delight.** The admin back-office (7 pages) handles real money and real schedules; correctness and scannability matter more than expressiveness.
3. **Mobile access is equal.** Members primarily arrive on phones; every booking and status flow must work without horizontal scroll, tiny targets, or broken layouts.
4. **Partial translation is a feature, not a bug.** Three languages are live where it matters most (auth, navigation); expanding coverage is out of scope for this redesign.
5. **One source of truth per thing.** No copy-pasted logic, no duplicated style constants, no parallel implementations.

## Accessibility & Inclusion

WCAG AA contrast on all interactive elements. Touch targets minimum 44×44px on mobile. Multilingual text layout must not overflow or clip in Hindi/Marathi on the three translated pages.
