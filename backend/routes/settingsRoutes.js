import express from 'express'
import { getSettings, updateSettings, getRitualFee } from '../controllers/settingsController.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

// Any logged-in user can fetch the fee
router.get('/ritual-fee', protect, getRitualFee)

// Admin-only full settings CRUD
router.get('/', protect, adminOnly, getSettings)
router.put('/', protect, adminOnly, updateSettings)

export default router
