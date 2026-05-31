import LockedDate from '../models/LockedDate.js'

// @desc    Get all locked dates
// @route   GET /api/locked-dates
// @access  Private (Admin only)
export const getLockedDates = async (req, res) => {
  try {
    const lockedDates = await LockedDate.find({ isActive: true })
      .sort({ startDate: -1 })
      .populate('createdBy', 'name email')

    res.status(200).json({
      success: true,
      count: lockedDates.length,
      data: lockedDates
    })
  } catch (error) {
    console.error('Get locked dates error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching locked dates' })
  }
}

// @desc    Create a locked date range
// @route   POST /api/locked-dates
// @access  Private (Admin only)
export const createLockedDate = async (req, res) => {
  try {
    const { startDate, endDate, reason, lockType, timeSlots, notes } = req.body

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide startDate, endDate, and reason'
      })
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      })
    }

    const lockedDate = await LockedDate.create({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      lockType: lockType || 'full',
      timeSlots: timeSlots || [],
      createdBy: req.user.id,
      notes: notes || ''
    })

    await lockedDate.populate('createdBy', 'name email')

    res.status(201).json({
      success: true,
      message: 'Dates locked successfully',
      data: lockedDate
    })
  } catch (error) {
    console.error('Create locked date error:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ success: false, message: messages.join(', ') })
    }
    res.status(500).json({ success: false, message: 'Server error while locking dates' })
  }
}

// @desc    Release (delete) a locked date
// @route   DELETE /api/locked-dates/:id
// @access  Private (Admin only)
export const releaseLockedDate = async (req, res) => {
  try {
    const lockedDate = await LockedDate.findById(req.params.id)

    if (!lockedDate) {
      return res.status(404).json({ success: false, message: 'Locked date not found' })
    }

    lockedDate.isActive = false
    await lockedDate.save()

    res.status(200).json({
      success: true,
      message: 'Date lock released successfully'
    })
  } catch (error) {
    console.error('Release locked date error:', error)
    res.status(500).json({ success: false, message: 'Server error while releasing lock' })
  }
}
