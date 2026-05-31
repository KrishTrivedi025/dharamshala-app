import CashbookEntry from '../models/CashbookEntry.js'
import User from '../models/User.js'
import Settings from '../models/Settings.js'

// @desc    Get all cashbook entries (with filters)
// @route   GET /api/cashbook
// @access  Private (Admin only)
export const getEntries = async (req, res) => {
  try {
    const {
      year, month, type, source, status,
      search, sort = '-entryDate',
      page = 1, limit = 50,
      fromDate, toDate
    } = req.query

    const query = {}
    if (year) query.year = parseInt(year)
    if (month) query.month = parseInt(month)
    if (type) query.type = type
    if (source) query.source = source
    if (status) query.status = status

    if (fromDate || toDate) {
      query.entryDate = {}
      if (fromDate) query.entryDate.$gte = new Date(fromDate)
      if (toDate) query.entryDate.$lte = new Date(new Date(toDate).setHours(23, 59, 59, 999))
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { receiptNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const entries = await CashbookEntry.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email phone')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')

    const total = await CashbookEntry.countDocuments(query)

    res.status(200).json({
      success: true,
      count: entries.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: entries
    })
  } catch (error) {
    console.error('Get cashbook entries error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching cashbook entries' })
  }
}

// @desc    Create a manual cashbook entry
// @route   POST /api/cashbook
// @access  Private (Admin only)
export const createEntry = async (req, res) => {
  try {
    const {
      entryDate, paymentDate, name, phone, userId,
      category, paymentMode, type, amount,
      status, description, source
    } = req.body

    if (!name || !category || !paymentMode || !type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, category, paymentMode, type, amount'
      })
    }

    const dateObj = entryDate ? new Date(entryDate) : new Date()
    const yr = dateObj.getFullYear()
    const receiptNumber = await CashbookEntry.generateReceiptNumber(yr)

    const entry = await CashbookEntry.create({
      entryDate: dateObj,
      paymentDate: paymentDate ? new Date(paymentDate) : (status === 'completed' ? dateObj : null),
      name,
      phone: phone || '',
      userId: userId || null,
      category,
      receiptNumber,
      paymentMode,
      type,
      amount: parseFloat(amount),
      status: status || 'completed',
      description: description || '',
      source: source || 'manual',
      createdBy: req.user.id,
      year: yr,
      month: dateObj.getMonth() + 1
    })

    await entry.populate('userId', 'name email phone')
    await entry.populate('createdBy', 'name')

    res.status(201).json({
      success: true,
      message: 'Cashbook entry created successfully',
      data: entry
    })
  } catch (error) {
    console.error('Create cashbook entry error:', error)
    res.status(500).json({ success: false, message: 'Server error while creating cashbook entry' })
  }
}

// @desc    Update a cashbook entry
// @route   PUT /api/cashbook/:id
// @access  Private (Admin only)
export const updateEntry = async (req, res) => {
  try {
    const entry = await CashbookEntry.findById(req.params.id)

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Cashbook entry not found' })
    }

    const allowedUpdates = [
      'name', 'phone', 'category', 'paymentMode', 'type',
      'amount', 'status', 'description', 'entryDate', 'paymentDate'
    ]

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'entryDate' || field === 'paymentDate') {
          entry[field] = req.body[field] ? new Date(req.body[field]) : null
        } else if (field === 'amount') {
          entry[field] = parseFloat(req.body[field])
        } else {
          entry[field] = req.body[field]
        }
      }
    })

    // If status changed to completed and no paymentDate set, set it now
    if (req.body.status === 'completed' && !entry.paymentDate) {
      entry.paymentDate = new Date()
    }

    entry.updatedBy = req.user.id
    await entry.save()

    await entry.populate('userId', 'name email phone')
    await entry.populate('createdBy', 'name')
    await entry.populate('updatedBy', 'name')

    res.status(200).json({
      success: true,
      message: 'Cashbook entry updated successfully',
      data: entry
    })
  } catch (error) {
    console.error('Update cashbook entry error:', error)
    res.status(500).json({ success: false, message: 'Server error while updating cashbook entry' })
  }
}

