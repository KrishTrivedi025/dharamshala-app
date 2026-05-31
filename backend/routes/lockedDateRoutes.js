import express from 'express'
import {
  getLockedDates,
  createLockedDate,
  releaseLockedDate
} from '../controllers/lockedDateController.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', protect, adminOnly, getLockedDates)
router.post('/', protect, adminOnly, createLockedDate)
router.delete('/:id', protect, adminOnly, releaseLockedDate)

export default router
