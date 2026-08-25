import express from 'express'
import {
  getMembers,
  createMember,
  bulkCreateMembers,
  updateMember,
  deleteMember
} from '../controllers/memberController.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require admin
router.use(protect, adminOnly)

router.get('/', getMembers)
router.post('/', createMember)
router.post('/bulk', bulkCreateMembers)
router.put('/:id', updateMember)
router.delete('/:id', deleteMember)

export default router
