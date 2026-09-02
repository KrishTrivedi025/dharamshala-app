import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Loader from './components/Loader'

const Home          = lazy(() => import('./pages/Home'))
const Login         = lazy(() => import('./pages/Login'))
const Signup        = lazy(() => import('./pages/Signup'))
const Dashboard     = lazy(() => import('./pages/Dashboard'))
const Booking       = lazy(() => import('./pages/Booking'))
const BookingStatus = lazy(() => import('./pages/BookingStatus'))
const MyBookings    = lazy(() => import('./pages/MyBookings'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile       = lazy(() => import('./pages/Profile'))
const DaanPeti      = lazy(() => import('./pages/DaanPeti'))

const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'))
const BookingRequests = lazy(() => import('./pages/admin/BookingRequests'))
const CalendarView    = lazy(() => import('./pages/admin/CalendarView'))
const LockedDates     = lazy(() => import('./pages/admin/LockedDates'))
const UserManagement  = lazy(() => import('./pages/admin/UserManagement'))
const RefundManager   = lazy(() => import('./pages/admin/RefundManager'))
const Cashbook        = lazy(() => import('./pages/admin/Cashbook'))
const Members         = lazy(() => import('./pages/admin/Members'))
const BulkRitualEntry = lazy(() => import('./pages/admin/BulkRitualEntry')) // temporary — not in sidebar nav

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        <Route path="/booking-status" element={<ProtectedRoute><BookingStatus /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/requests" element={<ProtectedRoute adminOnly><BookingRequests /></ProtectedRoute>} />
        <Route path="/admin/calendar" element={<ProtectedRoute adminOnly><CalendarView /></ProtectedRoute>} />
        <Route path="/admin/locked-dates" element={<ProtectedRoute adminOnly><LockedDates /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/refunds" element={<ProtectedRoute adminOnly><RefundManager /></ProtectedRoute>} />
        <Route path="/admin/cashbook" element={<ProtectedRoute adminOnly><Cashbook /></ProtectedRoute>} />
        <Route path="/admin/members" element={<ProtectedRoute adminOnly><Members /></ProtectedRoute>} />
        <Route path="/admin/bulk-ritual-entry" element={<ProtectedRoute adminOnly><BulkRitualEntry /></ProtectedRoute>} />
        <Route path="/daan-peti" element={<DaanPeti />} />
      </Routes>
    </Suspense>
  )
}

export default App
