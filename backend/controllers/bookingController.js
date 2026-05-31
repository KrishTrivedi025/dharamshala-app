import Booking from '../models/Booking.js'
import CashbookEntry from '../models/CashbookEntry.js'
import LockedDate from '../models/LockedDate.js'
import User from '../models/User.js'
import Razorpay from 'razorpay'
import crypto from 'crypto'

let _razorpay = null
const getRazorpay = () => {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return _razorpay
}

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const {
      eventName,
      eventType,
      description,
      eventDate,
      startTime,
      endTime,
      expectedGuests,
      contactName,
      contactPhone,
      contactEmail,
      address,
      baseAmount,
      cleaningFee,
      securityDeposit,
      gstAmount,
      totalAmount,
      specialRequests,
      cateringRequired,
      cateringDetails,
      decorationRequired,
      decorationDetails,
      audioVisualRequired,
      additionalDates
    } = req.body

    // Validate required fields
    if (!eventName || !eventDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: eventName, eventDate'
      })
    }

    // Check if the date is locked
    const lockedDates = await LockedDate.findLocksForDate(eventDate)
    if (lockedDates.length > 0) {
      // Check if any lock is a full day lock
      const fullDayLock = lockedDates.find(lock => lock.lockType === 'full')
      if (fullDayLock) {
        return res.status(400).json({
          success: false,
          message: `This date is not available: ${fullDayLock.reason}`
        })
      }
      
      // Check for time slot conflicts
      for (const lock of lockedDates) {
        if (lock.lockType === 'partial' && lock.timeSlots) {
          for (const slot of lock.timeSlots) {
            if (timeRangesOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
              return res.status(400).json({
                success: false,
                message: `Time slot not available: ${lock.reason}`
              })
            }
          }
        }
      }
    }

    // Check for existing bookings on the same date
    const existingBookings = await Booking.find({
      eventDate: new Date(eventDate),
      status: { $in: ['pending', 'approved'] }
    })

    // Check for time conflicts with existing bookings
    for (const booking of existingBookings) {
      if (timeRangesOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is already booked. Please choose a different time.'
        })
      }
    }

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      eventName,
      eventType,
      description: description || '',
      eventDate: new Date(eventDate),
      startTime,
      endTime,
      expectedGuests,
      contactName: contactName || req.user.name,
      contactPhone: contactPhone || req.user.phone,
      contactEmail: contactEmail || req.user.email,
      address: address || {},
      baseAmount: baseAmount || 0,
      cleaningFee: cleaningFee || 0,
      securityDeposit: securityDeposit || 0,
      gstAmount: gstAmount || 0,
      totalAmount: totalAmount || 0,
      specialRequests: specialRequests || '',
      cateringRequired: cateringRequired || false,
      cateringDetails: cateringDetails || '',
      decorationRequired: decorationRequired || false,
      decorationDetails: decorationDetails || '',
      audioVisualRequired: audioVisualRequired || false,
      additionalDates: additionalDates ? additionalDates.map(d => new Date(d)) : []
    })

    // Populate user details
    await booking.populate('user', 'name email phone')

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Awaiting admin approval.',
      data: booking
    })
  } catch (error) {
    console.error('Create booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// @desc    Get all bookings for current user
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const { status, sort = '-createdAt' } = req.query
    
    const query = { user: req.user.id }
    if (status) {
      query.status = status
    }

    const bookings = await Booking.find(query)
      .sort(sort)
      .populate('user', 'name email phone')

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    })
  } catch (error) {
    console.error('Get my bookings error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    })
  }
}

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('reviewedBy', 'name email')

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    // Check if user owns the booking or is admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      })
    }

    res.status(200).json({
      success: true,
      data: booking
    })
  } catch (error) {
    console.error('Get booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking'
    })
  }
}

