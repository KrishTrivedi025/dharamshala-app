import express from 'express'
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  getAllUsers,
  toggleUserStatus
} from '../controllers/authController.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)
router.put('/change-password', protect, changePassword)
router.post('/logout', protect, logout)
router.get('/users', protect, adminOnly, getAllUsers)
router.put('/users/:id/toggle', protect, adminOnly, toggleUserStatus)

export default router
