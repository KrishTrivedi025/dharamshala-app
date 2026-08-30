import CashbookEntry from '../models/CashbookEntry.js'
import User from '../models/User.js'
import Settings from '../models/Settings.js'

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// @desc    Get all cashbook entries (with filters)
// @route   GET /api/cashbook
// @access  Private (Admin only)
const ANNUAL_RITUAL_START_YEAR = 2020

// Build placeholder "not yet paid" annual ritual rows for eligible members who have
// no real CashbookEntry for a given year, so they remain visible in the ledger
// instead of only being discoverable via the Annual Ritual tab. A member is only
// "eligible" for a year if their account already existed by then. The row is
// labelled 'not_paid' while it's still the current year (open ask) and flips to
// 'pending' once the year has passed (overdue), with no code change needed as time goes on.
const buildUnpaidRitualEntries = async (years, search) => {
  const CURRENT_YEAR = new Date().getFullYear()
  const [allUsers, existingRitualEntries, annualFee] = await Promise.all([
    User.find({ isActive: true, role: 'user' }).select('name phone createdAt'),
    CashbookEntry.find({ source: 'annual_ritual', year: { $in: years } }).select('userId year'),
    Settings.get('annualRitualFee', 1200)
  ])

  const virtuals = []
  years.forEach(y => {
    const eligibleUsers = allUsers.filter(u => u.createdAt.getFullYear() <= y)
    eligibleUsers.forEach(user => {
      const hasEntry = existingRitualEntries.some(
        e => e.userId && e.userId.toString() === user._id.toString() && e.year === y
      )
      if (!hasEntry) {
        virtuals.push({
          _id: `virtual-ritual-${y}-${user._id}`,
          entryDate: new Date(y, 0, 1),
          paymentDate: null,
          name: user.name,
          phone: user.phone || '',
          userId: user._id,
          category: 'Annual Ritual Payment (Pooja Shulk)',
          receiptNumber: null,
          paymentMode: null,
          type: 'credit',
          amount: annualFee,
          status: 'not_paid',
          displayStatus: y === CURRENT_YEAR ? 'not_paid' : 'pending',
          description: '',
          source: 'annual_ritual',
          year: y,
          month: 1,
          isVirtual: true
        })
      }
    })
  })

  if (!search) return virtuals
  const re = new RegExp(search, 'i')
  return virtuals.filter(v => re.test(v.name) || re.test(v.category))
}

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

    let allEntries = await CashbookEntry.find(query)
      .populate('userId', 'name email phone')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')

    // Only inject unpaid-member placeholder rows when the active filters don't
    // already exclude them (a real entry status/date-range/month/debit filter has
    // nothing to do with members who have no entry at all).
    const includeUnpaid = !status && !fromDate && !toDate && !month && type !== 'debit' &&
      (!source || source === 'annual_ritual')
    if (includeUnpaid) {
      const CURRENT_YEAR = new Date().getFullYear()
      const years = year
        ? [parseInt(year)]
        : Array.from({ length: CURRENT_YEAR - ANNUAL_RITUAL_START_YEAR + 1 }, (_, i) => ANNUAL_RITUAL_START_YEAR + i)
      const unpaidEntries = await buildUnpaidRitualEntries(years, search)
      allEntries = [...allEntries, ...unpaidEntries]
    }

    // Attach a year-aware `displayStatus` to every row: annual ritual entries that
    // aren't completed read 'not_paid' while still the current ask year and flip to
    // 'pending' (overdue) once the year has passed, regardless of whether they're a
    // real cash-request entry or a virtual placeholder. Other entries pass through
    // their real status untouched.
    const CURRENT_YEAR_FOR_DISPLAY = new Date().getFullYear()
    allEntries = allEntries.map(e => {
      const obj = e.toObject ? e.toObject() : e
      if (obj.source === 'annual_ritual' && obj.status !== 'completed') {
        obj.displayStatus = obj.year === CURRENT_YEAR_FOR_DISPLAY ? 'not_paid' : 'pending'
        if (obj.status !== 'not_paid') {
          obj.paymentMode = null
        }
      } else {
        obj.displayStatus = obj.status
      }
      return obj
    })

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortDir = sort.startsWith('-') ? -1 : 1
    allEntries.sort((a, b) => (new Date(a[sortField]) - new Date(b[sortField])) * sortDir)

    const total = allEntries.length
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const entries = allEntries.slice(skip, skip + parseInt(limit))

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
      status, description, source, receiptNumber: customReceiptNumber
    } = req.body

    if (!name || !category || !paymentMode || !type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, category, paymentMode, type, amount'
      })
    }

    const dateObj = entryDate ? new Date(entryDate) : new Date()
    const yr = dateObj.getFullYear()
    const receiptNumber = customReceiptNumber?.trim()
      ? customReceiptNumber.trim()
      : await CashbookEntry.generateReceiptNumber(yr)

    // If no registered account was explicitly linked, fall back to an exact
    // (case-insensitive) name match so this entry counts as "paid" for that
    // account and the Annual Ritual tab doesn't also show them as a separate
    // unpaid placeholder row.
    let linkedUserId = userId || null
    if (!linkedUserId && name) {
      const matchedUser = await User.findOne({
        isActive: true, role: 'user',
        name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i')
      }).select('_id')
      if (matchedUser) linkedUserId = matchedUser._id
    }

    // Prevent double-submits (e.g. a double-tap on Save) from creating two
    // annual ritual entries for the same person + year.
    const effectiveSource = source || 'manual'
    if (effectiveSource === 'annual_ritual') {
      const dupQuery = linkedUserId
        ? { source: 'annual_ritual', year: yr, userId: linkedUserId }
        : { source: 'annual_ritual', year: yr, userId: null, name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') }
      const existing = await CashbookEntry.findOne(dupQuery)
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `${name} already has an annual ritual entry for ${yr} (${existing.status}). Edit that entry instead of adding a new one.`
        })
      }
    }

    const entry = await CashbookEntry.create({
      entryDate: dateObj,
      paymentDate: paymentDate ? new Date(paymentDate) : (status === 'completed' ? dateObj : null),
      name,
      phone: phone || '',
      userId: linkedUserId,
      category,
      receiptNumber,
      paymentMode,
      type,
      amount: parseFloat(amount),
      status: status || 'completed',
      description: description || '',
      source: effectiveSource,
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
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This receipt number is already used for this year. Please use a different one.' })
    }
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
      'amount', 'status', 'description', 'entryDate', 'paymentDate',
      'receiptNumber', 'source'
    ]

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'entryDate' || field === 'paymentDate') {
          entry[field] = req.body[field] ? new Date(req.body[field]) : null
        } else if (field === 'amount') {
          entry[field] = parseFloat(req.body[field])
        } else if (field === 'receiptNumber') {
          entry[field] = req.body[field].trim()
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
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This receipt number is already used for this year. Please use a different one.' })
    }
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
    const receiptNumber = await CashbookEntry.peekNextReceiptNumber(parseInt(year))

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
    const yearParam = req.params.year
    const isAllYears = yearParam === 'all'
    const CURRENT_YEAR = new Date().getFullYear()
    const START_YEAR = 2020

    // Get all active non-admin users (members of the samaj)
    const allUsers = await User.find({ isActive: true, role: 'user' })
      .select('name email phone createdAt')
      .sort({ name: 1 })

    // Get the configured annual ritual fee
    const annualFee = await Settings.get('annualRitualFee', 1200)

    // Build the member list for a single year — only members whose account
    // already existed that year are included, so new signups don't retroactively
    // show as "not paid" for years before they joined.
    // The raw `status` field always reflects the true DB value ('completed'/'pending',
    // or the 'not_paid' sentinel when no entry exists at all) and must stay untouched
    // since it's echoed back into the record/edit form and re-submitted on save.
    // `displayStatus` is the year-aware label actually shown in the UI: any unpaid
    // entry (real 'pending' cash-request or virtual no-entry) reads 'not_paid' while
    // it's still the current ask year, and flips to 'pending' (overdue) once the
    // year has passed — no code change needed as time goes on.
    const computeDisplayStatus = (rawStatus, year) =>
      rawStatus === 'completed' ? 'completed' : (year === CURRENT_YEAR ? 'not_paid' : 'pending')

    const buildMembersForYear = (year, yearEntries) => {
      const eligibleUsers = allUsers.filter(u => u.createdAt.getFullYear() <= year)

      const yearMembers = eligibleUsers.map(user => {
        const entry = yearEntries.find(
          e => e.userId && e.userId._id.toString() === user._id.toString()
        )
        const rawStatus = entry ? entry.status : 'not_paid'
        return {
          userId: user._id,
          // Prefer the entry's own name/phone (the admin may have edited them
          // after the entry was auto-linked to this account) over the account's,
          // so search and display stay consistent with what was actually saved.
          name: entry ? entry.name : user.name,
          email: user.email,
          phone: entry?.phone || user.phone,
          year,
          status: rawStatus,
          displayStatus: computeDisplayStatus(rawStatus, year),
          amount: entry ? entry.amount : annualFee,
          paymentDate: entry && entry.status === 'completed' ? entry.paymentDate : null,
          paymentMode: entry && entry.status === 'completed' ? entry.paymentMode : null,
          receiptNumber: entry ? entry.receiptNumber : null,
          entryId: entry ? entry._id : null,
          receiptReady: entry ? (entry.status === 'completed') : false
        }
      })

      // Also include non-registered members (entries with no userId but with name)
      const guestEntries = yearEntries.filter(e => !e.userId)
      guestEntries.forEach(entry => {
        yearMembers.push({
          userId: null,
          name: entry.name,
          email: '',
          phone: entry.phone || '',
          year,
          status: entry.status,
          displayStatus: computeDisplayStatus(entry.status, year),
          amount: entry.amount,
          paymentDate: entry.status === 'completed' ? entry.paymentDate : null,
          paymentMode: entry.status === 'completed' ? entry.paymentMode : null,
          receiptNumber: entry.receiptNumber,
          entryId: entry._id,
          receiptReady: entry.status === 'completed'
        })
      })

      return yearMembers
    }

    let members = []
    if (isAllYears) {
      const allEntries = await CashbookEntry.find({ source: 'annual_ritual' }).populate('userId', 'name email phone')
      for (let y = START_YEAR; y <= CURRENT_YEAR; y++) {
        members = members.concat(buildMembersForYear(y, allEntries.filter(e => e.year === y)))
      }
    } else {
      const year = parseInt(yearParam)
      const yearEntries = await CashbookEntry.find({
        source: 'annual_ritual',
        year
      }).populate('userId', 'name email phone')
      members = buildMembersForYear(year, yearEntries)
    }

    res.status(200).json({
      success: true,
      data: {
        year: isAllYears ? 'all' : parseInt(yearParam),
        annualFee,
        totalMembers: members.length,
        paid: members.filter(m => m.displayStatus === 'completed').length,
        pending: members.filter(m => m.displayStatus === 'pending').length,
        notPaid: members.filter(m => m.displayStatus === 'not_paid').length,
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
