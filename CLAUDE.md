# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
important notice: Codex will review your output once you are done so do your work very carefully and do your best
## Project Overview

Dharamshala Hall Booking Application - a web platform for booking community halls with admin approval workflow and multilingual support (English, Hindi, Marathi).

## Development Commands

### Frontend (from `frontend/`)
```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend (from `backend/`)
```bash
npm run dev      # Start with nodemon (development)
npm start        # Start server (production)
```

## Architecture

### Frontend (`frontend/`)
- **Stack**: React 19 + Vite + Tailwind CSS v4 + Framer Motion + React Router DOM v7
- **Entry**: `src/main.jsx` → renders `App.jsx` with BrowserRouter and LanguageProvider
- **Routing**: All routes defined in `src/App.jsx` - public pages + admin routes under `/admin/*`
- **i18n**: Custom implementation via `src/context/LanguageContext.jsx` with translation files in `src/i18n/`
- **Theming**: CSS variables in `src/index.css`: `--primary` (#FF6B35), `--maroon` (#8B1A1A), `--secondary` (#F7C948), `--background` (#FDF8F0)
- **UI Pattern**: Inline styles with Framer Motion animations; glassmorphism aesthetic

**Key Directories**:
- `src/pages/` - Route components (Home, Login, Signup, Dashboard, Booking, MyBookings, etc.)
- `src/pages/admin/` - Admin panel pages (AdminDashboard, BookingRequests, CalendarView, LockedDates, WaitingListManager, UserManagement, RefundManager)
- `src/components/` - Shared components (Navbar, Footer, Loader, ProtectedRoute)
- `src/context/` - React contexts (LanguageContext implemented; AuthContext is placeholder)

### Backend (`backend/`)
- **Stack**: Express 5 + MongoDB (Mongoose) + JWT + bcryptjs
- **Entry**: `server.js` - Express server with CORS, JSON parsing, error handling
- **Database**: MongoDB Atlas connection via `config/db.js`
- **Auth**: JWT-based authentication with bcryptjs password hashing

**Backend Structure**:
- `models/User.js` - User schema with password hashing, validation, and comparison methods
- `controllers/authController.js` - Register, Login, GetMe, UpdateProfile, ChangePassword, Logout
- `routes/authRoutes.js` - Auth route definitions
- `middleware/authMiddleware.js` - JWT protection middleware (`protect`, `adminOnly`, `optionalAuth`)

**Auth API Endpoints**:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Protected |
| PUT | `/api/auth/profile` | Update profile | Protected |
| PUT | `/api/auth/change-password` | Change password | Protected |
| POST | `/api/auth/logout` | Logout user | Protected |

**Testing Auth API (PowerShell)**:
```powershell
# Register
$body = '{"name":"John Doe","email":"john@example.com","phone":"9876543210","password":"password123"}'
Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method POST -ContentType 'application/json' -Body $body

# Login
$body = '{"email":"john@example.com","password":"password123"}'
Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -ContentType 'application/json' -Body $body

# Get Current User (Protected)
$token = "YOUR_TOKEN_FROM_LOGIN"
Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/me' -Method GET -Headers @{Authorization="Bearer $token"}
```

**Environment Variables** (`.env`):
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secure_jwt_secret
```

## Route Structure

| Path | Component |
|------|-----------|
| `/` | Home |
| `/login` | Login |
| `/signup` | Signup |
| `/dashboard` | Dashboard |
| `/booking` | Booking |
| `/booking-status` | BookingStatus |
| `/my-bookings` | MyBookings |
| `/waiting-list` | WaitingList |
| `/notifications` | Notifications |
| `/profile` | Profile |
| `/admin` | AdminDashboard |
| `/admin/requests` | BookingRequests |
| `/admin/calendar` | CalendarView |
| `/admin/locked-dates` | LockedDates |
| `/admin/waiting-list` | WaitingListManager |
| `/admin/users` | UserManagement |
| `/admin/refunds` | RefundManager |

## Translation Keys

Translation files (`src/i18n/*.js`) use nested objects. Access via `useLanguage()` hook:
```jsx
const { t, language, changeLanguage } = useLanguage()
// Usage: t.nav.home, t.auth.login_title, t.booking.status_pending
```

## UI Conventions

- Orange/amber gradient buttons: `linear-gradient(135deg, #FF6B35 0%, #8B1A1A 100%)`
- Glassmorphism cards: `background: 'rgba(255,255,255,0.92)'`, `backdropFilter: 'blur(24px)'`
- Animations via Framer Motion: `whileHover`, `whileTap`, `initial`, `animate`
- Mobile-first responsive: Tailwind classes + inline media queries