import express from 'express'
import {
  createDonationOrder,
  verifyDonationPayment,
  getReceipt,
  getMyDonations
} from '../controllers/daanPetiController.js'
import { protect, optionalAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes (guest-friendly with optional auth)
router.post('/create-order', optionalAuth, createDonationOrder)
router.post('/verify-payment', optionalAuth, verifyDonationPayment)
router.get('/receipt/:id', getReceipt)

// Private routes (logged in users only)
router.get('/my-donations', protect, getMyDonations)

export default router
