import express from 'express'
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAvailableDates,
  getBookingStats,
  getAllBookings,
  getPendingBookings,
  approveBooking,
  rejectBooking,
  completeBooking,
  getAdminStats,
  getCalendarBookings,
  getRefunds,
  processRefund,
  setBookingPrice,
  createPaymentOrder,
  verifyPayment
} from '../controllers/bookingController.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/available-dates', getAvailableDates)
router.get('/my-bookings', protect, getMyBookings)
router.get('/stats', protect, getBookingStats)

router.get('/admin/all', protect, adminOnly, getAllBookings)
router.get('/admin/pending', protect, adminOnly, getPendingBookings)
router.get('/admin/calendar', protect, adminOnly, getCalendarBookings)
router.get('/admin/stats', protect, adminOnly, getAdminStats)
router.get('/admin/refunds', protect, adminOnly, getRefunds)

router.post('/', protect, createBooking)
router.get('/:id', protect, getBookingById)
router.put('/:id/cancel', protect, cancelBooking)
router.put('/:id/approve', protect, adminOnly, approveBooking)
router.put('/:id/reject', protect, adminOnly, rejectBooking)
router.put('/:id/complete', protect, adminOnly, completeBooking)
router.put('/:id/process-refund', protect, adminOnly, processRefund)
router.put('/:id/set-price', protect, adminOnly, setBookingPrice)
router.post('/:id/create-order', protect, createPaymentOrder)
router.post('/:id/verify-payment', protect, verifyPayment)

export default router
