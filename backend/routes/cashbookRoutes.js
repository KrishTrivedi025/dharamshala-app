import express from 'express'
import {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  getSummary,
  getNextReceipt,
  getAnnualRituals,
  recordRitualPayment,
  updateRitualPayment
} from '../controllers/cashbookController.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require admin
router.use(protect, adminOnly)

router.get('/summary', getSummary)
router.get('/next-receipt', getNextReceipt)
router.get('/annual-rituals/:year', getAnnualRituals)
router.post('/annual-rituals', recordRitualPayment)
router.put('/annual-rituals/:id', updateRitualPayment)

router.get('/', getEntries)
router.post('/', createEntry)
router.put('/:id', updateEntry)
router.delete('/:id', deleteEntry)

export default router