// @desc    Update booking (only pending bookings)
// @route   PUT /api/bookings/:id
// @access  Private
export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    // Check ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      })
    }

    // Only pending bookings can be updated
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be updated'
      })
    }

    // Update allowed fields
    const allowedUpdates = [
      'eventName', 'eventType', 'description', 'eventDate',
      'startTime', 'endTime', 'expectedGuests', 'contactName',
      'contactPhone', 'contactEmail', 'address', 'specialRequests',
      'cateringRequired', 'cateringDetails', 'decorationRequired',
      'decorationDetails', 'audioVisualRequired'
    ]

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        booking[field] = req.body[field]
      }
    })

    await booking.save()
    await booking.populate('user', 'name email phone')

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    })
  } catch (error) {
    console.error('Update booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking'
    })
  }
}

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const { cancellationReason } = req.body
    
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    // Check ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      })
    }

    // Can only cancel pending or approved bookings
    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'This booking cannot be cancelled'
      })
    }

    booking.status = 'cancelled'
    booking.cancelledBy = req.user.id
    booking.cancelledAt = new Date()
    booking.cancellationReason = cancellationReason || 'Cancelled by user'

    // Set refund status if payment was made
    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'partial') {
      booking.refundStatus = 'pending'
      booking.refundAmount = booking.totalAmount
    }

    await booking.save()

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking'
    })
  }
}

// @desc    Get available dates
// @route   GET /api/bookings/available-dates
// @access  Public
export const getAvailableDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide startDate and endDate'
      })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Get all locked dates in range
    const lockedDates = await LockedDate.find({
      isActive: true,
      $or: [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } }
      ]
    })

    // Get all booked dates in range (including additionalDates)
    const bookings = await Booking.find({
      $or: [
        { eventDate: { $gte: start, $lte: end } },
        { additionalDates: { $elemMatch: { $gte: start, $lte: end } } }
      ],
      status: { $in: ['pending', 'approved'] }
    })

    // Generate availability for each date
    const availability = []
    const current = new Date(start)
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const dayOfWeek = current.getDay()
      
      // Check if date is locked
      const dayLocks = lockedDates.filter(lock => {
        const lockStart = new Date(lock.startDate)
        const lockEnd = new Date(lock.endDate)
        return current >= lockStart && current <= lockEnd
      })

      // Check bookings for this date (primary + additional dates)
      const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.eventDate)
        if (bookingDate.toDateString() === current.toDateString()) return true
        if (b.additionalDates && b.additionalDates.length > 0) {
          return b.additionalDates.some(ad => new Date(ad).toDateString() === current.toDateString())
        }
        return false
      })

      // Determine availability
      let status = 'available'
      let unavailableReason = null

      if (dayLocks.some(l => l.lockType === 'full')) {
        status = 'locked'
        unavailableReason = dayLocks.find(l => l.lockType === 'full')?.reason
      } else if (dayBookings.length > 0) {
        // Check if fully booked (assuming full day booking)
        const hasFullDayBooking = dayBookings.some(b => {
          const startHour = parseInt(b.startTime.split(':')[0])
          const endHour = parseInt(b.endTime.split(':')[0])
          return endHour - startHour >= 10 // More than 10 hours = full day
        })
        
        if (hasFullDayBooking) {
          status = 'booked'
        } else {
          status = 'partial'
        }
      }

      availability.push({
        date: dateStr,
        dayOfWeek,
        status,
        unavailableReason,
        bookings: dayBookings.map(b => ({
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status
        }))
      })

      current.setDate(current.getDate() + 1)
    }

    res.status(200).json({
      success: true,
      data: availability
    })
  } catch (error) {
    console.error('Get available dates error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching availability'
    })
  }
}

// @desc    Get booking statistics (for dashboard)
// @route   GET /api/bookings/stats
// @access  Private
export const getBookingStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])

    const totalBookings = await Booking.countDocuments({ user: req.user.id })
    const upcomingBookings = await Booking.countDocuments({
      user: req.user.id,
      status: 'approved',
      eventDate: { $gte: new Date() }
    })

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        total: totalBookings,
        upcoming: upcomingBookings
      }
    })
  } catch (error) {
    console.error('Get booking stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    })
  }
}

// Helper function to check if time ranges overlap
function timeRangesOverlap(start1, end1, start2, end2) {
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + (minutes || 0)
  }

  const start1Min = toMinutes(start1)
  const end1Min = toMinutes(end1)
  const start2Min = toMinutes(start2)
  const end2Min = toMinutes(end2)

  return start1Min < end2Min && end1Min > start2Min
}

