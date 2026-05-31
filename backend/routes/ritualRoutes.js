import express from 'express'
import {
  getMyRitualStatus,
  createRitualOrder,
  verifyRitualPayment,
  submitCashPayment,
  getRitualReceipt
} from '../controllers/ritualController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

router.get('/my-status', getMyRitualStatus)
router.post('/create-order', createRitualOrder)
router.post('/verify-payment', verifyRitualPayment)
router.post('/cash-payment', submitCashPayment)
router.get('/receipt/:entryId', getRitualReceipt)

export default router