// @desc    Delete a cashbook entry
// @route   DELETE /api/cashbook/:id
// @access  Private (Admin only)
export const deleteEntry = async (req, res) => {
  try {
    const entry = await CashbookEntry.findById(req.params.id)

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Cashbook entry not found' })
    }

    await CashbookEntry.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Cashbook entry deleted successfully'
    })
  } catch (error) {
    console.error('Delete cashbook entry error:', error)
    res.status(500).json({ success: false, message: 'Server error while deleting cashbook entry' })
  }
}

// @desc    Get cashbook summary (totals for income, expense, balance)
// @route   GET /api/cashbook/summary
// @access  Private (Admin only)
export const getSummary = async (req, res) => {
  try {
    const { year, month } = req.query

    const matchStage = {}
    if (year) matchStage.year = parseInt(year)
    if (month) matchStage.month = parseInt(month)

    const summary = await CashbookEntry.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          completedTotal: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
          },
          pendingTotal: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
          }
        }
      }
    ])

    const credit = summary.find(s => s._id === 'credit') || { total: 0, count: 0, completedTotal: 0, pendingTotal: 0 }
    const debit = summary.find(s => s._id === 'debit') || { total: 0, count: 0, completedTotal: 0, pendingTotal: 0 }

    res.status(200).json({
      success: true,
      data: {
        totalIncome: credit.total,
        totalExpense: debit.total,
        balance: credit.completedTotal - debit.completedTotal,
        incomeCount: credit.count,
        expenseCount: debit.count,
        pendingIncome: credit.pendingTotal,
        pendingExpense: debit.pendingTotal,
        completedIncome: credit.completedTotal,
        completedExpense: debit.completedTotal
      }
    })
  } catch (error) {
    console.error('Get cashbook summary error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching summary' })
  }
}

// @desc    Get next receipt number
// @route   GET /api/cashbook/next-receipt
// @access  Private (Admin only)
export const getNextReceipt = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear()
    const receiptNumber = await CashbookEntry.generateReceiptNumber(parseInt(year))

    res.status(200).json({
      success: true,
      data: { receiptNumber }
    })
  } catch (error) {
    console.error('Get next receipt error:', error)
    res.status(500).json({ success: false, message: 'Server error while generating receipt number' })
  }
}

// @desc    Get annual ritual payments for a year (all members with status)
// @route   GET /api/cashbook/annual-rituals/:year
// @access  Private (Admin only)
export const getAnnualRituals = async (req, res) => {
  try {
    const year = parseInt(req.params.year)

    // Get all active non-admin users (members of the samaj)
    const allUsers = await User.find({ isActive: true, role: 'user' })
      .select('name email phone')
      .sort({ name: 1 })

    // Get all annual ritual entries for this year
    const ritualEntries = await CashbookEntry.find({
      source: 'annual_ritual',
      year: year
    }).populate('userId', 'name email phone')

    // Get the configured annual ritual fee
    const annualFee = await Settings.get('annualRitualFee', 1200)

    // Build member list with payment status
    const members = allUsers.map(user => {
      const entry = ritualEntries.find(
        e => e.userId && e.userId._id.toString() === user._id.toString()
      )
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: entry ? entry.status : 'not_paid',
        amount: entry ? entry.amount : annualFee,
        paymentDate: entry ? entry.paymentDate : null,
        paymentMode: entry ? entry.paymentMode : null,
        receiptNumber: entry ? entry.receiptNumber : null,
        entryId: entry ? entry._id : null,
        receiptReady: entry ? (entry.status === 'completed') : false
      }
    })

    // Also include non-registered members (entries with no userId but with name)
    const guestEntries = ritualEntries.filter(e => !e.userId)
    guestEntries.forEach(entry => {
      members.push({
        userId: null,
        name: entry.name,
        email: '',
        phone: entry.phone || '',
        status: entry.status,
        amount: entry.amount,
        paymentDate: entry.paymentDate,
        paymentMode: entry.paymentMode,
        receiptNumber: entry.receiptNumber,
        entryId: entry._id,
        receiptReady: entry.status === 'completed'
      })
    })

    res.status(200).json({
      success: true,
      data: {
        year,
        annualFee,
        totalMembers: members.length,
        paid: members.filter(m => m.status === 'completed').length,
        pending: members.filter(m => m.status === 'pending').length,
        notPaid: members.filter(m => m.status === 'not_paid').length,
        members
      }
    })
  } catch (error) {
    console.error('Get annual rituals error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching annual ritual data' })
  }
}

