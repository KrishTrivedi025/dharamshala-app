import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Booking from './pages/Booking'
import BookingStatus from './pages/BookingStatus'
import MyBookings from './pages/MyBookings'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import AdminDashboard from './pages/admin/AdminDashboard'
import BookingRequests from './pages/admin/BookingRequests'
import CalendarView from './pages/admin/CalendarView'
import LockedDates from './pages/admin/LockedDates'
import UserManagement from './pages/admin/UserManagement'
import RefundManager from './pages/admin/RefundManager'
import Cashbook from './pages/admin/Cashbook'
import DaanPeti from './pages/DaanPeti'

function App() {
  return (
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
      <Route path="/daan-peti" element={<DaanPeti />} />
    </Routes>
  )
}

export default App