// ============ ADMIN CONTROLLERS ============

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings/admin/all
// @access  Private (Admin only)
export const getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, sort = '-createdAt', page = 1, limit = 20 } = req.query

    const query = {}
    if (status) query.status = status
    if (startDate || endDate) {
      query.eventDate = {}
      if (startDate) query.eventDate.$gte = new Date(startDate)
      if (endDate) query.eventDate.$lte = new Date(endDate)
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const bookings = await Booking.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email phone')

    const total = await Booking.countDocuments(query)

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: bookings
    })
  } catch (error) {
    console.error('Get all bookings error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    })
  }
}

// @desc    Get pending booking requests (Admin)
// @route   GET /api/bookings/admin/pending
// @access  Private (Admin only)
export const getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .populate('user', 'name email phone address')

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    })
  } catch (error) {
    console.error('Get pending bookings error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending bookings'
    })
  }
}

// @desc    Approve booking (Admin)
// @route   PUT /api/bookings/:id/approve
// @access  Private (Admin only)
export const approveBooking = async (req, res) => {
  try {
    const { adminNotes, totalAmount } = req.body
    
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be approved'
      })
    }

    booking.status = 'approved'
    booking.reviewedBy = req.user.id
    booking.reviewedAt = new Date()
    if (totalAmount !== undefined && totalAmount > 0) {
      booking.totalAmount = totalAmount
      booking.baseAmount = totalAmount
    }
    if (adminNotes) booking.adminNotes = adminNotes

    await booking.save()
    await booking.populate('user', 'name email phone')
    await booking.populate('reviewedBy', 'name email')

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: booking
    })
  } catch (error) {
    console.error('Approve booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while approving booking'
    })
  }
}

// @desc    Reject booking (Admin)
// @route   PUT /api/bookings/:id/reject
// @access  Private (Admin only)
export const rejectBooking = async (req, res) => {
  try {
    const { rejectionReason, adminNotes } = req.body

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection'
      })
    }
    
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be rejected'
      })
    }

    booking.status = 'rejected'
    booking.reviewedBy = req.user.id
    booking.reviewedAt = new Date()
    booking.rejectionReason = rejectionReason
    if (adminNotes) booking.adminNotes = adminNotes

    await booking.save()
    await booking.populate('user', 'name email phone')
    await booking.populate('reviewedBy', 'name email')

    res.status(200).json({
      success: true,
      message: 'Booking rejected',
      data: booking
    })
  } catch (error) {
    console.error('Reject booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting booking'
    })
  }
}

// @desc    Mark booking as completed (Admin)
// @route   PUT /api/bookings/:id/complete
// @access  Private (Admin only)
export const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved bookings can be marked as completed'
      })
    }

    booking.status = 'completed'
    await booking.save()

    res.status(200).json({
      success: true,
      message: 'Booking marked as completed',
      data: booking
    })
  } catch (error) {
    console.error('Complete booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while completing booking'
    })
  }
}

// @desc    Get booking statistics (Admin)
// @route   GET /api/bookings/admin/stats
// @access  Private (Admin only)
export const getAdminStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])

    const totalBookings = await Booking.countDocuments()
    const pendingCount = await Booking.countDocuments({ status: 'pending' })
    const upcomingCount = await Booking.countDocuments({
      status: 'approved',
      eventDate: { $gte: new Date() }
    })

    // Get monthly revenue
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'completed'] },
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ])

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        total: totalBookings,
        pending: pendingCount,
        upcoming: upcomingCount,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        recentBookings
      }
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    })
  }
}

// @desc    Get bookings by date range (Admin - for calendar)
// @route   GET /api/bookings/admin/calendar
// @access  Private (Admin only)
export const getCalendarBookings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide startDate and endDate'
      })
    }

    const bookings = await Booking.find({
      eventDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
      .populate('user', 'name email phone')
      .sort({ eventDate: 1, startTime: 1 })

    // Get locked dates
    const lockedDates = await LockedDate.find({
      isActive: true,
      $or: [
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { startDate: { $lte: new Date(startDate) }, endDate: { $gte: new Date(endDate) } }
      ]
    }).populate('createdBy', 'name email')

    res.status(200).json({
      success: true,
      data: {
        bookings,
        lockedDates
      }
    })
  } catch (error) {
    console.error('Get calendar bookings error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching calendar data'
    })
  }
}