// @desc    Record an annual ritual payment for a member
// @route   POST /api/cashbook/annual-rituals
// @access  Private (Admin only)
export const recordRitualPayment = async (req, res) => {
  try {
    const { userId, name, phone, year, amount, paymentMode, paymentDate, status } = req.body

    if (!name || !year || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, year, and amount'
      })
    }

    // Check if entry already exists for this user and year
    if (userId) {
      const existing = await CashbookEntry.findOne({
        userId,
        source: 'annual_ritual',
        year: parseInt(year)
      })
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Annual ritual payment already recorded for this member this year. Use update instead.'
        })
      }
    }

    const dateObj = paymentDate ? new Date(paymentDate) : new Date()
    const yr = parseInt(year)
    const receiptNumber = await CashbookEntry.generateReceiptNumber(yr)

    const entryStatus = status || (paymentMode === 'online' ? 'completed' : 'pending')

    const entry = await CashbookEntry.create({
      entryDate: dateObj,
      paymentDate: entryStatus === 'completed' ? dateObj : null,
      name,
      phone: phone || '',
      userId: userId || null,
      category: 'Annual Ritual Payment (Pooja Shulk)',
      receiptNumber,
      paymentMode: paymentMode || 'cash',
      type: 'credit',
      amount: parseFloat(amount),
      status: entryStatus,
      description: `Annual ritual payment for year ${yr}`,
      source: 'annual_ritual',
      createdBy: req.user.id,
      year: yr,
      month: dateObj.getMonth() + 1
    })

    await entry.populate('userId', 'name email phone')

    res.status(201).json({
      success: true,
      message: 'Annual ritual payment recorded successfully',
      data: entry
    })
  } catch (error) {
    console.error('Record ritual payment error:', error)
    res.status(500).json({ success: false, message: 'Server error while recording ritual payment' })
  }
}

// @desc    Update annual ritual payment status
// @route   PUT /api/cashbook/annual-rituals/:id
// @access  Private (Admin only)
export const updateRitualPayment = async (req, res) => {
  try {
    const entry = await CashbookEntry.findById(req.params.id)

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' })
    }

    if (entry.source !== 'annual_ritual') {
      return res.status(400).json({ success: false, message: 'This is not an annual ritual entry' })
    }

    const { status, paymentMode, paymentDate, amount } = req.body

    if (status) entry.status = status
    if (paymentMode) entry.paymentMode = paymentMode
    if (amount) entry.amount = parseFloat(amount)

    if (status === 'completed' && !entry.paymentDate) {
      entry.paymentDate = paymentDate ? new Date(paymentDate) : new Date()
    } else if (paymentDate) {
      entry.paymentDate = new Date(paymentDate)
    }

    entry.updatedBy = req.user.id
    await entry.save()

    await entry.populate('userId', 'name email phone')

    res.status(200).json({
      success: true,
      message: 'Ritual payment updated successfully',
      data: entry
    })
  } catch (error) {
    console.error('Update ritual payment error:', error)
    res.status(500).json({ success: false, message: 'Server error while updating ritual payment' })
  }
}
