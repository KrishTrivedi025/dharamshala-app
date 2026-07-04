# Dharamshala Hall Booking App

A full-stack web platform for booking a community hall (dharamshala), with an admin
approval workflow, online payments, cashbook/donation tracking, and multilingual support
(English, Hindi, Marathi). Also packaged as an Android app via Capacitor.

## Features

- **Hall booking with admin approval** — users submit booking requests; admins review,
  approve/reject, and manage a calendar of locked (unavailable) dates.
- **Online payments (Razorpay)** — booking payments and ad-hoc "Daan Peti" (donation box)
  contributions are processed through Razorpay, with server-side signature verification
  (HMAC-SHA256) before a payment is trusted.
- **Cashbook** — admin-facing ledger of cash/online entries (`CashbookEntry` model) for
  reconciling bookings, donations, and rituals.
- **Annual ritual payments** — a separate flow for recurring/annual ritual bookings with
  their own Razorpay order + payment verification.
- **Role-based access** — JWT auth with `protect` / `adminOnly` / `optionalAuth`
  middleware; regular users vs. admin-only routes (booking requests, calendar, locked
  dates, cashbook, user management, refunds).
- **Multilingual UI** — English/Hindi/Marathi via a custom `LanguageContext` and
  translation files in `src/i18n/`.
- **Android app** — the same frontend wrapped with Capacitor for a native Android build.

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Framer Motion, React Router DOM v7
- **Backend:** Express 5, MongoDB via Mongoose, JWT auth, bcryptjs password hashing
- **Payments:** Razorpay
- **Mobile packaging:** Capacitor (Android)

## Project structure

```
backend/
├── server.js               # Express app entry, route mounting, CORS, error handling
├── config/db.js            # MongoDB connection
├── models/                 # User, Booking, CashbookEntry, DaanPetiDonation, LockedDate, Settings
├── controllers/            # auth, booking, cashbook, daanPeti, lockedDate, ritual, settings
├── middleware/authMiddleware.js  # protect / adminOnly / optionalAuth
├── routes/                 # one router per resource, mounted under /api/*
└── createAdmin.js          # one-off script to bootstrap/promote an admin user

frontend/
├── src/pages/               # Home, Login, Signup, Dashboard, Booking, MyBookings, ...
├── src/pages/admin/         # AdminDashboard, BookingRequests, CalendarView, LockedDates,
│                             # UserManagement, RefundManager
├── src/context/             # LanguageContext (i18n), AuthContext
├── src/i18n/                # en.js, hi.js, mr.js translation tables
└── android/                  # Capacitor-generated native Android project
```

## API overview

All routes are mounted under `/api`: `/auth`, `/bookings`, `/locked-dates`, `/cashbook`,
`/daan-peti`, `/settings`, `/ritual`. Auth routes: `POST /auth/register`,
`POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/change-password`,
`POST /auth/logout`. Protected routes require `Authorization: Bearer <token>`; admin-only
routes additionally require the authenticated user's `role` to be `admin`.

## Getting started

**Prerequisites:** Node.js, a MongoDB database (e.g. MongoDB Atlas), a Razorpay account
(test mode is fine for local dev).

### Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGODB_URI, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # VITE_API_URL=http://localhost:5000/api
npm run dev
```

### Creating the first admin user

```bash
cd backend
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='choose-a-strong-password' node createAdmin.js
```

This either creates a new admin user or promotes an existing user with that email to the
`admin` role. Change the password after first login regardless.

### Android build

```bash
cd frontend
npm run cap:sync   # or: npm run android (build + sync + open Android Studio)
```

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list. Notably:

| Variable | Where | Purpose |
|---|---|---|
| `MONGODB_URI` | backend | MongoDB Atlas connection string |
| `JWT_SECRET` | backend | JWT signing secret — required, no fallback |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | backend | Razorpay payment gateway |
| `ALLOWED_ORIGINS` | backend | CORS allow-list |
| `VITE_API_URL` | frontend | Backend API base URL |