// @desc    Get refunds (cancelled bookings with refund pending)
// @route   GET /api/bookings/admin/refunds
// @access  Private (Admin only)
export const getRefunds = async (req, res) => {
  try {
    const refunds = await Booking.find({
      status: 'cancelled',
      refundStatus: { $in: ['pending', 'processed', 'failed'] }
    })
      .sort({ cancelledAt: -1 })
      .populate('user', 'name email phone')

    res.status(200).json({
      success: true,
      count: refunds.length,
      data: refunds
    })
  } catch (error) {
    console.error('Get refunds error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching refunds' })
  }
}

// @desc    Process a refund
// @route   PUT /api/bookings/:id/process-refund
// @access  Private (Admin only)
export const processRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    if (booking.refundStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending refund for this booking' })
    }

    booking.refundStatus = 'processed'
    await booking.save()

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: booking
    })
  } catch (error) {
    console.error('Process refund error:', error)
    res.status(500).json({ success: false, message: 'Server error while processing refund' })
  }
}

// @desc    Set/Update booking price (Admin)
// @route   PUT /api/bookings/:id/set-price
// @access  Private (Admin only)
export const setBookingPrice = async (req, res) => {
  try {
    const { totalAmount } = req.body

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid price amount' })
    }

    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Can only set price on approved bookings' })
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot change price after payment' })
    }

    booking.totalAmount = totalAmount
    booking.baseAmount = totalAmount
    await booking.save()
    await booking.populate('user', 'name email phone')

    res.status(200).json({
      success: true,
      message: 'Booking price updated successfully',
      data: booking
    })
  } catch (error) {
    console.error('Set booking price error:', error)
    res.status(500).json({ success: false, message: 'Server error while updating price' })
  }
}

// @desc    Create Razorpay payment order
// @route   POST /api/bookings/:id/create-order
// @access  Private
export const createPaymentOrder = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Booking must be approved before payment' })
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Payment already completed' })
    }

    const options = {
      amount: Math.round(booking.totalAmount * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        eventName: booking.eventName,
        userId: req.user.id
      }
    }

    const order = await getRazorpay().orders.create(options)

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking._id,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    })
  } catch (error) {
    console.error('Create payment order error:', error)
    res.status(500).json({ success: false, message: 'Failed to create payment order' })
  }
}

// @desc    Verify Razorpay payment
// @route   POST /api/bookings/:id/verify-payment
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' })
    }

    // Update booking payment status
    booking.paymentStatus = 'paid'
    booking.paymentId = razorpay_payment_id
    await booking.save()

    // Auto-create cashbook entry for this payment
    try {
      await booking.populate('user', 'name email phone')
      const now = new Date()
      const yr = now.getFullYear()
      const receiptNumber = await CashbookEntry.generateReceiptNumber(yr)
      
      // Also update the booking with this permanent receipt number
      booking.receiptNumber = receiptNumber
      await booking.save()

      await CashbookEntry.create({
        entryDate: now,
        paymentDate: now,
        name: booking.contactName || booking.user?.name || 'Unknown',
        phone: booking.contactPhone || '',
        userId: booking.user?._id || booking.user,
        category: `Hall Booking - ${booking.eventType || booking.eventName}`,
        receiptNumber,
        paymentMode: 'online',
        type: 'credit',
        amount: booking.totalAmount,
        status: 'completed',
        description: `Payment for booking: ${booking.eventName} on ${new Date(booking.eventDate).toLocaleDateString('en-IN')}`,
        source: 'booking',
        bookingId: booking._id,
        year: yr,
        month: now.getMonth() + 1
      })
    } catch (cashbookErr) {
      console.error('Auto cashbook entry error (non-fatal):', cashbookErr)
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: booking
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    res.status(500).json({ success: false, message: 'Payment verification failed' })
  }
}